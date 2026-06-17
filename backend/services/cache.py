from __future__ import annotations

import hashlib
import pickle
import time
from pathlib import Path
from typing import Any

from backend.config import CACHE_DIR


def _cache_path(namespace: str, key: str) -> Path:
    """
    Generates a unique, filesystem-safe cache path from a namespace and key.
    MD5 hashing is used to create a consistent filename from the key.
    """
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    return CACHE_DIR / f"{namespace}_{digest}.pkl"


def load_cached(namespace: str, key: str, ttl_seconds: int) -> Any | None:
    """
    Tries to load a cached object from a pickle file.
    Returns None if the file doesn't exist or if its Time-To-Live (TTL) has expired.
    """
    path = _cache_path(namespace, key)
    if not path.exists():
        return None
    # Check if the file is older than the specified TTL.
    if time.time() - path.stat().st_mtime > ttl_seconds:
        return None
    # Deserialize the object from the pickle file.
    with path.open("rb") as handle:
        return pickle.load(handle)


def store_cached(namespace: str, key: str, payload: Any) -> None:
    """Serializes and stores a Python object in the cache using pickle."""
    path = _cache_path(namespace, key)
    # Ensure the cache directory exists.
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as handle:
        pickle.dump(payload, handle)
