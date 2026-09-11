import asyncio

from app.services.static_analysis.service import (
    StaticAnalysisService,
)


async def main() -> None:
    service = StaticAnalysisService()

    code = """
import subprocess

password = "my-secret-password"

user_input = input("Enter command: ")

eval(user_input)

exec(user_input)

subprocess.run(
    user_input,
    shell=True,
)

print("debug")
"""

    findings = await service.analyze_file(
        file_path="app/example.py",
        content=code,
        language="python",
    )

    print()
    print("=" * 70)
    print("PYTHON STATIC ANALYSIS RESULTS")
    print("=" * 70)

    print(f"Findings: {len(findings)}")
    print()

    for finding in findings:
        print(f"Analyzer:    {finding.analyzer}")
        print(f"Severity:    {finding.severity}")
        print(f"Category:    {finding.category}")
        print(f"Title:       {finding.title}")
        print(f"File:        {finding.file}")
        print(f"Line:        {finding.line}")
        print(f"Confidence:  {finding.confidence}")
        print(f"Description: {finding.description}")
        print(f"Fix:         {finding.suggested_fix}")
        print("-" * 70)


if __name__ == "__main__":
    asyncio.run(main())