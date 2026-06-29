export interface WatchlistCreate {
  stock_symbol: string;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  stock_symbol: string;
  added_at: string;
}
