from __future__ import annotations

import argparse
import base64
import importlib
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from ultralytics import YOLO


DEFAULT_MODEL_PATH = Path(
    "yolo_trash_seg.pt"
)
IMAGE_ID_COLUMNS = ("i_id", "image_id", "id")
REPORT_ID_COLUMNS = ("report_id", "r_id")
IMAGE_BYTES_COLUMNS = ("img", "image", "image_bytes")


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


def dense_rank_desc(values_by_id: dict[str, float]) -> dict[str, int]:
    unique_vals = sorted(set(values_by_id.values()), reverse=True)
    rank_for_value = {value: idx + 1 for idx, value in enumerate(unique_vals)}
    return {row_id: rank_for_value[value] for row_id, value in values_by_id.items()}


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

        if image_id_key is None or report_id_key is None or image_bytes_key is None:
            print("Skipping row due to missing expected columns.")
            return

        image_id = row[image_id_key]
        report_id = row[report_id_key]

        if not self.claim_job(image_id_key, image_id):
            return

        try:
            image_bytes = parse_db_image(row[image_bytes_key])
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
        else:
            avg_coverage = None
            avg_instances = None
            scored_count = 0

        self.update_report_aggregate(report_id, avg_coverage, avg_instances, scored_count)
        self.refresh_report_ranks()

    def update_report_aggregate(
        self,
        report_id: Any,
        avg_coverage: float | None,
        avg_instances: float | None,
        scored_count: int,
    ) -> None:
        payload = {
            "avg_trash_coverage": avg_coverage,
            "avg_trash_instances": avg_instances,
            "scored_image_count": scored_count,
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

    def refresh_report_ranks(self) -> None:
        report_rows, report_id_key = self.fetch_rank_source_rows()
        if not report_rows:
            return

        coverage_values: dict[str, float] = {}
        instance_values: dict[str, float] = {}

        for row in report_rows:
            row_id = str(row[report_id_key])
            if row.get("avg_trash_coverage") is not None:
                coverage_values[row_id] = float(row["avg_trash_coverage"])
            if row.get("avg_trash_instances") is not None:
                instance_values[row_id] = float(row["avg_trash_instances"])

        coverage_ranks = dense_rank_desc(coverage_values) if coverage_values else {}
        instance_ranks = dense_rank_desc(instance_values) if instance_values else {}

        for row in report_rows:
            row_id = str(row[report_id_key])
            (
                self.client.table(self.args.report_table)
                .update(
                    {
                        "trash_coverage_rank": coverage_ranks.get(row_id),
                        "trash_instances_rank": instance_ranks.get(row_id),
                    }
                )
                .eq(report_id_key, row[report_id_key])
                .execute()
            )

    def fetch_rank_source_rows(self) -> tuple[list[dict[str, Any]], str]:
        try:
            primary_resp = (
                self.client.table(self.args.report_table)
                .select("report_id,avg_trash_coverage,avg_trash_instances,scored_image_count")
                .gt("scored_image_count", 0)
                .execute()
            )
            return list(primary_resp.data or []), "report_id"
        except Exception:
            fallback_resp = (
                self.client.table(self.args.report_table)
                .select("r_id,avg_trash_coverage,avg_trash_instances,scored_image_count")
                .gt("scored_image_count", 0)
                .execute()
            )
            return list(fallback_resp.data or []), "r_id"


def main() -> None:
    args = parse_args()
    worker = PhotoInferenceWorker(args)
    worker.run()


if __name__ == "__main__":
    main()
