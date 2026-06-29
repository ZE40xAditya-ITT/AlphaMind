def calculate_final_score(tech_score: float, fund_score: float) -> float:
    """Calculate the final investment score (0.6 * fundamental + 0.4 * technical) rounded to 1 decimal place."""
    return round((0.6 * fund_score) + (0.4 * tech_score), 1)

def get_recommendation(score: float) -> str:
    """Map the investment score to a recommendation label."""
    if score >= 85.0:
        return "Strong Buy"
    elif score >= 70.0:
        return "Buy"
    elif score >= 55.0:
        return "Hold"
    elif score >= 40.0:
        return "Weak"
    else:
        return "Avoid"

def get_rank_label(score: float) -> str:
    """Alias for recommendation label."""
    return get_recommendation(score)
