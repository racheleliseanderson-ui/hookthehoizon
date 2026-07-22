#!/usr/bin/env python3
"""Push 5-10 wordpress_ready Markdown articles to WordPress as drafts only."""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

MIN_BATCH = 5
MAX_BATCH = 10


def parse_article(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    raw, body = text[4:].split("\n---\n", 1)
    meta: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip().strip('"\'')
    html = []
    for block in body.split("\n\n"):
        block = block.strip()
        if not block or block.startswith("## Editorial QA"):
            continue
        if block.startswith("# "):
            continue
        if block.startswith("## "):
            html.append(f"<h2>{block[3:].strip()}</h2>")
        elif block.startswith("- "):
            items = "".join(f"<li>{line[2:]}</li>" for line in block.splitlines() if line.startswith("- "))
            html.append(f"<ul>{items}</ul>")
        else:
            html.append("<p>" + block.replace("\n", " ") + "</p>")
    return {"path": str(path), "meta": meta, "content": "\n".join(html)}


def request_json(url: str, method: str, payload: dict | None, auth: str) -> object:
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Basic " + auth)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.load(response)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="content/articles")
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--report", default="artifacts/wordpress-import.json")
    args = parser.parse_args()

    if not MIN_BATCH <= args.limit <= MAX_BATCH:
        raise SystemExit("limit must be between 5 and 10")

    articles = []
    for path in sorted(Path(args.root).rglob("*.md")):
        article = parse_article(path)
        if article["meta"].get("status") == "wordpress_ready":
            articles.append(article)
    batch = articles[: args.limit]
    if batch and len(batch) < MIN_BATCH:
        raise SystemExit(f"refusing partial batch of {len(batch)}; minimum is {MIN_BATCH}")

    report: dict[str, object] = {"mode": "execute" if args.execute else "dry-run", "selected": len(batch), "posts": []}
    if args.execute and batch:
        base_url = os.environ["WORDPRESS_BASE_URL"].rstrip("/")
        user = os.environ["WORDPRESS_USERNAME"]
        password = os.environ["WORDPRESS_APPLICATION_PASSWORD"]
        auth = base64.b64encode(f"{user}:{password}".encode()).decode()
        for article in batch:
            meta = article["meta"]
            payload = {
                "title": meta["title"],
                "slug": meta["slug"],
                "content": article["content"],
                "status": "draft",
                "meta": {"canonical_article_id": meta["article_id"]},
            }
            created = request_json(f"{base_url}/wp-json/wp/v2/posts", "POST", payload, auth)
            post_id = int(created["id"])
            verified = request_json(f"{base_url}/wp-json/wp/v2/posts/{post_id}?context=edit", "GET", None, auth)
            if verified.get("status") != "draft":
                raise RuntimeError(f"post {post_id} failed draft verification")
            report["posts"].append({"article_id": meta["article_id"], "post_id": post_id, "status": "draft"})
    else:
        report["posts"] = [{"article_id": a["meta"].get("article_id"), "slug": a["meta"].get("slug"), "status": "would-create-draft"} for a in batch]

    path = Path(args.report)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyError, urllib.error.URLError, RuntimeError) as exc:
        print(f"pipeline stopped: {exc}", file=sys.stderr)
        sys.exit(1)
