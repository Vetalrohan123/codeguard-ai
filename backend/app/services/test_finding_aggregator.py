from app.schemas.ai_finding import AIFinding
from app.services.finding_aggregator import FindingAggregator
from app.services.static_analysis.models import StaticFinding


def make_ai(
    *,
    title: str,
    description: str,
    file: str = "src/App.jsx",
    line: int = 13,
    category: str = "quality",
    severity: str = "low",
    confidence: float = 0.95,
    suggested_fix: str = "",
    fixed_code: str = "",
) -> AIFinding:
    return AIFinding(
        severity=severity,
        category=category,
        title=title,
        description=description,
        file=file,
        line=line,
        why_it_matters=description,
        suggested_fix=suggested_fix or "Fix this issue.",
        fixed_code=fixed_code,
        confidence=confidence,
    )


# ======================================================================
# Deduplication
# ======================================================================


def test_eslint_and_gemini_console_finding_are_deduplicated():
    gemini = make_ai(
        title="Leftover debug console logging",
        description=(
            "A console.log call is left in production code."
        ),
        line=13,
        confidence=0.95,
        suggested_fix=(
            "Remove the console.log statement."
        ),
    )

    eslint = StaticFinding(
        analyzer="eslint",
        severity="low",
        category="quality",
        title="ESLint: no-console",
        description=(
            "ESLint reported: Unexpected console statement."
        ),
        file="src/App.jsx",
        line=13,
        suggested_fix=(
            "Remove the console.log()."
        ),
        confidence=0.98,
    )

    result = FindingAggregator.merge(
        ai_findings=[gemini],
        static_findings=[eslint],
    )

    assert len(result) == 1

    assert (
        FindingAggregator.normalize_issue(
            result[0]
        )
        == "console_logging"
    )


def test_eslint_and_gemini_debugger_are_deduplicated():
    gemini = make_ai(
        title="Debugger statement left in code",
        description=(
            "A debugger statement should not be committed."
        ),
        line=9,
    )

    eslint = StaticFinding(
        analyzer="eslint",
        severity="high",
        category="quality",
        title="ESLint: no-debugger",
        description=(
            "ESLint reported: Unexpected 'debugger' statement."
        ),
        file="src/App.jsx",
        line=9,
        confidence=0.98,
    )

    result = FindingAggregator.merge(
        ai_findings=[gemini],
        static_findings=[eslint],
    )

    assert len(result) == 1


def test_different_issues_are_not_deduplicated():
    first = make_ai(
        title="Unused variable",
        description=(
            "The variable is assigned but never used."
        ),
        line=4,
    )

    second = make_ai(
        title="Console logging",
        description=(
            "Debug output is present in production code."
        ),
        line=7,
    )

    result = FindingAggregator.deduplicate(
        [first, second]
    )

    assert len(result) == 2


def test_nearby_lines_are_deduplicated():
    first = make_ai(
        title="Debug console logging",
        description=(
            "A console.log call is present."
        ),
        line=10,
    )

    second = make_ai(
        title="ESLint no-console",
        description=(
            "Unexpected console statement."
        ),
        line=11,
    )

    result = FindingAggregator.deduplicate(
        [first, second]
    )

    assert len(result) == 1


def test_different_files_are_not_deduplicated():
    first = make_ai(
        title="Console logging",
        description=(
            "A console.log call is present."
        ),
        file="src/App.jsx",
        line=10,
    )

    second = make_ai(
        title="Console logging",
        description=(
            "A console.log call is present."
        ),
        file="src/utils.js",
        line=10,
    )

    result = FindingAggregator.deduplicate(
        [first, second]
    )

    assert len(result) == 2


# ======================================================================
# Static finding conversion
# ======================================================================


def test_static_finding_is_converted_to_ai_finding():
    static = StaticFinding(
        analyzer="eslint",
        severity="low",
        category="quality",
        title="ESLint: no-console",
        description="Unexpected console statement.",
        file="src/App.jsx",
        line=7,
        suggested_fix="Remove console.log().",
        confidence=0.98,
    )

    result = FindingAggregator.merge(
        ai_findings=[],
        static_findings=[static],
    )

    assert len(result) == 1
    assert result[0].file == "src/App.jsx"
    assert result[0].line == 7
    assert result[0].severity == "low"


# ======================================================================
# Confidence prioritization
# ======================================================================


def test_higher_confidence_finding_is_preferred():
    low_confidence = make_ai(
        title="Console logging",
        description="Console logging detected.",
        confidence=0.80,
    )

    high_confidence = make_ai(
        title="Console logging",
        description="Console logging detected.",
        confidence=0.99,
    )

    result = FindingAggregator.deduplicate(
        [
            low_confidence,
            high_confidence,
        ]
    )

    assert len(result) == 1
    assert result[0].confidence == 0.99


# ======================================================================
# File normalization
# ======================================================================


def test_file_path_normalization():
    assert (
        FindingAggregator.normalize_file(
            ".\\src\\App.jsx"
        )
        == "src/app.jsx"
    )

    assert (
        FindingAggregator.normalize_file(
            "./src/App.jsx"
        )
        == "src/app.jsx"
    )


# ======================================================================
# Issue normalization
# ======================================================================


def test_hardcoded_secret_is_normalized():
    finding = make_ai(
        title="Hardcoded password detected",
        description=(
            "A hardcoded password was found in source code."
        ),
        category="security",
    )

    assert (
        FindingAggregator.normalize_issue(
            finding
        )
        == "hardcoded_secret"
    )


def test_unused_variable_is_normalized():
    finding = make_ai(
        title="ESLint: @typescript-eslint/no-unused-vars",
        description=(
            "'unusedVariable' is assigned a value "
            "but never used."
        ),
    )

    assert (
        FindingAggregator.normalize_issue(
            finding
        )
        == "unused_variable"
    )


# ======================================================================
# Severity calibration
# ======================================================================


def test_low_confidence_ai_critical_is_downgraded():
    finding = make_ai(
        title="Potential critical security issue",
        description=(
            "Potential critical security vulnerability."
        ),
        category="security",
        severity="critical",
        confidence=0.50,
    )

    result = FindingAggregator.calibrate_severity(
        finding=finding,
        source="ai",
    )

    assert result.severity == "high"


def test_low_confidence_ai_high_is_downgraded():
    finding = make_ai(
        title="Potential high severity security issue",
        description=(
            "Potential security vulnerability."
        ),
        category="security",
        severity="high",
        confidence=0.40,
    )

    result = FindingAggregator.calibrate_severity(
        finding=finding,
        source="ai",
    )

    assert result.severity == "medium"


def test_high_confidence_ai_critical_is_preserved():
    finding = make_ai(
        title="Confirmed critical security issue",
        description=(
            "A critical security vulnerability was confirmed."
        ),
        category="security",
        severity="critical",
        confidence=0.95,
    )

    result = FindingAggregator.calibrate_severity(
        finding=finding,
        source="ai",
    )

    assert result.severity == "critical"


def test_static_critical_is_never_downgraded():
    finding = make_ai(
        title="Static critical finding",
        description=(
            "Deterministic analyzer finding."
        ),
        category="security",
        severity="critical",
        confidence=1.0,
    )

    result = FindingAggregator.calibrate_severity(
        finding=finding,
        source="static",
    )

    assert result.severity == "critical"


# ======================================================================
# Severity-aware deduplication
# ======================================================================


def test_higher_severity_duplicate_is_preferred():
    low_severity = make_ai(
        title="Console logging",
        description=(
            "Console logging was detected."
        ),
        severity="low",
        confidence=0.99,
        line=13,
    )

    high_severity = make_ai(
        title="Console logging",
        description=(
            "Console logging creates a potential "
            "information disclosure risk."
        ),
        category="security",
        severity="high",
        confidence=0.70,
        line=13,
    )

    # Use the same category/issue so they are duplicates.
    high_severity = high_severity.model_copy(
        update={
            "category": "quality",
        }
    )

    result = FindingAggregator.deduplicate(
        [
            low_severity,
            high_severity,
        ]
    )

    assert len(result) == 1
    assert result[0].severity == "high"


def test_critical_beats_high_even_with_lower_confidence():
    high = make_ai(
        title="Security issue",
        description=(
            "A high severity security issue was detected."
        ),
        category="security",
        severity="high",
        confidence=0.99,
        line=20,
    )

    critical = make_ai(
        title="Security issue",
        description=(
            "A critical security issue was detected."
        ),
        category="security",
        severity="critical",
        confidence=0.70,
        line=20,
    )

    result = FindingAggregator.deduplicate(
        [
            high,
            critical,
        ]
    )

    assert len(result) == 1
    assert result[0].severity == "critical"


def test_same_severity_higher_confidence_wins():
    low_confidence = make_ai(
        title="Security issue",
        description="Security issue detected.",
        category="security",
        severity="high",
        confidence=0.70,
        line=20,
    )

    high_confidence = make_ai(
        title="Security issue",
        description="Security issue detected.",
        category="security",
        severity="high",
        confidence=0.95,
        line=20,
    )

    result = FindingAggregator.deduplicate(
        [
            low_confidence,
            high_confidence,
        ]
    )

    assert len(result) == 1
    assert result[0].confidence == 0.95


def test_same_severity_and_confidence_richer_finding_wins():
    basic = make_ai(
        title="Security issue",
        description="Security issue.",
        category="security",
        severity="high",
        confidence=0.90,
        line=20,
        suggested_fix="Fix it.",
    )

    richer = make_ai(
        title="Security issue",
        description=(
            "A security issue allows untrusted input "
            "to reach a sensitive operation."
        ),
        category="security",
        severity="high",
        confidence=0.90,
        line=20,
        suggested_fix=(
            "Validate the input before passing it "
            "to the sensitive operation."
        ),
        fixed_code=(
            "validateInput(value)"
        ),
    )

    result = FindingAggregator.deduplicate(
        [
            basic,
            richer,
        ]
    )

    assert len(result) == 1
    assert result[0].fixed_code == "validateInput(value)"


# ======================================================================
# Severity sorting
# ======================================================================


def test_findings_are_sorted_by_severity():
    low = make_ai(
        title="Low issue",
        description="Low severity issue.",
        severity="low",
        confidence=0.99,
    )

    medium = make_ai(
        title="Medium issue",
        description="Medium severity issue.",
        severity="medium",
        confidence=0.80,
    )

    high = make_ai(
        title="High issue",
        description="High severity issue.",
        severity="high",
        confidence=0.70,
    )

    critical = make_ai(
        title="Critical issue",
        description="Critical severity issue.",
        severity="critical",
        confidence=0.60,
    )

    result = FindingAggregator.sort(
        [
            low,
            medium,
            high,
            critical,
        ]
    )

    assert [
        finding.severity
        for finding in result
    ] == [
        "critical",
        "high",
        "medium",
        "low",
    ]


def test_same_severity_is_sorted_by_confidence():
    low_confidence = make_ai(
        title="Security issue",
        description="Security issue.",
        category="security",
        severity="high",
        confidence=0.60,
        line=10,
    )

    high_confidence = make_ai(
        title="Another security issue",
        description="Another security issue.",
        category="security",
        severity="high",
        confidence=0.95,
        line=20,
    )

    result = FindingAggregator.sort(
        [
            low_confidence,
            high_confidence,
        ]
    )

    assert result[0].confidence == 0.95
    assert result[1].confidence == 0.60


# ======================================================================
# Score-independent helper behavior
# ======================================================================


def test_severity_rank_orders_findings_correctly():
    assert (
        FindingAggregator._severity_rank("critical")
        > FindingAggregator._severity_rank("high")
    )

    assert (
        FindingAggregator._severity_rank("high")
        > FindingAggregator._severity_rank("medium")
    )

    assert (
        FindingAggregator._severity_rank("medium")
        > FindingAggregator._severity_rank("low")
    )


def test_unknown_severity_has_zero_rank():
    assert (
        FindingAggregator._severity_rank("unknown")
        == 0
    )


def test_is_better_finding_prefers_higher_severity():
    existing = make_ai(
        title="Security issue",
        description="Existing issue.",
        category="security",
        severity="medium",
        confidence=0.99,
    )

    candidate = make_ai(
        title="Security issue",
        description="Candidate issue.",
        category="security",
        severity="high",
        confidence=0.50,
    )

    assert (
        FindingAggregator._is_better_finding(
            candidate,
            existing,
        )
        is True
    )


def test_is_better_finding_prefers_confidence_when_severity_matches():
    existing = make_ai(
        title="Security issue",
        description="Existing issue.",
        category="security",
        severity="high",
        confidence=0.70,
    )

    candidate = make_ai(
        title="Security issue",
        description="Candidate issue.",
        category="security",
        severity="high",
        confidence=0.95,
    )

    assert (
        FindingAggregator._is_better_finding(
            candidate,
            existing,
        )
        is True
    )