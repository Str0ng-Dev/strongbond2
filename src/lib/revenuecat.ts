// RevenueCat integration utilities
// This is a mock implementation - replace with actual RevenueCat SDK integration

export interface EntitlementInfo {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'NORMAL' | 'INTRO' | 'TRIAL';
  latestPurchaseDate: string;
  originalPurchaseDate: string;
  expirationDate: string | null;
  store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE';
  productIdentifier: string;
  isSandbox: boolean;
}

export interface CustomerInfo {
  originalAppUserId: string;
  allPurchaseDates: Record<string, string>;
  entitlements: {
    active: Record<string, EntitlementInfo>;
    all: Record<string, EntitlementInfo>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  nonSubscriptionTransactions: any[];
  firstSeen: string;
  originalApplicationVersion: string | null;
  requestDate: string;
}

class RevenueCatService {
  private isConfigured = false;
  private mockCustomerInfo: CustomerInfo | null = null;

  // Initialize RevenueCat (mock implementation)
  async configure(apiKey: string): Promise<void> {
    console.log('Configuring RevenueCat with API key:', apiKey);
    this.isConfigured = true;
    
    // Mock customer info for development
    this.mockCustomerInfo = {
      originalAppUserId: 'user_123',
      allPurchaseDates: {},
      entitlements: {
        active: {},
        all: {}
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      nonSubscriptionTransactions: [],
      firstSeen: new Date().toISOString(),
      originalApplicationVersion: '1.0.0',
      requestDate: new Date().toISOString()
    };
  }

  // Set user ID
  async setUserId(userId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured');
    }
    
    console.log('Setting RevenueCat user ID:', userId);
    
    if (this.mockCustomerInfo) {
      this.mockCustomerInfo.originalAppUserId = userId;
    }
  }

  // Get customer info
  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured');
    }

    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      return this.mockCustomerInfo || this.createMockCustomerInfo();
    }

    // In production, this would call the actual RevenueCat SDK
    throw new Error('RevenueCat SDK not implemented for production');
  }

  // Check if user has active entitlement
  async hasActiveEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[entitlementId];
      return entitlement?.isActive || false;
    } catch (error) {
      console.error('Error checking entitlement:', error);
      return false;
    }
  }

  // Mock method to simulate subscription purchase
  async mockPurchaseSubscription(productId: string): Promise<CustomerInfo> {
    if (!this.mockCustomerInfo) {
      this.mockCustomerInfo = this.createMockCustomerInfo();
    }

    // Simulate successful purchase
    const now = new Date().toISOString();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    const entitlement: EntitlementInfo = {
      identifier: 'pro_user',
      isActive: true,
      willRenew: true,
      periodType: 'NORMAL',
      latestPurchaseDate: now,
      originalPurchaseDate: now,
      expirationDate: expirationDate.toISOString(),
      store: 'STRIPE',
      productIdentifier: productId,
      isSandbox: true
    };

    this.mockCustomerInfo.entitlements.active['pro_user'] = entitlement;
    this.mockCustomerInfo.entitlements.all['pro_user'] = entitlement;
    this.mockCustomerInfo.activeSubscriptions.push(productId);
    this.mockCustomerInfo.allPurchasedProductIdentifiers.push(productId);

    return this.mockCustomerInfo;
  }

  private createMockCustomerInfo(): CustomerInfo {
    return {
      originalAppUserId: 'user_123',
      allPurchaseDates: {},
      entitlements: {
        active: {},
        all: {}
      },
      activeSubscriptions: [],
      allPurchasedProductIdentifiers: [],
      nonSubscriptionTransactions: [],
      firstSeen: new Date().toISOString(),
      originalApplicationVersion: '1.0.0',
      requestDate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const revenueCat = new RevenueCatService();

// Initialize RevenueCat on app start
export const initializeRevenueCat = async () => {
  try {
    // Replace with your actual RevenueCat API key
    const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY || 'mock_api_key';
    await revenueCat.configure(apiKey);
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
};