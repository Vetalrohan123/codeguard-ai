import asyncio

from app.services.static_analysis.ruff_bandit import (
    RuffBanditAnalyzer,
)


async def main() -> None:
    analyzer = RuffBanditAnalyzer()

    code = """
import subprocess

password = "super-secret-password"

unused_variable = 123

result = eval("2 + 2")

subprocess.run(
    "ls -la",
    shell=True,
)

print(password)
"""

    findings = await analyzer.analyze(
        file_path="example.py",
        content=code,
        language="python",
    )

    print()
    print("=" * 80)
    print("REAL RUFF + BANDIT RESULTS")
    print("=" * 80)
    print()

    print(f"Total findings: {len(findings)}")
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
            f"Analyzer:    {finding.analyzer}"
        )

        print(
            f"Category:    {finding.category}"
        )

        print(
            f"Title:       {finding.title}"
        )

        print(
            f"File:        {finding.file}"
        )

        print(
            f"Line:        {finding.line}"
        )

        print(
            f"Confidence:  {finding.confidence}"
        )

        print(
            f"Description: {finding.description}"
        )

        print(
            f"Fix:         {finding.suggested_fix}"
        )

        print("-" * 80)


if __name__ == "__main__":
    asyncio.run(main())