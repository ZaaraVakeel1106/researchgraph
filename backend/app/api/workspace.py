from fastapi import APIRouter, HTTPException, Response
import json
from typing import List, Optional
from app.database import get_db
from app.models.schemas import BookmarkCreate, BookmarkResponse, PaperNoteUpdate, PaperNoteResponse
from app.services.openalex_service import openalex_service

router = APIRouter(prefix="/api/workspace", tags=["Workspace & Bookmarks"])

@router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(bookmark: BookmarkCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT OR REPLACE INTO bookmarks (entity_id, entity_type, title, subtitle, metadata_json, folder_name)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                bookmark.entity_id,
                bookmark.entity_type,
                bookmark.title,
                bookmark.subtitle,
                json.dumps(bookmark.metadata_json or {}),
                bookmark.folder_name or "General"
            )
        )
        conn.commit()
        last_id = cursor.lastrowid
        cursor.execute("SELECT * FROM bookmarks WHERE id = ?", (last_id,))
        row = cursor.fetchone()
        return BookmarkResponse(
            id=row["id"],
            entity_id=row["entity_id"],
            entity_type=row["entity_type"],
            title=row["title"],
            subtitle=row["subtitle"],
            folder_name=row["folder_name"],
            metadata_json=json.loads(row["metadata_json"] or "{}"),
            created_at=str(row["created_at"])
        )
    finally:
        conn.close()

@router.get("/bookmarks", response_model=List[BookmarkResponse])
async def list_bookmarks():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM bookmarks ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [
            BookmarkResponse(
                id=row["id"],
                entity_id=row["entity_id"],
                entity_type=row["entity_type"],
                title=row["title"],
                subtitle=row["subtitle"],
                folder_name=row["folder_name"],
                metadata_json=json.loads(row["metadata_json"] or "{}"),
                created_at=str(row["created_at"])
            )
            for row in rows
        ]
    finally:
        conn.close()

@router.delete("/bookmarks/{entity_id}")
async def delete_bookmark(entity_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM bookmarks WHERE entity_id = ?", (entity_id,))
        conn.commit()
        return {"status": "deleted", "entity_id": entity_id}
    finally:
        conn.close()

@router.post("/notes", response_model=PaperNoteResponse)
async def save_paper_note(note: PaperNoteUpdate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT OR REPLACE INTO paper_notes (paper_id, reading_status, notes_markdown, updated_at)
               VALUES (?, ?, ?, CURRENT_TIMESTAMP)""",
            (note.paper_id, note.reading_status, note.notes_markdown)
        )
        conn.commit()
        cursor.execute("SELECT * FROM paper_notes WHERE paper_id = ?", (note.paper_id,))
        row = cursor.fetchone()
        return PaperNoteResponse(
            paper_id=row["paper_id"],
            reading_status=row["reading_status"],
            notes_markdown=row["notes_markdown"],
            updated_at=str(row["updated_at"])
        )
    finally:
        conn.close()

@router.get("/notes/{paper_id}", response_model=PaperNoteResponse)
async def get_paper_note(paper_id: str):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM paper_notes WHERE paper_id = ?", (paper_id,))
        row = cursor.fetchone()
        if row:
            return PaperNoteResponse(
                paper_id=row["paper_id"],
                reading_status=row["reading_status"],
                notes_markdown=row["notes_markdown"],
                updated_at=str(row["updated_at"])
            )
        return PaperNoteResponse(
            paper_id=paper_id,
            reading_status="Unread",
            notes_markdown="",
            updated_at=""
        )
    finally:
        conn.close()

@router.get("/export/bibtex")
async def export_bibtex(paper_ids: Optional[str] = None):
    conn = get_db()
    try:
        ids = [value.strip() for value in (paper_ids or "").split(",") if value.strip()]
        if ids:
            rows = conn.execute("SELECT * FROM bookmarks WHERE entity_type='paper' AND entity_id IN (" + ",".join("?" for _ in ids) + ")", ids).fetchall()
        else:
            rows = conn.execute("SELECT * FROM bookmarks WHERE entity_type='paper' ORDER BY created_at DESC").fetchall()
        entries = []
        for row in rows:
            meta = json.loads(row["metadata_json"] or "{}")
            fields = {"title": row["title"], "author": " and ".join(meta.get("authors", [])), "year": meta.get("year"),
                      "journal": meta.get("venue"), "doi": meta.get("doi"), "url": meta.get("source_url")}
            fields = {key: value for key, value in fields.items() if value not in (None, "", [])}
            key = "work" + "".join(char for char in row["entity_id"] if char.isalnum())
            lines = [f"@article{{{key},"] + [f"  {field} = {{{str(value).replace('{', '').replace('}', '')}}}," for field, value in fields.items()]
            if len(lines) > 1:
                lines[-1] = lines[-1].rstrip(",")
            entries.append("\n".join(lines + ["}"]))
        saved_ids = {row["entity_id"] for row in rows}
        for work_id in ids:
            if work_id in saved_ids:
                continue
            work = await openalex_service.get_work(work_id)
            fields = {"title": work.get("title"), "author": " and ".join(a.get("name", "") for a in work.get("authors", []) if a.get("name")),
                      "year": work.get("publication_year"), "journal": work.get("venue"), "doi": work.get("doi"), "url": work.get("source_url")}
            fields = {key: value for key, value in fields.items() if value not in (None, "", [])}
            key = "work" + "".join(char for char in work_id if char.isalnum())
            lines = [f"@article{{{key},"] + [f"  {field} = {{{str(value).replace('{', '').replace('}', '')}}}," for field, value in fields.items()]
            if len(lines) > 1:
                lines[-1] = lines[-1].rstrip(",")
            entries.append("\n".join(lines + ["}"]))
        bibtex_content = "\n\n".join(entries)
    finally:
        conn.close()
    return Response(content=bibtex_content, media_type="text/plain", headers={"Content-Disposition": "attachment; filename=researchgraph.bib"})
