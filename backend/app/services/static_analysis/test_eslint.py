import asyncio

from app.services.static_analysis.eslint import (
    ESLintAnalyzer,
)


async def main() -> None:

    analyzer = ESLintAnalyzer()

    code = """
import React from "react";

const unusedVariable = 123;

function App() {
    console.log("debug");

    debugger;

    const value = 10;

    return (
        <div>
            {value}
        </div>
    );
}

export default App;
"""

    findings = await analyzer.analyze(
        file_path="src/App.jsx",
        content=code,
        language="javascript",
    )

    print()
    print("=" * 80)
    print("REAL ESLINT RESULTS")
    print("=" * 80)
    print()

    print(
        f"Total findings: {len(findings)}"
    )
    print()

    for index, finding in enumerate(
        findings,
        start=1,
    ):
        print(
            f"[{index}] "
            f"{finding.severity.upper()}"
        )

        print(
            f"Analyzer:    "
            f"{finding.analyzer}"
        )

        print(
            f"Category:    "
            f"{finding.category}"
        )

        print(
            f"Title:       "
            f"{finding.title}"
        )

        print(
            f"File:        "
            f"{finding.file}"
        )

        print(
            f"Line:        "
            f"{finding.line}"
        )

        print(
            f"Confidence:  "
            f"{finding.confidence}"
        )

        print(
            f"Description: "
            f"{finding.description}"
        )

        print(
            f"Fix:         "
            f"{finding.suggested_fix}"
        )

        print("-" * 80)


if __name__ == "__main__":
    asyncio.run(main())