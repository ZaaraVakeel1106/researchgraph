import sqlite3
import json
import os
from typing import Optional, Dict, Any, List
from app.config import settings

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "researchgraph.db")

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Cached OpenAlex queries
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS entity_cache (
        cache_key TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Bookmarks / Saved items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_id TEXT UNIQUE NOT NULL,
        entity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT,
        metadata_json TEXT,
        folder_name TEXT DEFAULT 'General',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Paper research notes & reading status
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_notes (
        paper_id TEXT PRIMARY KEY,
        reading_status TEXT DEFAULT 'Unread',
        notes_markdown TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Saved Research Snapshots
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graph_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        query TEXT NOT NULL,
        mode TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()

# Helper DB methods
def get_cached_entity(cache_key: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM entity_cache WHERE cache_key = ?", (cache_key,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row["data_json"])
    return None

def set_cached_entity(cache_key: str, data: Dict[str, Any]):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO entity_cache (cache_key, data_json) VALUES (?, ?)",
        (cache_key, json.dumps(data))
    )
    conn.commit()
    conn.close()

init_db()
