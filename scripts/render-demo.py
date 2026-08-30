#!/usr/bin/env python3
"""
Turns docs/demo-frames/ into docs/pitchback-demo.mp4.

Captions are burned in with PIL rather than ffmpeg's drawtext, which is not
compiled into the ffmpeg on this machine.

    python3 scripts/render-demo.py

The result is a captioned state sequence, not a screen recording, and the
closing card says so.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "docs" / "demo-frames"
BUILD = FRAMES / "composed"
OUT = ROOT / "docs" / "pitchback-demo.mp4"

WIDTH, HEIGHT = 1280, 800
CAPTION_H = 132
FPS = 30

BG = (20, 18, 16)
FG = (245, 242, 238)
MUTED = (138, 133, 128)
RULE = (48, 44, 40)

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
]
MONO_CANDIDATES = [
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Monaco.ttf",
]


def load_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont:
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    # No silent fallback to a 6px bitmap font that would make the video
    # unreadable — say what is missing.
    raise SystemExit(f"No usable font found. Tried: {', '.join(candidates)}")


CAPTION_FONT = load_font(FONT_CANDIDATES, 26)
LABEL_FONT = load_font(MONO_CANDIDATES, 15)
TITLE_FONT = load_font(FONT_CANDIDATES, 46)
BODY_FONT = load_font(FONT_CANDIDATES, 24)


def wrap(draw: ImageDraw.ImageDraw, text: str, font, max_w: int) -> list[str]:
    words, lines, line = text.split(), [], ""
    for w in words:
        trial = f"{line} {w}".strip()
        if draw.textlength(trial, font=font) <= max_w:
            line = trial
        else:
            if line:
                lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def compose(shot: Path, caption: str, index: int, total: int) -> Path:
    canvas = Image.new("RGB", (WIDTH, HEIGHT + CAPTION_H), BG)

    img = Image.open(shot).convert("RGB")
    if img.size != (WIDTH, HEIGHT):
        img = img.resize((WIDTH, HEIGHT))
    canvas.paste(img, (0, 0))

    d = ImageDraw.Draw(canvas)
    d.line([(0, HEIGHT), (WIDTH, HEIGHT)], fill=RULE, width=1)

    lines = wrap(d, caption, CAPTION_FONT, WIDTH - 160)
    y = HEIGHT + (CAPTION_H - len(lines) * 34) // 2
    for line in lines:
        d.text((72, y), line, font=CAPTION_FONT, fill=FG)
        y += 34

    d.text(
        (WIDTH - 72 - d.textlength(f"{index + 1}/{total}", font=LABEL_FONT),
         HEIGHT + CAPTION_H - 34),
        f"{index + 1}/{total}",
        font=LABEL_FONT,
        fill=MUTED,
    )

    out = BUILD / f"composed-{index:03d}.png"
    canvas.save(out)
    return out


def closing_card(index: int) -> Path:
    """States plainly what the viewer just watched."""
    canvas = Image.new("RGB", (WIDTH, HEIGHT + CAPTION_H), BG)
    d = ImageDraw.Draw(canvas)

    d.text((96, 190), "What you just watched", font=TITLE_FONT, fill=FG)

    body = [
        "A scripted capture of the running app, not a screen recording.",
        "The buyer's replies are generated. Her state is not — that is the",
        "state machine, and every transition is shown with the rule that",
        "fired it. Discovery and talk-to-listen are arithmetic on the",
        "transcript. Nobody speaks in this video, because it is automated.",
    ]
    y = 300
    for line in body:
        d.text((96, y), line, font=BODY_FONT, fill=MUTED)
        y += 42

    d.text((96, y + 40), "github.com/mayankgoel214/Pitchback", font=LABEL_FONT, fill=FG)

    out = BUILD / f"composed-{index:03d}.png"
    canvas.save(out)
    return out


def main() -> None:
    manifest = FRAMES / "captions.json"
    if not manifest.exists():
        raise SystemExit(
            f"{manifest} not found. Run: node scripts/capture-demo.mjs http://localhost:3111"
        )

    frames = json.loads(manifest.read_text())
    if not frames:
        raise SystemExit("captions.json is empty — the capture produced no frames.")

    BUILD.mkdir(parents=True, exist_ok=True)
    for old in BUILD.glob("composed-*.png"):
        old.unlink()

    total = len(frames) + 1
    concat_lines: list[str] = []

    for i, frame in enumerate(frames):
        shot = FRAMES / frame["file"]
        if not shot.exists():
            raise SystemExit(f"missing frame: {shot}")
        path = compose(shot, frame["caption"], i, total)
        concat_lines.append(f"file '{path}'")
        concat_lines.append(f"duration {float(frame.get('hold', 3))}")

    card = closing_card(len(frames))
    concat_lines.append(f"file '{card}'")
    concat_lines.append("duration 5")
    # ffmpeg's concat demuxer needs the final image repeated to honour its hold.
    concat_lines.append(f"file '{card}'")

    listing = BUILD / "concat.txt"
    listing.write_text("\n".join(concat_lines) + "\n")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(listing),
        "-vf", f"fps={FPS},format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-movflags", "+faststart",
        str(OUT),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr[-3000:])
        raise SystemExit("ffmpeg failed")

    seconds = sum(float(f.get("hold", 3)) for f in frames) + 5
    print(f"wrote {OUT} — {total} cards, about {seconds:.0f}s")


if __name__ == "__main__":
    main()
