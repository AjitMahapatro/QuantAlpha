from __future__ import annotations

import hashlib
import pickle
import time
from pathlib import Path
from typing import Any

from backend.config import CACHE_DIR


def _cache_path(namespace: str, key: str) -> Path:
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{namespace}_{digest}.pkl"


def load_cached(namespace: str, key: str, ttl_seconds: int) -> Any | None:
    path = _cache_path(namespace, key)
    if not path.exists():
        return None
    if time.time() - path.stat().st_mtime > ttl_seconds:
        return None
    with path.open("rb") as handle:
        return pickle.load(handle)


def store_cached(namespace: str, key: str, payload: Any) -> None:
    path = _cache_path(namespace, key)
    with path.open("wb") as handle:
        pickle.dump(payload, handle)
