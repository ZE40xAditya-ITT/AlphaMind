export interface SearchHistoryItem {
  id: number;
  user_id: number;
  stock_symbol: string;
  stock_name: string | null;
  technical_score: number | null;
  fundamental_score: number | null;
  final_score: number | null;
  recommendation: string | null;
  searched_at: string;
}
