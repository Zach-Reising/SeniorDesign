from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

import cv2
import kagglehub
from ultralytics import YOLO


DATASET_SLUG = "ahnaftahmeed/trash-detection-image-dataset"
DATASET_SUBDIR = "trash-detection.v35.yolov9"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run inference with a trained YOLO trash model and show/save results."
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Path to model checkpoint (.pt). If omitted, script auto-discovers a trained checkpoint.",
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Image/video/folder path, URL, or camera index (for webcam use 0).",
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Inference image size.")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold.")
    parser.add_argument("--iou", type=float, default=0.45, help="NMS IoU threshold.")
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Inference device (examples: cpu, 0, 0,1). If omitted, Ultralytics auto-selects.",
    )
    parser.add_argument(
        "--no-show",
        action="store_true",
        help="Disable pop-up result windows.",
    )
    parser.add_argument(
        "--no-prompt-next",
        action="store_true",
        help="Disable interactive prompt between shown image results.",
    )
    parser.add_argument(
        "--save-dir",
        type=str,
        default="inference_results",
        help="Directory where annotated outputs are stored.",
    )
    parser.add_argument(
        "--name",
        type=str,
        default="predict",
        help="Run folder name inside save-dir.",
    )
    parser.add_argument(
        "--max-det",
        type=int,
        default=300,
        help="Maximum detections per image.",
    )
    return parser.parse_args()


def _existing(paths: Iterable[Path]) -> list[Path]:
    seen: set[Path] = set()
    out: list[Path] = []
    for p in paths:
        rp = p.expanduser().resolve()
        if rp.exists() and rp not in seen:
            seen.add(rp)
            out.append(rp)
    return out


def resolve_dataset_root() -> Path | None:
    try:
        dataset_path = Path(kagglehub.dataset_download(DATASET_SLUG)).expanduser().resolve()
        root = dataset_path / DATASET_SUBDIR
        if root.exists():
            return root
    except Exception:
        return None
    return None


def discover_model(args_model: str | None, dataset_root: Path | None) -> Path:
    if args_model:
        model_path = Path(args_model).expanduser().resolve()
        if not model_path.exists():
            raise FileNotFoundError(f"Model checkpoint not found: {model_path}")
        return model_path

    cwd = Path.cwd().resolve()

    candidates: list[Path] = [
        cwd / "yolo_trash_seg.pt",
        cwd / "runs" / "trash_seg" / "weights" / "best.pt",
    ]

    if dataset_root is not None:
        candidates.append(dataset_root / "yolo_trash_seg.pt")
        run_dirs = sorted(
            (dataset_root / "runs").glob("*/weights/best.pt"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        candidates.extend(run_dirs)

    # Final fallback: shipped base model in workspace.
    candidates.extend([cwd / "yolov8n-seg.pt", cwd / "yolo26n.pt", cwd / "yolov5s.pt"])

    existing = _existing(candidates)
    if not existing:
        raise FileNotFoundError(
            "No model checkpoint found. Provide --model path/to/best.pt or run training first."
        )
    return existing[0]


def resolve_source(args_source: str | None, dataset_root: Path | None) -> str:
    if args_source is not None:
        # Keep numeric camera indexes as strings so Ultralytics can use webcam sources.
        if args_source.isdigit():
            return args_source

        source_path = Path(args_source).expanduser().resolve()
        if source_path.exists():
            return str(source_path)

        # Allow URLs/streams even if not a local path.
        if "://" in args_source:
            return args_source

        raise FileNotFoundError(f"Source not found: {source_path}")

    if dataset_root is not None:
        valid_images = dataset_root / "valid" / "images"
        if valid_images.exists():
            return str(valid_images)

    raise FileNotFoundError(
        "No source provided and no default dataset source found. Use --source PATH_OR_URL_OR_0"
    )


def summarize_predictions(results: list) -> None:
    total_images = len(results)
    total_boxes = 0
    total_masks = 0

    for r in results:
        if r.boxes is not None:
            total_boxes += int(r.boxes.shape[0])
        if r.masks is not None and r.masks.data is not None:
            total_masks += int(r.masks.data.shape[0])

    print("Inference summary:")
    print(f"  Images processed: {total_images}")
    print(f"  Total detections: {total_boxes}")
    print(f"  Total masks:      {total_masks}")


def resolve_image_sources(source: str) -> list[str]:
    if "://" in source or source.isdigit():
        return []

    source_path = Path(source)
    if source_path.is_file() and source_path.suffix.lower() in IMAGE_SUFFIXES:
        return [str(source_path)]

    if source_path.is_dir():
        files = sorted(
            p for p in source_path.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES
        )
        return [str(p) for p in files]

    return []


def show_result_blocking(result, image_source: str) -> bool:
    window_name = f"Trash Inference - {Path(image_source).name}"
    plotted = result.plot()
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.imshow(window_name, plotted)

    print("Window controls: Enter/Space = next image, q/Esc = stop")
    while True:
        key = cv2.waitKey(50) & 0xFF
        if key in (13, 32):  # Enter, Space
            cv2.destroyWindow(window_name)
            return True
        if key in (ord("q"), 27):  # q, Esc
            cv2.destroyWindow(window_name)
            return False

        # If user closes the window manually, continue to next image.
        if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
            return True


def main() -> None:
    args = parse_args()

    dataset_root = resolve_dataset_root()
    if dataset_root is not None:
        print(f"Dataset root: {dataset_root}")
    else:
        print("Dataset root: unavailable (continuing with local paths)")

    model_path = discover_model(args.model, dataset_root)
    source = resolve_source(args.source, dataset_root)

    print(f"Using model: {model_path}")
    print(f"Using source: {source}")

    model = YOLO(str(model_path))
    image_sources = resolve_image_sources(source)
    interactive_step_mode = bool(image_sources) and (not args.no_show) and (not args.no_prompt_next)

    if interactive_step_mode:
        print(
            f"Interactive mode enabled for {len(image_sources)} images. "
            "Use the image window: Enter/Space for next, q/Esc to stop."
        )
        results = []
        for i, image_source in enumerate(image_sources, start=1):
            print(f"[{i}/{len(image_sources)}] Predicting: {image_source}")
            step_results = model.predict(
                source=image_source,
                imgsz=args.imgsz,
                conf=args.conf,
                iou=args.iou,
                max_det=args.max_det,
                device=args.device,
                show=False,
                save=True,
                project=str(Path(args.save_dir).expanduser().resolve()),
                name=args.name,
                exist_ok=True,
                verbose=False,
            )
            results.extend(step_results)
            if step_results and not show_result_blocking(step_results[0], image_source):
                print("Stopped by user request.")
                break

            
    else:
        results = model.predict(
            source=source,
            imgsz=args.imgsz,
            conf=args.conf,
            iou=args.iou,
            max_det=args.max_det,
            device=args.device,
            show=not args.no_show,
            save=True,
            project=str(Path(args.save_dir).expanduser().resolve()),
            name=args.name,
            exist_ok=True,
            verbose=True,
        )

    save_path = Path(args.save_dir).expanduser().resolve() / args.name
    print(f"Saved annotated results to: {save_path}")
    if args.no_show:
        print("Display disabled (--no-show). Open saved files to view outputs.")

    summarize_predictions(results)


if __name__ == "__main__":
    main()
