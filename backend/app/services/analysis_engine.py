import pandas as pd
from typing import Dict, Any, Tuple

from app.services import technical_analysis_service, fundamental_analysis_service, ranking_service

class AnalysisEngine:
    """
    Encapsulates the logic to perform technical and fundamental analysis,
    and calculate composite ranking scores.
    """
    
    def analyze(self, hist: pd.DataFrame, info: Dict[str, Any]) -> Tuple[Any, Any, float, str, str]:
        # 1. Perform Technical Analysis
        tech_analysis = technical_analysis_service.analyze(hist)

        # 2. Perform Fundamental Analysis
        fund_analysis = fundamental_analysis_service.analyze(info)

        # 3. Composite Ranking
        final_score = ranking_service.calculate_final_score(
            tech_analysis.technical_score, fund_analysis.fundamental_score
        )
        recommendation = ranking_service.get_recommendation(final_score)
        rank_label = ranking_service.get_rank_label(final_score)
        
        return tech_analysis, fund_analysis, final_score, recommendation, rank_label
