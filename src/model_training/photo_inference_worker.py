from __future__ import annotations

import argparse
import base64
import importlib
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen

import cv2
import numpy as np
from ultralytics import YOLO


DEFAULT_MODEL_PATH = Path(
    "yolo_trash_seg.pt"
)
IMAGE_ID_COLUMNS = ("i_id", "image_id", "id")
REPORT_ID_COLUMNS = ("report_id", "r_id")
IMAGE_BYTES_COLUMNS = ("img", "image", "image_bytes")
IMAGE_URL_COLUMNS = ("public_url", "image_url", "url")
STORAGE_PATH_COLUMNS = ("storage_path", "path")
BUCKET_COLUMNS = ("bucket_name", "bucket")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Process pending image rows with YOLO segmentation and update report scores."
    )
    parser.add_argument("--supabase-url", type=str, required=True)
    parser.add_argument("--supabase-service-key", type=str, required=True)
    parser.add_argument("--table", type=str, default="images", help="Image table name.")
    parser.add_argument("--report-table", type=str, default="reports", help="Report table name.")
    parser.add_argument("--model", type=str, default=str(DEFAULT_MODEL_PATH))
    parser.add_argument("--batch-size", type=int, default=5)
    parser.add_argument("--poll-seconds", type=float, default=2.0)
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--once", action="store_true", help="Process one batch and exit.")
    return parser.parse_args()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def first_present_key(payload: dict[str, Any], candidates: tuple[str, ...]) -> str | None:
    for key in candidates:
        if key in payload:
            return key
    return None


def parse_db_image(raw_value: Any) -> bytes:
    if isinstance(raw_value, bytes):
        return raw_value

    if isinstance(raw_value, str):
        value = raw_value.strip()
        if value.startswith("\\x"):
            return bytes.fromhex(value[2:])

        try:
            return base64.b64decode(value, validate=True)
        except Exception:
            pass

    raise ValueError("Unsupported image byte format from database row.")


def decode_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Image decoding failed.")
    return image


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def compute_metrics(result: Any) -> tuple[float, int]:
    if result.masks is not None and result.masks.data is not None and result.masks.data.shape[0] > 0:
        masks = result.masks.data.detach().cpu().numpy() > 0.5
        union_mask = np.any(masks, axis=0)
        coverage = float(np.mean(union_mask))
        instances = int(masks.shape[0])
        return coverage, instances

    box_count = 0
    if result.boxes is not None:
        box_count = int(result.boxes.shape[0])

    return 0.0, box_count


def compute_image_composite_score(coverage: float, instances: int) -> float:
    normalized_coverage = clamp(float(coverage), 0.0, 1.0)
    normalized_instances = float(max(instances, 0)) / float(max(instances, 0) + 3)
    return clamp((normalized_coverage * 0.75) + (normalized_instances * 0.25), 0.0, 1.0)


def composite_score_to_severity(score: float) -> int:
    normalized_score = clamp(float(score), 0.0, 1.0)
    return int(clamp(math.floor(1 + (4 * normalized_score) + 0.5), 1, 5))


class PhotoInferenceWorker:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        supabase_module = importlib.import_module("supabase")
        create_client = getattr(supabase_module, "create_client", None)
        if create_client is None:
            raise ImportError("supabase package does not expose create_client.")

        self.client = create_client(args.supabase_url, args.supabase_service_key)

        model_path = Path(args.model).expanduser().resolve()
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        self.model = YOLO(str(model_path))
        print(f"Loaded model: {model_path}")

    def run(self) -> None:
        while True:
            rows = self.fetch_pending_rows()
            if not rows:
                if self.args.once:
                    return
                time.sleep(self.args.poll_seconds)
                continue

            for row in rows:
                self.process_row(row)

            if self.args.once:
                return

    def fetch_pending_rows(self) -> list[dict[str, Any]]:
        resp = (
            self.client.table(self.args.table)
            .select("*")
            .eq("inference_status", "pending")
            .order("created_at")
            .limit(self.args.batch_size)
            .execute()
        )
        return list(resp.data or [])

    def process_row(self, row: dict[str, Any]) -> None:
        image_id_key = first_present_key(row, IMAGE_ID_COLUMNS)
        report_id_key = first_present_key(row, REPORT_ID_COLUMNS)
        image_bytes_key = first_present_key(row, IMAGE_BYTES_COLUMNS)

        if image_id_key is None or report_id_key is None:
            print("Skipping row due to missing expected columns.")
            return

        image_id = row[image_id_key]
        report_id = row[report_id_key]

        if not self.claim_job(image_id_key, image_id):
            return

        try:
            image_bytes = self.get_image_bytes(row, image_bytes_key)
            image = decode_image(image_bytes)
            results = self.model.predict(
                source=image,
                conf=self.args.conf,
                imgsz=self.args.imgsz,
                verbose=False,
            )
            coverage, instances = compute_metrics(results[0])

            (
                self.client.table(self.args.table)
                .update(
                    {
                        "inference_status": "completed",
                        "trash_coverage": coverage,
                        "trash_instances": instances,
                        "inference_error": None,
                        "processed_at": utc_now_iso(),
                    }
                )
                .eq(image_id_key, image_id)
                .execute()
            )

            self.refresh_report_scores(report_id_key, report_id)
            print(
                f"Processed image {image_id}: coverage={coverage:.4f}, instances={instances}, report={report_id}"
            )
        except Exception as exc:
            (
                self.client.table(self.args.table)
                .update(
                    {
                        "inference_status": "failed",
                        "inference_error": str(exc)[:1000],
                        "processed_at": utc_now_iso(),
                    }
                )
                .eq(image_id_key, image_id)
                .execute()
            )
            print(f"Failed image {image_id}: {exc}")

    def claim_job(self, image_id_key: str, image_id: Any) -> bool:
        resp = (
            self.client.table(self.args.table)
            .update({"inference_status": "processing", "processed_at": None, "inference_error": None})
            .eq(image_id_key, image_id)
            .eq("inference_status", "pending")
            .select(image_id_key)
            .execute()
        )
        return bool(resp.data)

    def get_image_bytes(self, row: dict[str, Any], image_bytes_key: str | None) -> bytes:
        if image_bytes_key is not None and row.get(image_bytes_key) is not None:
            return parse_db_image(row[image_bytes_key])

        image_url_key = first_present_key(row, IMAGE_URL_COLUMNS)
        if image_url_key is not None and row.get(image_url_key):
            return self.download_bytes_from_url(str(row[image_url_key]))

        storage_path_key = first_present_key(row, STORAGE_PATH_COLUMNS)
        bucket_key = first_present_key(row, BUCKET_COLUMNS)
        if storage_path_key is not None and bucket_key is not None:
            storage_path = row.get(storage_path_key)
            bucket_name = row.get(bucket_key)
            if storage_path and bucket_name:
                return self.download_bytes_from_storage(str(bucket_name), str(storage_path))

        raise ValueError("Image row does not include supported image data columns.")

    def download_bytes_from_url(self, url: str) -> bytes:
        try:
            with urlopen(url, timeout=30) as response:
                data = response.read()
                if not data:
                    raise ValueError("Downloaded image is empty.")
                return data
        except URLError as exc:
            raise ValueError(f"Failed to download image from URL: {exc}") from exc

    def download_bytes_from_storage(self, bucket_name: str, storage_path: str) -> bytes:
        try:
            storage_api = self.client.storage.from_(bucket_name)
            data = storage_api.download(storage_path)
        except Exception as exc:
            raise ValueError(
                f"Failed to download image from storage bucket={bucket_name} path={storage_path}: {exc}"
            ) from exc

        if not data:
            raise ValueError("Downloaded image from storage is empty.")
        return data

    def refresh_report_scores(self, report_id_key: str, report_id: Any) -> None:
        scored_rows_resp = (
            self.client.table(self.args.table)
            .select("trash_coverage,trash_instances")
            .eq(report_id_key, report_id)
            .eq("inference_status", "completed")
            .execute()
        )
        scored_rows = list(scored_rows_resp.data or [])

        if scored_rows:
            coverages = [float(r["trash_coverage"]) for r in scored_rows if r.get("trash_coverage") is not None]
            instances = [float(r["trash_instances"]) for r in scored_rows if r.get("trash_instances") is not None]
            avg_coverage = float(sum(coverages) / len(coverages)) if coverages else None
            avg_instances = float(sum(instances) / len(instances)) if instances else None
            scored_count = len(scored_rows)
            composite_values = [
                compute_image_composite_score(
                    float(r.get("trash_coverage") or 0.0),
                    int(float(r.get("trash_instances") or 0.0)),
                )
                for r in scored_rows
            ]
            composite_score = float(sum(composite_values) / len(composite_values)) if composite_values else 0.0
            severity = composite_score_to_severity(composite_score)
        else:
            avg_coverage = None
            avg_instances = None
            scored_count = 0
            composite_score = None
            severity = None

        self.update_report_aggregate(
            report_id=report_id,
            avg_coverage=avg_coverage,
            avg_instances=avg_instances,
            scored_count=scored_count,
            composite_score=composite_score,
            severity=severity,
        )

    def update_report_aggregate(
        self,
        report_id: Any,
        avg_coverage: float | None,
        avg_instances: float | None,
        scored_count: int,
        composite_score: float | None,
        severity: int | None,
    ) -> None:
        payload = {
            "avg_trash_coverage": avg_coverage,
            "avg_trash_instances": avg_instances,
            "scored_image_count": scored_count,
            "composite_trash_score": composite_score,
            "severity": severity,
            "severity_updated_at": utc_now_iso(),
            "trash_updated_at": utc_now_iso(),
        }

        update_result = (
            self.client.table(self.args.report_table)
            .update(payload)
            .eq("report_id", report_id)
            .execute()
        )
        if update_result.data:
            return

        # Older schema fallback.
        (
            self.client.table(self.args.report_table)
            .update(payload)
            .eq("r_id", report_id)
            .execute()
        )


def main() -> None:
    args = parse_args()
    worker = PhotoInferenceWorker(args)
    worker.run()


if __name__ == "__main__":
    main()
