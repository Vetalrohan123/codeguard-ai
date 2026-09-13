from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import ValidationError

from app.config import settings
from app.schemas.ai_finding import (
    AIFinding,
    AIFindingResponse,
)
from app.services.ai_providers.base import AIProviderError
from app.services.ai_providers.manager import AIProviderManager
from app.services.review_context import (
    ReviewContext,
    ReviewFileContext,
)
from app.services.static_analysis.models import StaticFinding


logger = logging.getLogger(__name__)


class AIReviewError(Exception):
    """Raised when an AI code review cannot be completed."""


class AIReviewService:
    """
    AI-powered code review service.

    Responsibilities:
    - Build semantic review prompts
    - Provide multi-file review context
    - Include static-analysis evidence
    - Call Gemini through AIProviderManager
    - Parse and validate AI responses
    - Validate finding file paths and line numbers
    - Support compatibility with ReviewOrchestrator

    CodeGuard AI intentionally uses Gemini as its only AI provider.
    There is no OpenAI provider and no fallback provider.
    """

    SYSTEM_PROMPT = """
You are CodeGuard AI, an expert senior software engineer,
application security engineer, and code reviewer.

You are reviewing source code that has already been analyzed by
deterministic static-analysis tools such as ESLint, Ruff, and Bandit.

Your job is to combine:

1. The supplied source code.
2. The supplied related changed files.
3. The supplied static-analysis findings.
4. Your own semantic reasoning.

IMPORTANT PRINCIPLE:

Static-analysis findings are EVIDENCE, not automatically correct findings.

For every supplied static finding, reason about whether it is:

CONFIRMED:
The static analyzer correctly identified a real issue.

FALSE_POSITIVE:
The analyzer reported something that is not actually problematic
in the supplied source code.

ENHANCED:
The static analyzer found a real issue, and you discovered additional
context or impact that materially changes how important the issue is.

NEW:
You discovered a separate issue that the static analyzer did not detect.

DO NOT blindly duplicate static findings.

If a static finding is correct but there is no additional insight,
DO NOT create a second AI finding for the exact same issue.

The deterministic static finding will remain responsible for that issue.

Only create an AI finding for a static finding when you have
meaningful additional information such as:

* a higher severity
* a security implication
* a real production impact
* a deeper correctness problem
* a data exposure consequence
* a performance consequence
* an architectural consequence
* or a more specific remediation

MULTI-FILE REVIEW:

The supplied files belong to the same changed pull request.

Use the related files as contextual evidence.

You may identify problems involving relationships between files,
including:

* API contract mismatches
* incorrect function calls
* incorrect imports
* frontend/backend mismatches
* incompatible data structures
* authentication inconsistencies
* authorization inconsistencies
* validation inconsistencies
* shared-state problems
* incorrect service boundaries
* database assumption mismatches
* inconsistent error handling
* broken state transitions
* cross-file security vulnerabilities
* incorrect type assumptions

Only report cross-file issues when the supplied files provide
sufficient evidence.

DO NOT invent files or dependencies that were not supplied.

You must also search for issues static analyzers cannot reliably detect:

* logic bugs
* incorrect business logic
* authorization problems
* authentication flaws
* data leaks
* race conditions
* incorrect API behavior
* invalid state transitions
* error handling problems
* null/undefined behavior
* incorrect assumptions
* resource lifecycle problems
* concurrency problems
* data integrity issues
* security vulnerabilities
* meaningful performance problems
* dangerous edge cases

EVIDENCE RULES:

Only report issues supported by the supplied source code.

DO NOT invent:

* functions
* variables
* files
* APIs
* dependencies
* runtime behavior
* vulnerabilities
* line numbers

Do not report hypothetical problems without reasonable evidence.

LINE NUMBER RULE:

The line number MUST correspond to the supplied source code
for the file referenced by the finding.

Use 1-based line numbering.

FILE RULE:

The file field MUST contain the exact supplied file path.

The finding may reference:

1. The current file.
2. Another changed file supplied in the multi-file context.

Do not reference files that were not supplied.

SEVERITY:

critical:
Severe security vulnerability, authentication bypass,
remote code execution, serious data loss, or equivalent impact.

high:
Serious security vulnerability, major correctness bug,
significant data exposure, or likely production failure.

medium:
Meaningful bug, reliability problem, performance issue,
or maintainability problem that should be fixed.

low:
Minor quality issue or low-impact problem.

CATEGORY:

bug
security
performance
quality
style

CONFIDENCE:

Confidence MUST be between 0 and 1.

Prefer fewer high-confidence findings over many speculative findings.

DUPLICATION RULE:

Never report the same underlying issue twice.

For example, if ESLint reports:

"Unexpected console statement"

do NOT create an AI finding saying:

"Remove console.log debugging"

unless you discovered materially new information such as:

"The console statement logs an authentication token."

In that case, report the security impact rather than merely repeating
the ESLint warning.

CROSS-FILE DUPLICATION:

If the same underlying issue affects multiple files, prefer a single
finding pointing to the most relevant source location.

Do not create multiple findings for the same root cause merely because
multiple files participate in it.

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "findings": [
    {
      "severity": "high",
      "category": "security",
      "title": "Example issue",
      "description": "Example description",
      "file": "src/example.ts",
      "line": 42,
      "why_it_matters": "Example impact",
      "suggested_fix": "Example fix",
      "fixed_code": "Example corrected code",
      "confidence": 0.95
    }
  ]
}

If there are no additional AI findings:

{
  "findings": []
}

Do not include markdown fences.

Do not include explanations outside JSON.

Do not include comments outside JSON.

Do not change the JSON structure.
""".strip()

    def __init__(self) -> None:
        """
        Initialize the AI review service.

        CodeGuard AI uses Gemini only.
        """

        self.provider = settings.AI_PROVIDER.strip().lower()
        self.model = settings.AI_MODEL.strip()

        if self.provider != "gemini":
            logger.error(
                "Unsupported AI provider configured | provider=%s",
                self.provider,
            )

            raise AIReviewError(
                "Only Gemini is supported. "
                "Set AI_PROVIDER=gemini."
            )

        if not self.model:
            raise AIReviewError(
                "Gemini AI model is not configured."
            )

        try:
            self.provider_manager = (
                AIProviderManager.from_settings(
                    provider_name=self.provider,
                    model=self.model,
                )
            )

        except AIProviderError as error:
            logger.error(
                "Failed to initialize Gemini AI provider | "
                "provider=%s | model=%s | error=%s",
                self.provider,
                self.model,
                error,
            )

            raise AIReviewError(
                str(error)
            ) from error

        logger.info(
            "AI Review Service initialized | "
            "provider=%s | model=%s",
            self.provider,
            self.model,
        )

    async def review_code(
        self,
        code: str,
        file_path: str,
        language: str | None = None,
        static_findings: list[StaticFinding] | None = None,
        review_context: ReviewContext | None = None,
    ) -> AIFindingResponse:
        """
        Analyze source code and return validated AI findings.

        review_context contains all relevant changed files for
        multi-file reasoning.

        static_findings contains deterministic findings from tools
        such as ESLint, Ruff, and Bandit.
        """

        if not file_path.strip():
            raise AIReviewError(
                "File path is required for AI review."
            )

        if not code.strip():
            logger.warning(
                "Skipping empty source file | file=%s",
                file_path,
            )

            return AIFindingResponse(
                findings=[]
            )

        static_findings = static_findings or []

        prompt = self._build_prompt(
            code=code,
            file_path=file_path,
            language=language,
            static_findings=static_findings,
            review_context=review_context,
        )

        context_file_count = (
            len(review_context.files)
            if review_context is not None
            else 1
        )

        logger.info(
            "Starting AI review | "
            "provider=%s | model=%s | "
            "file=%s | language=%s | "
            "chars=%d | static_findings=%d | "
            "context_files=%d",
            self.provider,
            self.model,
            file_path,
            language or "unknown",
            len(code),
            len(static_findings),
            context_file_count,
        )

        try:
            raw_response = await self._call_provider(
                prompt
            )

            logger.info(
                "AI response received | "
                "provider=%s | file=%s | chars=%d",
                self.provider,
                file_path,
                len(raw_response),
            )

            result = self._parse_response(
                raw_response
            )

            result = (
                self._validate_findings_against_source(
                    result=result,
                    code=code,
                    file_path=file_path,
                    review_context=review_context,
                )
            )

            logger.info(
                "AI review completed | "
                "provider=%s | file=%s | ai_findings=%d",
                self.provider,
                file_path,
                len(result.findings),
            )

            return result

        except AIReviewError:
            raise

        except Exception as error:
            logger.exception(
                "Unexpected AI review error | file=%s",
                file_path,
            )

            raise AIReviewError(
                f"Unexpected AI review error for {file_path}: "
                f"{type(error).__name__}: {error}"
            ) from error

    async def review_file(
        self,
        path: str,
        content: str,
        language: str | None = None,
        static_findings: list[StaticFinding] | None = None,
        review_context: ReviewContext | None = None,
        project_context: str | None = None,
        related_files: list[Any] | None = None,
    ) -> list[AIFinding]:
        """
        Compatibility wrapper for ReviewOrchestrator.

        Supported context inputs:

        1. review_context
           Preferred structured multi-file context.

        2. related_files
           Compatibility input supplied by older/newer orchestrator
           implementations.

        3. project_context
           Optional textual project context.

        The structured ReviewContext is preferred because it allows
        reliable file-path and line-number validation.
        """

        effective_context = review_context

        if (
            effective_context is None
            and related_files
        ):
            effective_context = (
                self._build_review_context_from_related_files(
                    current_path=path,
                    current_content=content,
                    current_language=language,
                    related_files=related_files,
                )
            )

        if (
            effective_context is not None
            and related_files
        ):
            logger.debug(
                "ReviewContext already supplied; "
                "ignoring related_files compatibility argument | "
                "file=%s | related_files=%d",
                path,
                len(related_files),
            )

        if (
            effective_context is None
            and project_context
        ):
            logger.debug(
                "Received project_context without ReviewContext | "
                "file=%s | chars=%d",
                path,
                len(project_context),
            )

        result = await self.review_code(
            code=content,
            file_path=path,
            language=language,
            static_findings=static_findings,
            review_context=effective_context,
        )

        return result.findings

    @staticmethod
    def _build_review_context_from_related_files(
        current_path: str,
        current_content: str,
        current_language: str | None,
        related_files: list[Any],
    ) -> ReviewContext:
        """
        Convert orchestrator related_files into ReviewContext.

        This method intentionally accepts Any because different
        orchestrator implementations may provide related files as:

        - ReviewFileContext
        - objects with path/content/language
        - dictionaries
        - lightweight file objects

        Invalid entries are skipped safely.
        """

        context = ReviewContext()

        context.add_file(
            path=current_path,
            language=current_language or "unknown",
            content=current_content,
        )

        for related_file in related_files:
            try:
                path: str | None = None
                language: str | None = None
                content: str | None = None
                imports: list[str] = []
                static_finding_count = 0

                if isinstance(
                    related_file,
                    ReviewFileContext,
                ):
                    path = related_file.path
                    language = related_file.language
                    content = related_file.content
                    imports = list(
                        related_file.imports
                    )
                    static_finding_count = (
                        related_file.static_finding_count
                    )

                elif isinstance(
                    related_file,
                    dict,
                ):
                    path = related_file.get(
                        "path"
                    )

                    language = related_file.get(
                        "language"
                    )

                    content = related_file.get(
                        "content"
                    )

                    imports_value = (
                        related_file.get(
                            "imports"
                        )
                    )

                    if isinstance(
                        imports_value,
                        (list, tuple),
                    ):
                        imports = [
                            str(value)
                            for value in imports_value
                            if value
                        ]

                    static_value = (
                        related_file.get(
                            "static_finding_count",
                            0,
                        )
                    )

                    try:
                        static_finding_count = int(
                            static_value or 0
                        )
                    except (
                        TypeError,
                        ValueError,
                    ):
                        static_finding_count = 0

                else:
                    path = getattr(
                        related_file,
                        "path",
                        None,
                    )

                    language = getattr(
                        related_file,
                        "language",
                        None,
                    )

                    content = getattr(
                        related_file,
                        "content",
                        None,
                    )

                    imports_value = getattr(
                        related_file,
                        "imports",
                        None,
                    )

                    if isinstance(
                        imports_value,
                        (list, tuple),
                    ):
                        imports = [
                            str(value)
                            for value in imports_value
                            if value
                        ]

                    static_value = getattr(
                        related_file,
                        "static_finding_count",
                        0,
                    )

                    try:
                        static_finding_count = int(
                            static_value or 0
                        )
                    except (
                        TypeError,
                        ValueError,
                    ):
                        static_finding_count = 0

                if not path:
                    logger.warning(
                        "Skipping related file without path"
                    )
                    continue

                if not content:
                    logger.warning(
                        "Skipping related file without content | "
                        "file=%s",
                        path,
                    )
                    continue

                if path == current_path:
                    continue

                context.add_file(
                    path=str(path),
                    language=str(
                        language or "unknown"
                    ),
                    content=str(content),
                    imports=imports,
                    static_finding_count=max(
                        0,
                        static_finding_count,
                    ),
                )

            except Exception as error:
                logger.warning(
                    "Failed to normalize related file | "
                    "error=%s",
                    error,
                )

        logger.debug(
            "Built ReviewContext from related_files | "
            "current=%s | files=%d",
            current_path,
            len(context.files),
        )

        return context

    def _build_prompt(
        self,
        code: str,
        file_path: str,
        language: str | None,
        static_findings: list[StaticFinding],
        review_context: ReviewContext | None = None,
    ) -> str:
        """
        Build the user prompt.

        The current file is always the primary target.

        When ReviewContext exists, bounded content from related
        changed files is supplied for cross-file reasoning.
        """

        language_name = (
            language.strip()
            if language
            else "unknown"
        )

        if review_context is not None:
            multi_file_context = (
                review_context.build_prompt_context(
                    current_file=file_path
                )
            )

            static_context = (
                review_context.build_static_context(
                    current_file=file_path
                )
            )

            context_section = f"""
============================================================
MULTI-FILE REVIEW CONTEXT
============================================================

The current pull request contains multiple changed files.

The current file is the PRIMARY REVIEW TARGET.

The other supplied files are RELATED CHANGED FILES.

Use them as contextual evidence when checking:

* API contracts
* imports
* function calls
* authentication
* authorization
* data structures
* state transitions
* shared logic
* validation
* error handling
* security boundaries
* frontend/backend compatibility

Do NOT invent files that are not supplied.

{multi_file_context}
""".strip()

        else:
            static_context = (
                self._format_static_findings(
                    static_findings
                )
            )

            context_section = """
============================================================
MULTI-FILE REVIEW CONTEXT
============================================================

No additional changed-file context was supplied.

Review the current file independently.
""".strip()

        return f"""
Review the following changed source file.

FILE:
{file_path}

LANGUAGE:
{language_name}

{context_section}

============================================================
STATIC ANALYSIS EVIDENCE
============================================================

The following findings were produced by deterministic tools.

They are evidence for your reasoning.

They are NOT automatically correct.

You must inspect the source code before deciding whether
they represent real issues.

{static_context}

============================================================
PRIMARY SOURCE CODE
============================================================

FILE:
{file_path}

{code}

============================================================
AI REVIEW PROCESS
============================================================

First, reason about every static-analysis finding.

For each static finding determine internally whether it is:

1. CONFIRMED
   The finding is a genuine problem.

2. FALSE_POSITIVE
   The finding does not represent a meaningful problem
   in this specific source code.

3. ENHANCED
   The finding is genuine and you discovered additional
   meaningful impact.

4. NEW
   You discovered a separate issue that static analysis
   did not detect.

============================================================
CROSS-FILE ANALYSIS
============================================================

After analyzing the primary file, inspect the related changed
files supplied in the context.

Look for:

* API request/response mismatches
* incorrect function calls
* incorrect imports
* authentication inconsistencies
* authorization inconsistencies
* frontend/backend mismatches
* incompatible data structures
* inconsistent validation
* shared-state problems
* inconsistent error handling
* incorrect service boundaries
* database assumption mismatches
* broken state transitions
* incorrect type assumptions
* cross-file security vulnerabilities

Only report cross-file problems when the supplied source code
provides sufficient evidence.

============================================================
DUPLICATION POLICY
============================================================

Do NOT return an AI finding for a static issue merely because
the static analyzer already detected it.

Example:

Static finding:
ESLint -> Unexpected console statement -> line 13

Bad AI output:

"Remove console.log from line 13."

That is a duplicate and MUST NOT be returned.

Instead, return no AI finding for it unless you discover
additional meaningful impact.

Example of meaningful additional impact:

The console statement logs:

accessToken

In that situation, report the security/data-exposure problem,
because the AI has discovered information beyond the original
static warning.

============================================================
FIND NEW PROBLEMS
============================================================

Inspect the code independently.

Look for:

* logic errors
* security vulnerabilities
* authentication issues
* authorization issues
* data leaks
* race conditions
* incorrect state handling
* API misuse
* invalid assumptions
* null/undefined problems
* resource leaks
* error handling problems
* data integrity problems
* meaningful performance problems
* dangerous edge cases
* incorrect business logic
* cross-file contract mismatches

============================================================
EVIDENCE RULE
============================================================

Only report issues supported by the supplied source code.

Do NOT invent:

* functions
* variables
* files
* APIs
* dependencies
* runtime behavior
* vulnerabilities
* line numbers

Do not report hypothetical problems without reasonable evidence.

============================================================
LINE NUMBER REQUIREMENTS
============================================================

Use actual 1-based line numbers.

The line MUST exist in the file referenced by the finding.

The file field MUST exactly match one of the supplied file paths.

============================================================
CROSS-FILE FINDING RULE
============================================================

If a problem involves multiple files, choose the most relevant
file and line as the primary finding location.

Do not create duplicate findings for the same root cause.

============================================================
OUTPUT REQUIREMENTS
============================================================

Only return NEW or materially ENHANCED AI findings.

Do not duplicate static findings.

If no additional AI finding exists, return:

{{
  "findings": []
}}

Return ONLY the required JSON object.
""".strip()

    @staticmethod
    def _format_static_findings(
        findings: list[StaticFinding],
    ) -> str:
        """
        Convert deterministic findings into explicit AI context.
        """

        if not findings:
            return """
No static-analysis findings were detected for this file.

Perform the review independently.
""".strip()

        sections: list[str] = []

        for index, finding in enumerate(
            findings,
            start=1,
        ):
            sections.append(
                f"""
STATIC FINDING #{index}

Analyzer:
{finding.analyzer}

Severity:
{finding.severity}

Category:
{finding.category}

Title:
{finding.title}

Description:
{finding.description}

File:
{finding.file}

Line:
{finding.line}

Suggested Fix:
{finding.suggested_fix or "No suggested fix supplied"}

Confidence:
{finding.confidence}

Remember:
This is deterministic analyzer evidence.
Validate it against the source code.
Do not blindly duplicate it.
""".strip()
            )

        return "\n\n".join(
            sections
        )

    async def _call_provider(
        self,
        prompt: str,
    ) -> str:
        """
        Send the request through AIProviderManager.

        AIProviderManager handles:
        - Gemini provider calls
        - retry behavior
        - transient error classification
        - Gemini provider errors

        There is intentionally no fallback provider.
        """

        logger.info(
            "Calling Gemini AI provider manager | "
            "provider=%s | model=%s",
            self.provider,
            self.model,
        )

        try:
            response = (
                await self.provider_manager.generate(
                    system_prompt=self.SYSTEM_PROMPT,
                    user_prompt=prompt,
                )
            )

            logger.info(
                "Gemini AI provider manager completed | "
                "provider=%s | model=%s",
                self.provider,
                self.model,
            )

            return response

        except AIProviderError as error:
            logger.error(
                "Gemini AI provider manager failed | "
                "provider=%s | model=%s | error=%s",
                self.provider,
                self.model,
                error,
            )

            raise AIReviewError(
                f"Gemini AI generation failed: {error}"
            ) from error

        except Exception as error:
            logger.exception(
                "Unexpected Gemini AI provider manager failure"
            )

            raise AIReviewError(
                "Unexpected Gemini AI generation failure: "
                f"{type(error).__name__}: {error}"
            ) from error

    def _parse_response(
        self,
        raw_response: str,
    ) -> AIFindingResponse:
        """
        Parse and validate the AI response.
        """

        cleaned = raw_response.strip()

        if not cleaned:
            raise AIReviewError(
                "AI returned an empty response."
            )

        if cleaned.startswith("```"):
            cleaned = (
                self._remove_markdown_fence(
                    cleaned
                )
            )

        try:
            payload: Any = json.loads(
                cleaned
            )

        except json.JSONDecodeError as error:
            logger.error(
                "AI returned invalid JSON: %s",
                cleaned[:2000],
            )

            raise AIReviewError(
                "AI returned invalid JSON: "
                f"{error}"
            ) from error

        if not isinstance(
            payload,
            dict,
        ):
            raise AIReviewError(
                "AI response must be a JSON object."
            )

        if "findings" not in payload:
            raise AIReviewError(
                "AI response is missing the "
                "'findings' field."
            )

        if not isinstance(
            payload["findings"],
            list,
        ):
            raise AIReviewError(
                "AI response 'findings' field "
                "must be an array."
            )

        try:
            validated = (
                AIFindingResponse.model_validate(
                    payload
                )
            )

        except ValidationError as error:
            logger.error(
                "AI response schema validation failed: %s",
                error,
            )

            raise AIReviewError(
                "AI response failed schema validation: "
                f"{error}"
            ) from error

        logger.info(
            "AI response validated successfully | "
            "findings=%d",
            len(validated.findings),
        )

        return validated

    @staticmethod
    def _validate_findings_against_source(
        result: AIFindingResponse,
        code: str,
        file_path: str,
        review_context: ReviewContext | None = None,
    ) -> AIFindingResponse:
        """
        Validate AI-generated file paths and line numbers.

        Without multi-file context:
            findings must reference the current file.

        With multi-file context:
            findings may reference any supplied changed file.
        """

        if review_context is None:
            source_map = {
                file_path: code,
            }

        else:
            source_map = {
                review_file.path: review_file.content
                for review_file in review_context.files
            }

            if file_path not in source_map:
                source_map[file_path] = code

        valid_findings: list[AIFinding] = []

        for finding in result.findings:
            finding_file = finding.file

            if finding_file not in source_map:
                logger.warning(
                    "Dropping AI finding with unknown "
                    "file path | file=%s",
                    finding_file,
                )
                continue

            source_lines = source_map[
                finding_file
            ].splitlines()

            line_count = len(
                source_lines
            )

            if (
                finding.line < 1
                or finding.line > line_count
            ):
                logger.warning(
                    "Dropping AI finding with invalid line | "
                    "file=%s | line=%s | line_count=%s",
                    finding_file,
                    finding.line,
                    line_count,
                )
                continue

            valid_findings.append(
                finding
            )

        return AIFindingResponse(
            findings=valid_findings
        )

    @staticmethod
    def _remove_markdown_fence(
        value: str,
    ) -> str:
        """
        Remove ```json ... ``` or ``` ... ``` wrappers.
        """

        lines = value.splitlines()

        if not lines:
            return ""

        if lines[0].strip().startswith("```"):
            lines = lines[1:]

        if (
            lines
            and lines[-1].strip() == "```"
        ):
            lines = lines[:-1]

        return "\n".join(
            lines
        ).strip()