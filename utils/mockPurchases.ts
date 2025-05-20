// Bu dosya, RevenueCat'in mock (sahte) bir implementasyonunu sağlar
// Gerçek implementasyon yerine bunu kullanarak native modül hatalarını önleriz

// Temel tipler
export interface CustomerInfo {
  originalAppUserId: string;
  entitlements: {
    active: {
      [key: string]: {
        identifier: string;
        isActive: boolean;
        willRenew: boolean;
        periodType: string;
        latestPurchaseDate: string;
        originalPurchaseDate: string;
        expirationDate: string;
      }
    }
  }
}

export interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    priceString: string;
    title: string;
    description: string;
    currencyCode: string;
  };
  offeringIdentifier: string;
  presentedOfferingContext: any;
}

export interface PurchasesOffering {
  identifier: string;
  availablePackages: PurchasesPackage[];
  serverDescription: string;
  metadata: any;
}

export enum LOG_LEVEL {
  VERBOSE,
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export enum PURCHASE_TYPE {
  INAPP,
  SUBS
}

// Sahte RevenueCat implementasyonu
export const PURCHASE_CANCELLED_ERROR = 'PURCHASE_CANCELLED';

export class PurchasesError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// Sahte Purchases sınıfı
class MockPurchases {
  static isPremium = false;
  static mockCustomerInfo: CustomerInfo = {
    originalAppUserId: 'mock-user-id',
    entitlements: {
      active: {}
    }
  };

  // RevenueCat API fonksiyonları
  configure({ apiKey }: { apiKey: string }) {
    console.log('MOCK: RevenueCat configured with api key:', apiKey);
    return Promise.resolve();
  }

  setLogLevel(level: LOG_LEVEL) {
    console.log('MOCK: RevenueCat log level set to:', level);
  }

  getOfferings() {
    console.log('MOCK: Getting offerings');
    
    const mockPackages: PurchasesPackage[] = [
      {
        identifier: 'weekly_premium',
        packageType: 'WEEKLY',
        product: {
          priceString: '$6.99',
          title: 'Premium Üyelik (Haftalık)',
          description: 'Haftalık Premium Üyelik',
          currencyCode: 'USD'
        },
        offeringIdentifier: 'premium_offering',
        presentedOfferingContext: {}
      },
      {
        identifier: 'annual_premium',
        packageType: 'ANNUAL',
        product: {
          priceString: '$69.99',
          title: 'Premium Üyelik (Yıllık)',
          description: 'Yıllık Premium Üyelik',
          currencyCode: 'USD'
        },
        offeringIdentifier: 'premium_offering',
        presentedOfferingContext: {}
      }
    ];
    
    const mockOffering: PurchasesOffering = {
      identifier: 'premium_offering',
      availablePackages: mockPackages,
      serverDescription: 'Premium Üyelik Paketi',
      metadata: {}
    };
    
    return Promise.resolve({
      current: mockOffering,
      all: {
        premium_offering: mockOffering
      }
    });
  }

  getCustomerInfo() {
    console.log('MOCK: Getting customer info');
    
    if (MockPurchases.isPremium) {
      MockPurchases.mockCustomerInfo.entitlements.active = {
        'premium_access': {
          identifier: 'premium_access',
          isActive: true,
          willRenew: true,
          periodType: 'NORMAL',
          latestPurchaseDate: new Date().toISOString(),
          originalPurchaseDate: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } else {
      MockPurchases.mockCustomerInfo.entitlements.active = {};
    }
    
    return Promise.resolve(MockPurchases.mockCustomerInfo);
  }

  purchasePackage(pkg: PurchasesPackage) {
    console.log('MOCK: Purchasing package:', pkg.identifier);
    
    // 2 saniye gecikme ekleyelim ki satın alma işleminin gerçekleştiği görünsün
    return new Promise((resolve) => {
      setTimeout(() => {
        MockPurchases.isPremium = true;
        
        // Customer info'yu güncelle
        MockPurchases.mockCustomerInfo.entitlements.active = {
          'premium_access': {
            identifier: 'premium_access',
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            latestPurchaseDate: new Date().toISOString(),
            originalPurchaseDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };
        
        resolve({
          customerInfo: MockPurchases.mockCustomerInfo,
          productIdentifier: pkg.identifier
        });
      }, 2000);
    });
  }

  restorePurchases() {
    console.log('MOCK: Restoring purchases');
    
    // Simulasyon için 1.5 saniye bekletiyoruz
    return new Promise((resolve) => {
      setTimeout(() => {
        MockPurchases.isPremium = true;
        
        // Customer info'yu güncelle
        MockPurchases.mockCustomerInfo.entitlements.active = {
          'premium_access': {
            identifier: 'premium_access',
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            latestPurchaseDate: new Date().toISOString(),
            originalPurchaseDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };
        
        resolve(MockPurchases.mockCustomerInfo);
      }, 1500);
    });
  }

  setAttributes(attributes: any) {
    console.log('MOCK: Setting attributes:', attributes);
    return Promise.resolve();
  }

  logIn(userId: string) {
    console.log('MOCK: User logged in:', userId);
    MockPurchases.mockCustomerInfo.originalAppUserId = userId;
    return Promise.resolve({ customerInfo: MockPurchases.mockCustomerInfo });
  }

  logOut() {
    console.log('MOCK: User logged out');
    MockPurchases.isPremium = false;
    MockPurchases.mockCustomerInfo.entitlements.active = {};
    return Promise.resolve();
  }
}

// Tek bir örnek oluşturup dışa aktarıyoruz
export default new MockPurchases();
