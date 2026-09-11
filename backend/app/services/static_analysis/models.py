from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


StaticSeverity = Literal[
    "critical",
    "high",
    "medium",
    "low",
]


@dataclass
class StaticFinding:
    """
    Finding produced by a deterministic static analyzer.
    """

    analyzer: str
    severity: StaticSeverity
    category: str
    title: str
    description: str
    file: str
    line: int
    suggested_fix: str | None = None
    confidence: float = 1.0