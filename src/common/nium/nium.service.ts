import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NiumService {
  private readonly gatewayUrl: string;
  private readonly apiKey: string;
  private readonly clientHashId: string;

  constructor(private configService: ConfigService) {
    this.gatewayUrl = this.configService.get<string>('NIUM_API_URL') || 'https://gateway.nium.com/api';
    this.apiKey = this.configService.get<string>('NIUM_API_KEY') || '';
    this.clientHashId = this.configService.get<string>('NIUM_CLIENT_ID') || '';
  }

  /**
   * Test connection to Nium API
   */
  async testConnection() {
    return this.request('GET', '/v1/client/{clientHashId}');
  }

  private async request<T>(method: string, path: string, body?: any, params: Record<string, string> = {}): Promise<T> {
    let finalPath = path.replace('{clientHashId}', this.clientHashId);
    Object.entries(params).forEach(([key, value]) => {
      finalPath = finalPath.replace(`{${key}}`, value);
    });
    
    const url = `${this.gatewayUrl}${finalPath}`;
    console.log(`[Nium API Request] ${method} ${url}`);

    const headers = {
      'x-api-key': this.apiKey,
      'x-request-id': `fintech-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    console.log('[Nium API Headers]', Object.keys(headers).join(', '));

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Nium API Error Response]', JSON.stringify(data, null, 2));
        throw new InternalServerErrorException(data.message || data.errors?.[0]?.message || 'Nium API error');
      }

      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      console.error('[Nium Fetch Error]', error);
      throw new InternalServerErrorException('Failed to communicate with Nium API');
    }
  }

  async onboardCustomer(userData: {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    mobile: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
    ssn: string;
  }) {
    const ssnClean = userData.ssn.replace(/-/g, '');
    const uniqueId = Date.now();
    
    // Sanitize fields (remove dots and special chars that often fail Nium validation)
    const sanitize = (val: string) => val.replace(/[./]/g, '').trim();

    const payload: any = {
      firstName: sanitize(userData.firstName),
      lastName: sanitize(userData.lastName),
      email: userData.email,
      countryCode: 'US',
      nationality: 'US',
      mobile: userData.mobile,
      dateOfBirth: userData.dateOfBirth,
      gender: 'Male',
      customerType: 'INDIVIDUAL',
      complianceLevel: 'SCREENING_KYC',
      kycMode: 'E_KYC',
      pep: false,
      verificationConsent: true,
      isTncAccepted: true,
      termsAndConditionAcceptanceFlag: true,
      intendedUseOfAccount: 'IU101',
      occupation: 'OC0001',
      estimatedMonthlyFunding: 'MF001',
      estimatedMonthlyFundingCurrency: 'USD',
      internationalPaymentsSupported: true,
      expectedCountriesToSendReceiveFrom: ['US', 'IN'],
      billingAddress1: sanitize(userData.address1),
      billingCity: sanitize(userData.city),
      billingState: userData.state.toUpperCase(),
      billingZipCode: userData.zipCode,
      billingCountry: 'US',
      correspondenceAddress1: sanitize(userData.address1),
      correspondenceCity: sanitize(userData.city),
      correspondenceZipCode: userData.zipCode,
      correspondenceCountry: 'US',
      deliveryAddress1: sanitize(userData.address1),
      deliveryCity: sanitize(userData.city),
      deliveryZipCode: userData.zipCode,
      deliveryCountry: 'US',
      deviceInfo: 'Web-Browser',
      ipAddress: '127.0.0.1',
      countryIP: 'US',
      sessionId: `sess_${uniqueId}`,
      taxDetails: [{ countryOfResidence: 'US', taxIdNumber: ssnClean }],
      identificationDoc: [{
        identificationType: 'National Id',
        identificationValue: ssnClean,
        identificationDocIssuanceCountry: 'US'
      }]
    };

    console.log('[Nium Unified Onboarding Payload]', JSON.stringify(payload, null, 2));
    return this.request<any>('POST', '/v4/client/{clientHashId}/customer', payload);
  }

  /**
   * Upload an identification document for a customer
   */
  async uploadDocument(customerHashId: string, documentBase64: string) {
    const payload = {
      document: [
        {
          fileName: 'id_front.jpg',
          fileType: 'image/jpeg',
          document: documentBase64,
          documentType: 'National Id',
          identificationDocIssuanceCountry: 'US'
        }
      ]
    };

    console.log(`[Nium Upload Document] For customer ${customerHashId}`);
    return this.request<any>('POST', '/v1/client/{clientHashId}/customer/{customerHashId}/uploadDocument', payload, { customerHashId });
  }

  /**
   * Get FX quote
   */
  async getFxQuote(source: string, destination: string, amount: number, customerHashId?: string) {
    const payload: any = {
      sourceCurrencyCode: source,
      destinationCurrencyCode: destination,
      sourceAmount: amount,
      quoteType: 'payout',
      conversionSchedule: 'immediate',
      lockPeriod: '5_mins',
    };

    if (customerHashId) payload.customerHashId = customerHashId;

    return this.request<any>('POST', '/v1/client/{clientHashId}/quotes', payload);
  }

  /**
   * Add a beneficiary to a customer in Nium
   */
  async addBeneficiary(customerHashId: string, beneficiaryData: { name: string; accountNumber: string; bankName: string; ifscCode: string; address: string; city: string; postcode: string }) {
    const payload = {
      beneficiaryName: beneficiaryData.name,
      beneficiaryAccountType: 'Individual',
      beneficiaryCountryCode: 'IN',
      destinationCountry: 'IN',
      destinationCurrency: 'INR',
      payoutMethod: 'LOCAL',
      beneficiaryAccountNumber: beneficiaryData.accountNumber,
      routingCodeType1: 'IFSC',
      routingCodeValue1: beneficiaryData.ifscCode,
      beneficiaryAddress: beneficiaryData.address,
      beneficiaryCity: beneficiaryData.city,
      beneficiaryPostcode: beneficiaryData.postcode,
    };

    return this.request<any>('POST', '/v2/client/{clientHashId}/customer/{customerHashId}/beneficiaries', payload, { customerHashId });
  }

  /**
   * Create a remittance (Payout to beneficiary)
   */
  async initiateTransfer(customerHashId: string, walletHashId: string, beneficiaryHashId: string, _payoutHashId: string, amount: number, _currency: string) {
    const payload = {
      beneficiary: {
        id: beneficiaryHashId,
      },
      payout: {
        sourceAmount: amount,
        sourceCurrency: 'USD',
        destinationAmount: 0
      },
      customerComments: 'Remittance to India',
      purposeCode: 'IR002',
      sourceOfFunds: 'Salary',
      deviceDetails: {
        deviceInfo: 'Web-Browser',
        ipAddress: '127.0.0.1',
        countryIP: 'US',
        sessionId: `sess_${Date.now()}`
      }
    };

    return this.request<any>('POST', '/v1/client/{clientHashId}/customer/{customerHashId}/wallet/{walletHashId}/remittance', payload, { customerHashId, walletHashId });
  }

  /**
   * Transfer funds from Client Pool to Customer Wallet (Simulation/Funding)
   */
  async transferFromClientPool(customerHashId: string, walletHashId: string, amount: number) {
    const payload = {
      destinationAmount: amount,
      destinationCurrencyCode: 'USD',
      sourceCurrencyCode: 'USD',
      fundingChannel: 'prefund',
      deviceDetails: {
        deviceInfo: 'Web-Browser',
        ipAddress: '127.0.0.1',
        sessionId: `sess_${Date.now()}`
      }
    };

    console.log(`[Nium Funding V2] Transferring ${amount} USD to wallet ${walletHashId}`);
    return this.request<any>('POST', '/v2/client/{clientHashId}/customer/{customerHashId}/wallet/{walletHashId}/fund', payload, { customerHashId, walletHashId });
  }

  /**
   * Approve or Reject a wallet funding request
   */
  async approveFunds(customerHashId: string, walletHashId: string, systemReferenceNumber: string, decision: 'approve' | 'reject') {
    const payload = {
      decision,
      decisionReason: 'Manual approval for demo',
      transactionDetails: {
        date: new Date().toISOString().split('T')[0],
        description: 'Demo Funding Approval',
        purposes: [{ type: 'goods' }],
        senderName: 'Test Payer'
      }
    };

    return this.request<any>('PATCH', '/v2/client/{clientHashId}/customer/{customerHashId}/wallet/{walletHashId}/fund/{systemReferenceNumber}', payload, { 
      customerHashId, 
      walletHashId, 
      systemReferenceNumber 
    });
  }

  /**
   * Get Wallet Details for a customer
   */
  async getWalletDetails(customerHashId: string) {
    return this.request<any[]>('GET', '/v1/client/{clientHashId}/customer/{customerHashId}/wallet', undefined, { customerHashId });
  }
}
