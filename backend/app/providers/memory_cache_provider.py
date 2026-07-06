import time
from typing import Any, Optional, Dict
from app.interfaces.cache_interface import CacheProvider

class MemoryCacheProvider(CacheProvider):
    """
    Concrete implementation of CacheProvider using an in-memory dictionary.
    """

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            return None

        if time.time() > entry['expires_at']:
            del self._cache[key]
            return None

        return entry['value']

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        self._cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl_seconds
        }
