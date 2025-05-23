import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditional Imports for RevenueCat Purchases SDK
let Purchases: any;
let CustomerInfoType: any; // To hold CustomerInfo type
let PurchasesErrorType: any;
let PurchasesPackageType: any;
let PurchasesOfferingType: any;
let LOG_LEVEL_TYPE: any;
let PURCHASE_TYPE_TYPE: any;
let PURCHASE_CANCELLED_ERROR_TYPE: any;

if (__DEV__) {
  const MockPurchases = require('@/utils/mockPurchases').default;
  Purchases = MockPurchases;
  CustomerInfoType = require('@/utils/mockPurchases').CustomerInfo; // Assuming mock exports it
  PurchasesErrorType = require('@/utils/mockPurchases').PurchasesError;
  PurchasesPackageType = require('@/utils/mockPurchases').PurchasesPackage;
  PurchasesOfferingType = require('@/utils/mockPurchases').PurchasesOffering;
  LOG_LEVEL_TYPE = require('@/utils/mockPurchases').LOG_LEVEL;
  PURCHASE_TYPE_TYPE = require('@/utils/mockPurchases').PURCHASE_TYPE;
  PURCHASE_CANCELLED_ERROR_TYPE = require('@/utils/mockPurchases').PURCHASE_CANCELLED_ERROR;
} else {
  const RNPurchases = require('react-native-purchases');
  Purchases = RNPurchases.default;
  CustomerInfoType = RNPurchases.CustomerInfo;
  PurchasesErrorType = RNPurchases.PurchasesError;
  PurchasesPackageType = RNPurchases.PurchasesPackage;
  PurchasesOfferingType = RNPurchases.PurchasesOffering;
  LOG_LEVEL_TYPE = RNPurchases.LOG_LEVEL;
  PURCHASE_TYPE_TYPE = RNPurchases.PURCHASE_TYPE;
  PURCHASE_CANCELLED_ERROR_TYPE = RNPurchases.PURCHASE_CANCELLED_ERROR_CODE; // Note: Real SDK uses PURCHASE_CANCELLED_ERROR_CODE
}

import { Platform } from 'react-native';
import { ApiClient } from '@/utils/apiClient';
import { useAuth } from './auth';
import { userStore } from './store'; // Import userStore

// RevenueCat API keys
const REVENUECAT_API_KEYS = {
  ios: 'appl_bppzyuedUPPlOMcnNVnaqDLFLGu', // Apple App Store API key
  android: 'YOUR_ANDROID_API_KEY', // Google Play API key - değiştirmeniz gerekecek
};

// Entitlement ID'leri
export const ENTITLEMENTS = {
  premium: 'premium', // Exactly matching the 'premium' entitlement ID from your dashboard
};

// Offerings ID'leri
export const OFFERINGS = {
  premium: 'default', // Exactly matching the 'default' offering ID from your dashboard
};

// Context tipleri
interface PurchaseContextType {
  isLoading: boolean;
  isPremium: boolean;
  currentOffering: typeof PurchasesOfferingType | null;
  customerInfo: typeof CustomerInfoType | null;
  packages: (typeof PurchasesPackageType)[];
  purchasePremium: (packageToPurchase: typeof PurchasesPackageType) => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  checkPremiumStatus: () => Promise<boolean>;
}

// Context oluşturma
const PurchaseContext = createContext<PurchaseContextType | null>(null);

// Hook
const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
};

// Provider component
const PurchaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [customerInfo, setCustomerInfo] = useState<typeof CustomerInfoType | null>(null);
  const [currentOffering, setCurrentOffering] = useState<typeof PurchasesOfferingType | null>(null);
  const [packages, setPackages] = useState<(typeof PurchasesPackageType)[]>([]);

  const { user } = useAuth();

  // RevenueCat'i başlat
  useEffect(() => {
    const initPurchases = async () => {
      try {
        // DEV MODU: Geliştirme aşamasında RevenueCat yerine "sahte" premium kullanıcı durumu kullanıyoruz
        if (__DEV__) {
          console.log('RevenueCat DEV MODE initialized');

          // Geliştirme amaçlı olarak sahte paketler oluştur
          // TypeScript uyumluluğu için any kullanarak mock veri oluşturuyoruz
          const mockPackages = [
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
          ] as unknown as (typeof PurchasesPackageType)[];

          setPackages(mockPackages);
          setIsPremium(false); // Geliştirme aşamasında premium değil olarak başla
          setCustomerInfo(null);
          setCurrentOffering({
            identifier: 'premium_offering',
            availablePackages: mockPackages,
            serverDescription: 'Premium Üyelik Paketi',
            metadata: {}
          } as unknown as typeof PurchasesOfferingType);
          setIsLoading(false); // Set loading to false after mock setup
        } else {
          // PRODUCTION MODE
          console.log('RevenueCat Production Mode Initializing...');
          const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
          if (!apiKey || apiKey.includes('YOUR_')) {
            console.error('RevenueCat API Key is not configured for production.');
            setIsLoading(false);
            return;
          }

          Purchases.setLogLevel(LOG_LEVEL_TYPE.DEBUG);
          await Purchases.configure({ apiKey });
          console.log('RevenueCat SDK configured for Production.');

          const initialCustomerInfo: typeof CustomerInfoType = await Purchases.getCustomerInfo();
          setCustomerInfo(initialCustomerInfo);
          const premiumStatus = initialCustomerInfo.entitlements.active[ENTITLEMENTS.premium] !== undefined;
          setIsPremium(premiumStatus);
          userStore.setIsSubscribed(premiumStatus); // Sync userStore
          console.log('Initial CustomerInfo (Prod):', initialCustomerInfo);
          console.log('Initial Premium Status (Prod):', premiumStatus);

          await fetchOfferings(); // Fetch offerings after configuration

          // Listener for customer info updates
          Purchases.addCustomerInfoUpdateListener((updatedCustomerInfo: typeof CustomerInfoType) => {
            console.log('CustomerInfo updated (Prod):', updatedCustomerInfo);
            setCustomerInfo(updatedCustomerInfo);
            const updatedPremiumStatus = updatedCustomerInfo.entitlements.active[ENTITLEMENTS.premium] !== undefined;
            setIsPremium(updatedPremiumStatus);
            userStore.setIsSubscribed(updatedPremiumStatus); // Sync userStore
            console.log('Updated Premium Status (Prod):', updatedPremiumStatus);
          });
          console.log('RevenueCat CustomerInfo listener added.');
        }
      } catch (error: any) {
        console.error('Error initializing Purchases (Prod):', error);
      } finally {
        setIsLoading(false); // Ensure loading is set to false in all paths
      }
    };

    if (user) { // Initialize only if user is authenticated, or adjust as needed
      initPurchases();
    }

    // Cleanup listener on unmount if needed, though Purchases SDK might handle it
    // return () => { Purchases.removeCustomerInfoUpdateListener(); }; // Be cautious with this

  }, [user]); // Rerun if user changes

  // Teklifleri getiren fonksiyon
  const fetchOfferings = async () => {
    setIsLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        setCurrentOffering(offerings.current as typeof PurchasesOfferingType);
        setPackages(offerings.current.availablePackages as (typeof PurchasesPackageType)[]);
        console.log('Fetched Offerings (Prod):', offerings.current);
      } else {
        console.log('No current offerings found (Prod).');
        setCurrentOffering(null);
        setPackages([]);
      }
    } catch (error: any) {
      console.error('Error fetching offerings (Prod):', error);
      setCurrentOffering(null);
      setPackages([]);
    } finally {
      // setIsLoading(false); // Loading state handled by initPurchases or purchasePremium
    }
  };

  // Premium durumu kontrol et
  const checkPremiumStatus = async (): Promise<boolean> => {
    // This function might not be strictly necessary if the listener keeps things in sync
    // but can be useful for manual checks or initial load if listener hasn't fired.
    if (__DEV__) {
      console.log("DEV_MODE: checkPremiumStatus called, returning current isPremium:", isPremium);
      return isPremium; // In dev, trust the current mock state
    }
    try {
      setIsLoading(true);
      const currentCustomerInfo: typeof CustomerInfoType = await Purchases.getCustomerInfo();
      setCustomerInfo(currentCustomerInfo);
      const premium = currentCustomerInfo.entitlements.active[ENTITLEMENTS.premium] !== undefined;
      setIsPremium(premium);
      userStore.setIsSubscribed(premium);
      return premium;
    } catch (error: any) {
      console.error('Error checking premium status (Prod):', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Premium satın alma
  const purchasePremium = async (packageToPurchase: typeof PurchasesPackageType) => {
    setIsLoading(true);
    try {
      if (__DEV__) {
        // DEV MODU: Satın alma işlemini simule et
        console.log('DEV MODE: Simulating purchasePremium');

        // 2 saniye gecikme ekleyelim ki satın alma işleminin gerçekleştiği görünsün
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Başarılı bir satın alma işlemi simule et
        setIsPremium(true);

        // Mock bir customerInfo objesi oluştur
        const mockCustomerInfo = {
          originalAppUserId: 'mock-user-id',
          entitlements: {
            active: {
              [ENTITLEMENTS.premium]: {
                identifier: ENTITLEMENTS.premium,
                isActive: true,
                willRenew: true,
                periodType: 'NORMAL',
                latestPurchaseDate: new Date().toISOString(),
                originalPurchaseDate: new Date().toISOString(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        } as unknown as typeof CustomerInfoType;

        setCustomerInfo(mockCustomerInfo);

        console.log(`DEV MODE: Purchase successful, premium status: ${true}`);

        // Backend'e bilgilendirme yapma - DEV modunda pas geçiyoruz
      } else {
        // PRODUCTION MODE
        const purchaseResult = await Purchases.purchasePackage(packageToPurchase) as { customerInfo: typeof CustomerInfoType, productIdentifier: string };
        setCustomerInfo(purchaseResult.customerInfo);
        const premiumStatus = purchaseResult.customerInfo.entitlements.active[ENTITLEMENTS.premium] !== undefined;
        setIsPremium(premiumStatus);
        userStore.setIsSubscribed(premiumStatus); // Sync userStore
        console.log('Purchase successful (Prod)! Product ID:', purchaseResult.productIdentifier);
        console.log('Updated CustomerInfo (Prod):', purchaseResult.customerInfo);
      }
    } catch (error: any) {
      if (error instanceof PurchasesErrorType && error.code === PURCHASE_CANCELLED_ERROR_TYPE) {
        console.log('User cancelled purchase (Prod).');
      } else {
        console.error('Error during purchase (Prod):', error);
        // Potentially revert UI changes or show an error message
      }
      // Do not assume purchase was successful, re-check status or throw
      throw error; // Re-throw to allow calling component to handle UI
    } finally {
      setIsLoading(false);
    }
  };

  // Satın alımları geri yükle
  const restorePurchases = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (__DEV__) {
        // DEV MODU: Geliştirme esnasında RestorePurchases'ı simule et
        console.log('DEV MODE: Simulating restorePurchases');

        // Kısa bir gecikme ekle
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Test amaçlı olarak premium yapma
        setIsPremium(true);

        // Mock bir customerInfo objesi oluştur
        const mockCustomerInfo = {
          originalAppUserId: 'mock-user-id',
          entitlements: {
            active: {
              [ENTITLEMENTS.premium]: {
                identifier: ENTITLEMENTS.premium,
                isActive: true,
                willRenew: true,
                periodType: 'NORMAL',
                latestPurchaseDate: new Date().toISOString(),
                originalPurchaseDate: new Date().toISOString(),
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        } as unknown as typeof CustomerInfoType;

        setCustomerInfo(mockCustomerInfo);

        console.log(`DEV MODE: Purchases restored, premium status: ${true}`);
        return true;
      } else {
        // PRODUCTION MODE
        const restoredCustomerInfo = await Purchases.restorePurchases() as typeof CustomerInfoType;
        setCustomerInfo(restoredCustomerInfo);
        const premiumStatus = restoredCustomerInfo.entitlements.active[ENTITLEMENTS.premium] !== undefined;
        setIsPremium(premiumStatus);
        userStore.setIsSubscribed(premiumStatus); // Sync userStore
        console.log('Purchases restored (Prod). New CustomerInfo:', restoredCustomerInfo);
        return premiumStatus;
      }
    } catch (error: any) {
      console.error('Error restoring purchases (Prod):', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Context değerleri
  const value = {
    isLoading,
    isPremium,
    customerInfo,
    currentOffering,
    packages,
    purchasePremium,
    restorePurchases,
    checkPremiumStatus,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
};

export { PurchaseProvider, usePurchase };
