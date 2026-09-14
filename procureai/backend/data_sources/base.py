"""Base data source abstraction for ProcureAI live data ingestion."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseDataSource(ABC):
    """Abstract interface defining contract for all procurement data source adapters.
    
    Subclasses can implement specific ingestion channels:
    e.g., government portal scrapers, REST API connectors, streaming message queues,
    or deterministic mock generators.
    """

    @abstractmethod
    def get_source_name(self) -> str:
        """Return the unique identifier/name for this data source."""
        pass

    @abstractmethod
    def fetch_records(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch a batch of raw procurement tender records.
        
        Args:
            limit: Maximum number of records to fetch in this batch.
            
        Returns:
            List of raw dictionaries representing individual procurement records.
        """
        pass
