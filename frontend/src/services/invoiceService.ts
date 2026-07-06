import api from './api';
import { Invoice, InvoiceGenerateResponse } from '../types/invoice';

export const generateInvoice = async (userId: number): Promise<InvoiceGenerateResponse> => {
  const response = await api.post<InvoiceGenerateResponse>(`/invoices/generate/${userId}`);
  return response.data;
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get<Invoice[]>('/invoices');
  return response.data;
};

export const getInvoice = async (id: number): Promise<Invoice> => {
  const response = await api.get<Invoice>(`/invoices/${id}`);
  return response.data;
};

export const downloadInvoicePdf = async (id: number, invoiceNumber: string): Promise<void> => {
  const response = await api.get(`/invoices/download/${id}`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${invoiceNumber.replace('/', '_')}.pdf`);
  document.body.appendChild(link);

  // Try standard click for desktop
  link.click();

  // Also try opening in a new tab for strict mobile browsers (like iOS Safari)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    window.open(url, '_blank');
  }

  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000); // Wait before cleanup for mobile browsers
};

export const markInvoiceAsPaid = async (id: number, isPaid: boolean): Promise<Invoice> => {
  const response = await api.put<Invoice>(`/invoices/${id}/pay`, { is_paid: isPaid });
  return response.data;
};
