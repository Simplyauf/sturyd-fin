/**
 * Fintech API Client
 * Comprehensive integration for the USD-to-INR Remittance Platform.
 * 
 * This client can be used in React, Vue, or ported directly to Flutter.
 */

export type KYCStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  kycStatus: KYCStatus;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Beneficiary {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  currency: string;
}

export interface Transaction {
  id: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  exchangeRate: number;
  status: 'AWAITING_PAYMENT' | 'PAYIN_COMPLETED' | 'PAYOUT_INITIATED' | 'SETTLED' | 'FAILED';
  paymentLink?: string;
  beneficiary?: Beneficiary;
  createdAt?: string;
}

export class FintechAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'https://globaltech.fitro.tech/api') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      let errorMsg = 'API request failed';
      try {
        const error = await response.json();
        errorMsg = error.message || errorMsg;
      } catch (e) {
        // non-json response
      }
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Prevent redirect loop if already on login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // AUTH
  async register(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  // USERS
  async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async verifyKyc(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    mobile: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    ssn: string;
    document?: string;
  }): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/users/kyc/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // BENEFICIARIES
  async getBeneficiaries(): Promise<Beneficiary[]> {
    return this.request<Beneficiary[]>('/beneficiaries');
  }

  async addBeneficiary(data: Omit<Beneficiary, 'id' | 'currency'> & { address: string; city: string; postcode: string }): Promise<Beneficiary> {
    return this.request<Beneficiary>('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // TRANSACTIONS
  async getQuote(): Promise<{ exchangeRate: number; sourceCurrency: string; destinationCurrency: string }> {
    return this.request<{ exchangeRate: number; sourceCurrency: string; destinationCurrency: string }>('/transactions/quote');
  }

  async initiateTransfer(beneficiaryId: string, amountUsd: number): Promise<Transaction & { paymentLink: string }> {
    return this.request<Transaction & { paymentLink: string }>('/transactions/initiate', {
      method: 'POST',
      body: JSON.stringify({ beneficiaryId, amountUsd }),
    });
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/transactions');
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/transactions/all');
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/users/all');
  }

  async approveKyc(userId: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/users/${userId}/kyc/approve`, {
      method: 'POST',
    });
  }

  async rejectKyc(userId: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/users/${userId}/kyc/reject`, {
      method: 'POST',
    });
  }

  // WALLET
  async getWalletBalance(): Promise<{ balanceUsd: number; currency: string }> {
    return this.request<{ balanceUsd: number; currency: string }>('/wallet');
  }

  async depositToWallet(amountUsd: number): Promise<{ balanceUsd: number; currency: string }> {
    return this.request<{ balanceUsd: number; currency: string }>('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amountUsd }),
    });
  }

  // WEBHOOKS (admin)
  async getWebhookLogs(): Promise<{ id: string; event: string; transactionId: string; processedAt: string; createdAt: string }[]> {
    return this.request('/webhooks/logs');
  }

  /**
   * DEMO ONLY: Simulates the payment success webhook from Nium
   */
  async simulatePaymentSuccess(transactionId: string): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/simulate-success/${transactionId}`, {
      method: 'POST',
    });
  }
}

export const api = new FintechAPI();
