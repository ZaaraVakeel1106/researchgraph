"""Small bounded in-process TTL cache for successful provider-backed responses."""
from copy import deepcopy
import time
from typing import Any


class TTLCache:
    def __init__(self, max_entries: int = 512):
        self.max_entries = max(1, max_entries)
        self._entries: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._entries.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if expires_at <= time.monotonic():
            self._entries.pop(key, None)
            return None
        return deepcopy(value)

    def set(self, key: str, value: Any, ttl_seconds: int | float) -> None:
        if ttl_seconds <= 0:
            return
        now = time.monotonic()
        for stale_key, (expires_at, _) in list(self._entries.items()):
            if expires_at <= now:
                self._entries.pop(stale_key, None)
        if key not in self._entries and len(self._entries) >= self.max_entries:
            self._entries.pop(next(iter(self._entries)))
        self._entries[key] = (now + ttl_seconds, deepcopy(value))
