from app.services.token_budget import TokenEstimator


def test_empty_text_has_zero_tokens() -> None:
    estimator = TokenEstimator()

    result = estimator.estimate("")

    assert result.characters == 0
    assert result.estimated_tokens == 0


def test_token_estimation_uses_four_characters_per_token() -> None:
    estimator = TokenEstimator()

    result = estimator.estimate("a" * 100)

    assert result.characters == 100
    assert result.estimated_tokens == 25


def test_short_text_has_at_least_one_token() -> None:
    estimator = TokenEstimator()

    result = estimator.estimate("hello")

    assert result.estimated_tokens >= 1


def test_custom_character_ratio() -> None:
    estimator = TokenEstimator(
        chars_per_token=5.0,
    )

    result = estimator.estimate("a" * 100)

    assert result.estimated_tokens == 20


def test_invalid_character_ratio_is_rejected() -> None:
    try:
        TokenEstimator(chars_per_token=0)
        assert False
    except ValueError as error:
        assert "chars_per_token" in str(error)