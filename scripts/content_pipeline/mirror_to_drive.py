#!/usr/bin/env python3
"""Create missing Google Docs mirrors for complete_for_editorial_mirror articles."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/documents"]


def parse(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    raw, body = text[4:].split("\n---\n", 1)
    meta: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip().strip('"\'')
    return meta, body


def main() -> None:
    info = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_JSON"])
    folder_id = os.environ["GOOGLE_DRIVE_FOLDER_ID"]
    credentials = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    drive = build("drive", "v3", credentials=credentials, cache_discovery=False)
    docs = build("docs", "v1", credentials=credentials, cache_discovery=False)

    report = {"created": [], "existing": [], "eligible": 0}
    for path in sorted(Path("content/articles").rglob("*.md")):
        meta, body = parse(path)
        if meta.get("status") != "complete_for_editorial_mirror":
            continue
        report["eligible"] += 1
        article_id = meta["article_id"]
        query = (
            f"'{folder_id}' in parents and trashed = false and "
            f"appProperties has {{ key='article_id' and value='{article_id}' }}"
        )
        matches = drive.files().list(q=query, fields="files(id,name,webViewLink)", pageSize=2).execute().get("files", [])
        if matches:
            report["existing"].append({"article_id": article_id, **matches[0]})
            continue

        title = f"{article_id} — {meta['title']}"
        created = drive.files().create(
            body={
                "name": title,
                "mimeType": "application/vnd.google-apps.document",
                "parents": [folder_id],
                "appProperties": {
                    "article_id": article_id,
                    "batch_id": meta.get("batch_id", ""),
                    "github_path": str(path),
                },
            },
            fields="id,name,webViewLink",
        ).execute()
        header = (
            f"ARTICLE ID: {article_id}\n"
            f"BATCH ID: {meta.get('batch_id', '')}\n"
            f"CANONICAL GITHUB PATH: {path}\n"
            f"SOURCE STATUS: complete_for_editorial_mirror\n\n"
        )
        docs.documents().batchUpdate(
            documentId=created["id"],
            body={"requests": [{"insertText": {"location": {"index": 1}, "text": header + body}}]},
        ).execute()
        report["created"].append({"article_id": article_id, **created})

    output = Path("artifacts/drive-mirror.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
