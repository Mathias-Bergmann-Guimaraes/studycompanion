"""Makes transcripts for beginner podcasts whose feeds don't have any, using speech recognition.

  pip install -r requirements.txt
  pip install faster-whisper
  python transcribe.py --work DIR [--limit 8] [--model small] [--only WORD]
  python analyse.py --build

DIR holds each episode's audio only while it's being transcribed. It's deleted straight after, so no
audio is kept, and the site plays episodes from the podcast's own host. Transcripts go in .cache like
other captions, and episodes already there are skipped, so an interrupted run carries on.
"""
import argparse
import json
import shutil
import time
import urllib.request
from pathlib import Path

from analyse import CACHE, feed_episodes

SHOWS = [
    "https://anchor.fm/s/8bff5718/podcast/rss",  # Comprehensible Japanese Beginner - Nihongo-Learning
    "https://anchor.fm/s/14f00410/podcast/rss",  # Momoko To Nihongo
    "https://feeds.acast.com/public/shows/65ceb39bf7b2590016aef974",  # Japanese Go 日本語ゴー
    "http://nihongoconteppei.com/feed/podcast",  # Nihongo con Teppei for beginners
    "https://anchor.fm/s/10d869b5c/podcast/rss",  # やさしい日本語じかん
    "https://anchor.fm/s/8ecfe854/podcast/rss",  # Mayu To Nihongo
    "https://anchor.fm/s/e8bdaa40/podcast/rss",  # Paniのやさしい日本語Podcast
    "https://anchor.fm/s/40467694/podcast/rss",  # やさしいにほんご Yu
    "https://anchor.fm/s/f960c0d0/podcast/rss",  # Slow Japanese Stories
    "https://anchor.fm/s/11691a110/podcast/rss",  # Japanese Study Lab Podcast N5-4
    "https://anchor.fm/s/11794d35c/podcast/rss",  # Easy & Real Japanese Radio
]
MIN_SECONDS, MAX_SECONDS = 150, 780  # long enough to judge, short enough to get through many


def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "bunpo-listen-tab/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
        shutil.copyfileobj(r, f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", required=True)
    ap.add_argument("--limit", type=int, default=8, help="newest episodes per show")
    ap.add_argument("--model", default="small")
    ap.add_argument("--only", default="", help="only shows whose feed address has this in it")
    a = ap.parse_args()

    from faster_whisper import WhisperModel

    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    work = Path(a.work)
    work.mkdir(parents=True, exist_ok=True)
    for feed in SHOWS:
        if a.only not in feed:
            continue
        done = 0
        for ep in feed_episodes(feed, MIN_SECONDS, MAX_SECONDS, need_transcript=False):
            if done >= a.limit:
                break
            path = CACHE / f"{ep['id']}.json"
            if path.exists():
                done += 1
                continue
            audio = work / f"{ep['id']}.audio"
            started = time.time()
            try:
                download(ep["audio"], audio)
                segments, _ = model.transcribe(str(audio), language="ja", vad_filter=True, condition_on_previous_text=False)
                rows = [[int(s.start), s.text.strip()] for s in segments]
            except Exception as e:  # one bad file shouldn't cost the rest of the run
                print("  failed:", ep["title"], type(e).__name__, flush=True)
                continue
            finally:
                audio.unlink(missing_ok=True)
            path.write_text(json.dumps({**ep, "captions": rows, "whisper": a.model}, ensure_ascii=False), encoding="utf-8")
            done += 1
            taken = time.time() - started
            print(f"  {ep['seconds']}s of audio in {taken:.0f}s | {ep['channel'][:30]} | {ep['title'][:40]}", flush=True)
        print(done, "episodes from", feed, flush=True)


if __name__ == "__main__":
    main()
