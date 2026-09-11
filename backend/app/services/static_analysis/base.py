from __future__ import annotations

from abc import ABC, abstractmethod

from app.services.static_analysis.models import StaticFinding


class StaticAnalyzer(ABC):
    """
    Base interface for all static analyzers.
    """

    name: str = "unknown"

    @abstractmethod
    async def analyze(
        self,
        file_path: str,
        content: str,
        language: str | None = None,
    ) -> list[StaticFinding]:
        """
        Analyze a source file and return deterministic findings.
        """
        raise NotImplementedError