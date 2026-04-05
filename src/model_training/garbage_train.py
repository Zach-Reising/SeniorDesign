from pathlib import Path
import shutil
import argparse
import os

import kagglehub
import torch
from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train YOLO segmentation model for trash masks.")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=32)
    parser.add_argument(
        "--autobatch",
        action="store_true",
        help="Use Ultralytics automatic batch-size tuning (equivalent to batch=-1).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Dataloader workers. Defaults to half CPU cores (capped).",
    )
    parser.add_argument(
        "--cache",
        type=str,
        default="disk",
        choices=["False", "True", "disk", "ram"],
        help="Ultralytics cache mode. disk is usually a good default.", 
    )
    parser.add_argument(
        "--sanitize-labels",
        action="store_true",
        help="Force re-sanitize labels and rebuild label caches.",
    )
    return parser.parse_args()


def get_device_arg() -> str:
    if torch.cuda.is_available():
        # ROCm exposes AMD GPUs through torch.cuda as well.
        return "0"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def resolve_data_yaml(dataset_root: Path) -> Path:
    common_names = ["data.yaml", "dataset.yaml"]
    for name in common_names:
        candidate = dataset_root / name
        if candidate.exists():
            return candidate

    yaml_files = sorted(dataset_root.glob("*.yaml"))
    if yaml_files:
        return yaml_files[0]

    raise FileNotFoundError(f"No dataset yaml found in {dataset_root}")


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def box_to_polygon(cx: float, cy: float, bw: float, bh: float) -> list[float]:
    x1 = clamp01(cx - bw / 2.0)
    y1 = clamp01(cy - bh / 2.0)
    x2 = clamp01(cx + bw / 2.0)
    y2 = clamp01(cy + bh / 2.0)
    return [x1, y1, x2, y1, x2, y2, x1, y2]


def sanitize_label_file(label_file: Path) -> tuple[int, int]:
    kept = 0
    dropped = 0
    cleaned_lines: list[str] = []

    with open(label_file, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    for line in lines:
        parts = line.split()
        if len(parts) < 5:
            dropped += 1
            continue

        try:
            cls_id = int(float(parts[0]))
            coords = [float(v) for v in parts[1:]]
        except ValueError:
            dropped += 1
            continue

        # Convert bbox rows into polygon rows for pure segmentation training.
        if len(coords) == 4:
            cx, cy, bw, bh = coords
            poly = box_to_polygon(cx, cy, bw, bh)
            cleaned_lines.append(
                f"{cls_id} " + " ".join(f"{v:.6f}" for v in poly)
            )
            kept += 1
            continue

        # Keep polygon rows only if they form valid point pairs (>= 3 points).
        if len(coords) < 6:
            dropped += 1
            continue
        if len(coords) % 2 != 0:
            coords = coords[:-1]
        if len(coords) < 6:
            dropped += 1
            continue

        clamped = [clamp01(v) for v in coords]
        cleaned_lines.append(
            f"{cls_id} " + " ".join(f"{v:.6f}" for v in clamped)
        )
        kept += 1

    with open(label_file, "w", encoding="utf-8") as f:
        if cleaned_lines:
            f.write("\n".join(cleaned_lines) + "\n")
        else:
            f.write("")

    return kept, dropped


def sanitize_split_labels(labels_dir: Path) -> tuple[int, int, int]:
    total_files = 0
    total_kept = 0
    total_dropped = 0
    for label_file in labels_dir.glob("*.txt"):
        total_files += 1
        kept, dropped = sanitize_label_file(label_file)
        total_kept += kept
        total_dropped += dropped
    return total_files, total_kept, total_dropped


def clear_label_cache(dataset_root: Path) -> None:
    for cache_file in dataset_root.glob("**/labels.cache"):
        cache_file.unlink(missing_ok=True)


def resolve_save_dir(train_results, model: YOLO) -> Path:
    if train_results is not None and hasattr(train_results, "save_dir"):
        return Path(str(train_results.save_dir))

    trainer = getattr(model, "trainer", None)
    if trainer is None or not hasattr(trainer, "save_dir"):
        raise RuntimeError("Could not resolve YOLO training output directory.")
    return Path(str(trainer.save_dir))


def export_checkpoint(save_dir: Path, final_model_path: Path) -> Path:
    weights_dir = save_dir / "weights"
    best_pt = weights_dir / "best.pt"
    last_pt = weights_dir / "last.pt"

    if best_pt.exists():
        source = best_pt
    elif last_pt.exists():
        source = last_pt
    else:
        raise FileNotFoundError(
            f"No checkpoint found in {weights_dir}. Expected best.pt or last.pt"
        )

    shutil.copy2(source, final_model_path)
    return source


def main() -> None:
    args = parse_args()

    path = kagglehub.dataset_download("ahnaftahmeed/trash-detection-image-dataset")
    print("Path to dataset files:", path)

    dataset_root = Path(path) / "trash-detection.v35.yolov9"
    data_yaml = resolve_data_yaml(dataset_root)

    if not (dataset_root / "train" / "images").exists():
        raise FileNotFoundError(f"Expected YOLO train images in: {dataset_root / 'train' / 'images'}")

    train_labels = dataset_root / "train" / "labels"
    valid_labels = dataset_root / "valid" / "labels"
    if not train_labels.exists() or not valid_labels.exists():
        raise FileNotFoundError("Expected train/labels and valid/labels directories for YOLO dataset.")

    sanitize_marker = dataset_root / ".labels_sanitized_v1"
    if args.sanitize_labels or not sanitize_marker.exists():
        # Sanitize labels to pure segmentation format so Ultralytics collate produces consistent tensors.
        t_files, t_kept, t_dropped = sanitize_split_labels(train_labels)
        v_files, v_kept, v_dropped = sanitize_split_labels(valid_labels)
        clear_label_cache(dataset_root)
        sanitize_marker.write_text("done\n", encoding="utf-8")

        print(
            "Label sanitize summary | "
            f"train: files={t_files}, kept={t_kept}, dropped={t_dropped} | "
            f"valid: files={v_files}, kept={v_kept}, dropped={v_dropped}"
        )
    else:
        print("Skipping label sanitization (marker exists). Use --sanitize-labels to force.")

    device = get_device_arg()
    auto_workers = min(8, max(2, (os.cpu_count() or 4) // 2))
    workers = args.workers if args.workers is not None else auto_workers
    batch_value: int = -1 if args.autobatch else args.batch
    print(f"Using device: {device}")
    print(f"Dataset yaml: {data_yaml}")
    print(
        "Training config: "
        f"epochs={args.epochs}, imgsz={args.imgsz}, "
        f"batch={'auto' if args.autobatch else args.batch}, workers={workers}, cache={args.cache}"
    )

    # YOLO segmentation model. Small variant is much faster for iteration.
    model = YOLO("yolov8n-seg.pt")

    final_model_path = dataset_root / "yolo_trash_seg.pt"
    train_results = None
    interrupted = False

    try:
        train_results = model.train(
            data=str(data_yaml),
            task="segment",
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=batch_value,
            device=device,
            workers=workers,
            cache=args.cache,
            project=str(dataset_root / "runs"),
            name="trash_seg",
            pretrained=True,
            optimizer="auto",
            patience=15,
            overlap_mask=False,
        )
    except KeyboardInterrupt:
        interrupted = True
        print("Training interrupted by user, exporting latest available checkpoint...")

    save_dir = resolve_save_dir(train_results, model)
    source_ckpt = export_checkpoint(save_dir, final_model_path)
    print(f"Checkpoint copied from: {source_ckpt}")
    print(f"Model exported to: {final_model_path}")

    if interrupted:
        return


if __name__ == "__main__":
    main()
