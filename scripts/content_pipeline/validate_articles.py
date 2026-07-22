#!/usr/bin/env python3
"""Validate Hook the Horizon Markdown articles before any external write."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REQUIRED_FRONT_MATTER = {
    "article_id", "batch_id", "title", "slug", "pillar", "article_family",
    "status", "source_state", "evidence_tier", "last_reviewed",
    "canonical_github_path", "location_privacy", "regulation_sensitive",
    "safety_sensitive", "affiliate_status",
}
REQUIRED_HEADINGS = {
    "Reader decision", "Opening", "Core analysis", "Practical application",
    "Limitations and uncertainty", "Sources and evidence record",
    "Visual requirements", "Internal routing", "Editorial QA",
}
ALLOWED_READY = {"complete_for_editorial_mirror", "wordpress_ready"}
PLACEHOLDERS = ("todo", "tbd", "lorem ipsum", "write the complete", "state the exact")


def parse_front_matter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---\n"):
        raise ValueError("missing YAML front matter")
    try:
        raw, body = text[4:].split("\n---\n", 1)
    except ValueError as exc:
        raise ValueError("front matter is not closed") from exc
    data: dict[str, str] = {}
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip('"\'')
    return data, body


def validate(path: Path) -> dict[str, object]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    try:
        meta, body = parse_front_matter(text)
    except ValueError as exc:
        return {"path": str(path), "valid": False, "errors": [str(exc)]}

    missing = sorted(k for k in REQUIRED_FRONT_MATTER if not meta.get(k))
    if missing:
        errors.append("missing front matter: " + ", ".join(missing))

    headings = set(re.findall(r"^##\s+(.+?)\s*$", body, flags=re.MULTILINE))
    missing_headings = sorted(REQUIRED_HEADINGS - headings)
    if missing_headings:
        errors.append("missing headings: " + ", ".join(missing_headings))

    if meta.get("status") in ALLOWED_READY:
        lower = body.lower()
        found = sorted(p for p in PLACEHOLDERS if p in lower)
        if found:
            errors.append("placeholder language found: " + ", ".join(found))
        words = re.findall(r"\b[\w’'-]+\b", body)
        if len(words) < 900:
            errors.append(f"article is too short for ready state: {len(words)} words; minimum 900")

    if meta.get("wordpress_status") not in (None, "", "null", "draft"):
        errors.append("wordpress_status may only be null or draft in this pipeline")

    return {
        "path": str(path),
        "article_id": meta.get("article_id"),
        "slug": meta.get("slug"),
        "status": meta.get("status"),
        "valid": not errors,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default="content/articles")
    parser.add_argument("--report", default="artifacts/article-validation.json")
    args = parser.parse_args()

    files = sorted(Path(args.root).rglob("*.md"))
    results = [validate(path) for path in files]

    slugs: dict[str, str] = {}
    for result in results:
        slug = str(result.get("slug") or "")
        if slug and slug in slugs:
            result["valid"] = False
            result["errors"].append(f"duplicate slug also used by {slugs[slug]}")
        elif slug:
            slugs[slug] = str(result["path"])

    report = {"article_count": len(results), "valid": all(r["valid"] for r in results), "articles": results}
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
