from app.services.ranking_service import calculate_final_score, get_recommendation

def test_calculate_final_score():
    # 0.4 * tech + 0.6 * fund
    score = calculate_final_score(tech_score=100.0, fund_score=100.0)
    assert score == 100.0

    score2 = calculate_final_score(tech_score=50.0, fund_score=100.0)
    assert score2 == 80.0

def test_get_recommendation():
    assert get_recommendation(90) == "Strong Buy"
    assert get_recommendation(75) == "Buy"
    assert get_recommendation(60) == "Hold"
    assert get_recommendation(45) == "Weak"
    assert get_recommendation(20) == "Avoid"
