import { apiClient } from './client.js';
import axios from 'axios';

export interface CreditAccount {
  id: string;
  name: string;
  type: string;
  balance: string;
  is_joint: boolean;
  linked_bank_id: string | null;
}

export interface CreditStatement {
  id: string;
  account_id: string;
  statement_date: string;
  due_date: string;
  closing_balance: string;
  minimum_payment: string | null;
  pdf_path: string | null;
  ai_analyzed_at: string | null;
  created_at: string;
}

export interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
  is_subscription: boolean;
}

export interface StatementAnalysis {
  transactions:       ExtractedTransaction[];
  flagged:            { merchant: string; amount: number; reason: string }[];
  summary:            string;
  total_spent:        number;
  total_transactions: number;
}

export interface AnalysisResult {
  analysis: StatementAnalysis;
  pdf_path?: string;
}

export const statementsApi = {
  async getAccounts(): Promise<CreditAccount[]> {
    const { data } = await apiClient.get<CreditAccount[]>('/statements/accounts');
    return data;
  },

  async createAccount(name: string): Promise<CreditAccount> {
    const { data } = await apiClient.post<CreditAccount>('/statements/accounts', { name });
    return data;
  },

  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/statements/accounts/${id}`);
  },

  async getStatements(accountId: string): Promise<CreditStatement[]> {
    const { data } = await apiClient.get<CreditStatement[]>(`/statements/accounts/${accountId}/statements`);
    return data;
  },

  async uploadAndAnalyze(accountId: string, file: File): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<AnalysisResult>(
      `/statements/accounts/${accountId}/upload-analyze`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async analyzeText(accountId: string, text: string): Promise<AnalysisResult> {
    const { data } = await apiClient.post<AnalysisResult>(
      `/statements/accounts/${accountId}/analyze-text`,
      { text }
    );
    return data;
  },

  async saveAnalysis(accountId: string, data: {
    statement_date: string;
    due_date: string;
    closing_balance: number;
    minimum_payment?: number;
    pdf_path?: string;
    transactions: ExtractedTransaction[];
  }): Promise<{ statement: CreditStatement; transactions_saved: number }> {
    const { data: result } = await apiClient.post(`/statements/accounts/${accountId}/save-analysis`, data);
    return result;
  },
};