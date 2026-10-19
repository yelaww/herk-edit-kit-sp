#!/usr/bin/env python3
"""Local Whisper transcription -> word-level JSON for the cutting tools (SP fork).

No API key, no upload: the audio never leaves the machine.

Usage:
    python scripts/transcribe-whisper-local.py <video-or-audio> [--model small]
        [--language fr] [--output path.json]

Install once:  pip install faster-whisper
(the first run downloads the model, ~460 MB for "small").

Output shape (same as the ElevenLabs script, so cut-silences / cut-mistakes /
validate-beat-sync work unchanged):
    { "language_code": "fr", "audio_duration_secs": 62.4, "provider": "faster-whisper",
      "model": "small", "words": [ { "text", "start", "end", "type": "word" }, ... ] }

Timestamps from Whisper drift by 50-200 ms: cut-silences refines its cuts on the
real audio level (scripts/lib/media-compat.mjs), so keep --video when cutting.
"""
import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input")
    ap.add_argument("--model", default="small", help="tiny|base|small|medium|large-v3 (default small)")
    ap.add_argument("--language", default="fr")
    ap.add_argument("--output", "-o")
    ap.add_argument("--device", default="auto", help="auto|cpu|cuda")
    args = ap.parse_args()

    src = Path(args.input).resolve()
    if not src.exists():
        print(f"input not found: {src}", file=sys.stderr)
        return 1
    out = Path(args.output).resolve() if args.output else src.with_suffix(".json")

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("faster-whisper missing: pip install faster-whisper", file=sys.stderr)
        return 1

    compute = "int8" if args.device in ("auto", "cpu") else "float16"
    model = WhisperModel(args.model, device=args.device, compute_type=compute)
    segments, info = model.transcribe(
        str(src),
        language=args.language,
        word_timestamps=True,
        vad_filter=False,  # keep pauses: cut-silences decides what to remove
        condition_on_previous_text=False,
    )
    words = []
    for seg in segments:
        for w in seg.words or []:
            text = w.word.strip()
            if not text:
                continue
            words.append({"text": text, "start": round(w.start, 3), "end": round(w.end, 3), "type": "word"})

    data = {
        "language_code": info.language,
        "audio_duration_secs": round(info.duration, 3),
        "provider": "faster-whisper",
        "model": args.model,
        "text": " ".join(w["text"] for w in words),
        "words": words,
    }
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(out), "words": len(words), "duration": data["audio_duration_secs"]}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
