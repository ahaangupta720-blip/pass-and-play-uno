#!/usr/bin/env python3
"""Extract UNO card sprites into individual PNG files used by index.html.

Expected source sheet layout (based on provided image): 12 columns x 6 rows.
Outputs the 54 gameplay assets into assets/cards with names like red-4.png and wild-four.png.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image

COLORS = ["red", "yellow", "green", "blue"]
NUMS = [str(i) for i in range(10)]

# Row/col mapping for the provided sheet (0-indexed)
# First 4 rows are color rows: 0..9, reverse, skip
COLOR_ROW_ORDER = ["yellow", "red", "green", "blue"]
COLOR_TO_ROW = {c: i for i, c in enumerate(COLOR_ROW_ORDER)}

# row 4 (5th row) contains wild/+ cards in the provided sheet
SPECIAL_POSITIONS = {
    "wild-wild.png": (4, 1),
    "wild-four.png": (4, 2),
    "yellow-two.png": (4, 6),
    "blue-two.png": (4, 7),
    "red-two.png": (4, 8),
    "green-two.png": (4, 9),
}


def crop_cell(img: Image.Image, row: int, col: int, rows: int, cols: int, trim_ratio: float) -> Image.Image:
    w, h = img.size
    cell_w = w / cols
    cell_h = h / rows

    x0 = int(col * cell_w)
    y0 = int(row * cell_h)
    x1 = int((col + 1) * cell_w)
    y1 = int((row + 1) * cell_h)

    trim_x = int((x1 - x0) * trim_ratio)
    trim_y = int((y1 - y0) * trim_ratio)

    return img.crop((x0 + trim_x, y0 + trim_y, x1 - trim_x, y1 - trim_y))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", type=Path, help="Path to full card-sheet image")
    ap.add_argument("--out", type=Path, default=Path("assets/cards"), help="Output directory")
    ap.add_argument("--rows", type=int, default=6)
    ap.add_argument("--cols", type=int, default=12)
    ap.add_argument("--trim", type=float, default=0.03, help="Trim ratio per cell edge")
    args = ap.parse_args()

    img = Image.open(args.source).convert("RGBA")
    args.out.mkdir(parents=True, exist_ok=True)

    # Number cards + reverse/skip from first 4 rows
    for color in COLORS:
      row = COLOR_TO_ROW[color]
      for i, n in enumerate(NUMS):
        crop_cell(img, row, i, args.rows, args.cols, args.trim).save(args.out / f"{color}-{n}.png")
      crop_cell(img, row, 10, args.rows, args.cols, args.trim).save(args.out / f"{color}-reverse.png")
      crop_cell(img, row, 11, args.rows, args.cols, args.trim).save(args.out / f"{color}-skip.png")

    # Specials from configured positions
    for name, (row, col) in SPECIAL_POSITIONS.items():
      crop_cell(img, row, col, args.rows, args.cols, args.trim).save(args.out / name)

    print(f"Wrote 54 files to {args.out}")


if __name__ == "__main__":
    main()
