import { Injectable } from '@nestjs/common';

@Injectable()
export class SimulationService {
  /**
   * Simulates an FX quote for USD to INR.
   * Standard rate is ~83.00, we add a random spread.
   */
  async getFxQuote(): Promise<number> {
    const baseRate = 83.15;
    const fluctuation = (Math.random() - 0.5) * 0.1;
    return parseFloat((baseRate + fluctuation).toFixed(4));
  }

  /**
   * Simulates a KYC verification call to Nium's Compliance Suite.
   */
  async verifyKyc(userId: string): Promise<{ status: string, customerHash: string }> {
    console.log(`[Nium Simulation] Verifying KYC for user ${userId}...`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'COMPLETED',
      customerHash: `nium_cust_${Math.random().toString(36).substring(7)}`
    };
  }

  /**
   * Simulates a Nium Pay-in (Virtual Request for Payment / VRA)
   */
  async createPayinLink(amount: number, currency: string): Promise<string> {
    const mockId = Math.random().toString(36).substring(7);
    return `https://pay.nium.com/checkout/simulated_${mockId}`;
  }

  /**
   * Simulates the Nium Remittance payout.
   */
  async triggerPayout(amount: number, currency: string, beneficiaryId: string): Promise<string> {
    console.log(`[Nium Simulation] Triggering INR payout for ${amount} to beneficiary ${beneficiaryId}...`);
    return `nium_remit_ref_${Math.random().toString(36).substring(7)}`;
  }
}
