export interface Invoice {
  id: number;
  user_id: number;
  invoice_number: string;
  total_searches: number;
  amount: number;
  invoice_date: string;
  pdf_path: string | null;
  is_paid: boolean;
}

export interface InvoiceGenerateResponse {
  invoice: Invoice;
  message: string;
}
