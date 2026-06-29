from abc import ABC, abstractmethod
from typing import Any, Optional

class CacheProvider(ABC):
    """
    Boundary interface for caching layer.
    Decouples the business logic from memory-dicts, Redis, or other caching mechanisms.
    """
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Retrieve an item from the cache by key. Returns None if miss or expired."""
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Store an item in the cache with a time-to-live."""
        pass
