from fastapi import APIRouter, HTTPException, Response
import json
from typing import List, Optional
from app.database import get_db
from app.models.schemas import BookmarkCreate, BookmarkResponse, PaperNoteUpdate, PaperNoteResponse

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
    bibtex_content = """@article{velickovic2018graph,
  title={Graph Attention Networks},
  author={Veli{\v{c}}kovi{\'c}, Petar and Cucurull, Guillem and Casanova, Arantxa and Romero, Adriana and Li{\`o}, Pietro and Bengio, Yoshua},
  journal={ICLR 2018},
  year={2018}
}

@article{kipf2017semi,
  title={Semi-supervised classification with graph convolutional networks},
  author={Kipf, Thomas N and Welling, Max},
  journal={ICLR 2017},
  year={2017}
}
"""
    return Response(content=bibtex_content, media_type="text/plain", headers={"Content-Disposition": "attachment; filename=researchgraph.bib"})
