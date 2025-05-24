import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
  Text,
  RefreshControl,
  ActivityIndicator, // Added ActivityIndicator
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases, { 
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage, 
  LOG_LEVEL, 
  PurchasesStoreProduct, 
  SubscriptionOption, // Added import
} from 'react-native-purchases'; 
import { Alert, AppState } from 'react-native'; 

// components
import Header from "@/components/Header";
import Category from "@/components/Category";
import SwipeableFooter from "@/components/SwipeableFooter";
import InfoPage from "@/components/InfoPage";
import SwipeableCardsPage from "@/components/SwipeableCardsPage";
import SettingsPage from "@/components/SettingsPage";
import LimitedTimeOfferModal from "@/components/LimitedTimeOfferModal";
import SubscriptionPageWithFreeTrial from "@/components/SubscriptionPageWithFreeTrial";
import SubscriptionPageWithoutFreeTrial from "@/components/SubscriptionPageWithoutFreeTrial";

// constants
import { Colors } from "@/constants/Colors";
import { horizontalScale, verticalScale, moderateScale } from "@/constants/Metrics";

// context
import {
  categoriesStore,
  limitedTimeOfferStore,
  offeringsStore,
  contentTypeStore,
  userStore
} from "@/context/store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// utils
import { STORAGE } from "@/utils/storage";
import { API } from "@/utils/api";

// Constants
const REVENUECAT_API_KEY = 'appl_bppzyuedUPPlOMcnNVnaqDLFLGu';
const PREMIUM_ENTITLEMENT_ID = 'premium';

const { width } = Dimensions.get("screen");

function Main() {
  const router = useRouter();
  const scrollViewRef = useRef<any>(null);

  const [isRevenueCatConfigured, setIsRevenueCatConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [refreshing, setRefreshing] = useState(false);
  const [checker, setChecker] = useState(false);
  const [subscribed, setSubscribed] = useState(userStore.isSubscribed); 
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);
  const [paywallDismissedInitially, setPaywallDismissedInitially] = useState(false);
  // State to track which screen to show in the flow
  const [currentScreen, setCurrentScreen] = useState<'freeTrial' | 'purchase' | 'login'>('freeTrial');

  const [infoBottomSheetVisible, setInfoBottomSheetVisible] = useState<boolean>(false);
  const [settingsBottomSheetVisible, setSettingsBottomSheetVisible] = useState<boolean>(false);

  const [limitedTimeOfferModalVisible, setLimitedTimeOfferModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState<string>(
    Object.keys(categoriesStore.categories)[0]
  );

  const [cardsPageTitle, setCardsPageTitle] = useState<string>("");
  const [cardsPageVisible, setCardsPageVisible] = useState<boolean>(false);
  
  // Store the selected category data to pass to SwipeableCardsPage
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);

  const [categoryDone, setCategoryDone] = useState<any[]>([]);
  const [appWideProgress, setAppWideProgress] = useState<any[]>([]);
  const [shouldRefreshCategories, setShouldRefreshCategories] = useState(false);
  const [forceNavigateToContentType, setForceNavigateToContentType] = useState<string | undefined>(undefined);

  // Calculate app-wide progress for progress bar (across all content types)
  const getAppWideProgress = async () => {
    const contentTypes = ['hack', 'hack2', 'tip', 'tip2'];
    const completedCategories = [];
    
    // Predefined category names for each content type (in consistent order)
    const categoryNamesByType: Record<string, string[]> = {
      'hack': ['Dating Hacks', 'Money Hacks', 'Power Hacks', 'Survival Hacks', 'Trend Hacks'],
      'hack2': ['Business Hacks', 'Loophole Hacks', 'Mind Hacks', 'Tinder Hacks', 'Travel Hacks'],
      'tip': ['Dating & Relationships', 'Finance & Wealth Building', 'Fitness & Nutrition', 'Mindset & Motivation', 'Social Skills'],
      'tip2': ['Career & Leadership', 'Creative Thinking & Problem-Solving', 'Productivity & Time Management', 'Psychology & Influence', 'Wisdom & Learning']
    };

    // Check each content type's categories in order
    for (const contentType of contentTypes) {
      const categoryNames = categoryNamesByType[contentType];
      if (categoryNames) {
        for (const categoryName of categoryNames) {
          // Check ALL subcategories (0-4) - category is complete if ANY subcategory is completed
          const value = await STORAGE.getCategoryDone(categoryName, 0);
          completedCategories.push(value);
        }
      }
    }

    console.log(`DEBUG: App-wide progress check - ${completedCategories.filter(v => v === "true").length}/20 subcategories completed`);
    return completedCategories;
  };

  // Update category completion status for CURRENT content type only
  const updateCategoryDone = async () => {
    // Update completion status for CURRENT content type only (5 categories)
    const activeContentType = contentTypeStore.activeContentType;
    if (!activeContentType) return;
    
    const newCategoryDone = [];
    
    // Predefined category names for current content type
    const categoryNamesByType: Record<string, string[]> = {
      'hack': ['Dating Hacks', 'Money Hacks', 'Power Hacks', 'Survival Hacks', 'Trend Hacks'],
      'hack2': ['Business Hacks', 'Loophole Hacks', 'Mind Hacks', 'Tinder Hacks', 'Travel Hacks'],
      'tip': ['Dating & Relationships', 'Finance & Wealth Building', 'Fitness & Nutrition', 'Mindset & Motivation', 'Social Skills'],
      'tip2': ['Career & Leadership', 'Creative Thinking & Problem-Solving', 'Productivity & Time Management', 'Psychology & Influence', 'Wisdom & Learning']
    };

    const categoryNames = categoryNamesByType[activeContentType];
    if (!categoryNames) return;

    // Check each category in the current content type
    for (const categoryName of categoryNames) {
      try {
        // Check ALL subcategories (0-4) - category is complete if ANY subcategory is completed
        let isAnySubcategoryCompleted = false;
        for (let subcategoryIndex = 0; subcategoryIndex < 5; subcategoryIndex++) {
          const isCompleted = await STORAGE.getCategoryDone(categoryName, subcategoryIndex);
          if (isCompleted === "true") {
            isAnySubcategoryCompleted = true;
            break; // Found a completed subcategory, no need to check others
          }
        }
        newCategoryDone.push(isAnySubcategoryCompleted ? "true" : "false");
      } catch (error) {
        console.error(`Error checking completion for ${categoryName}:`, error);
        newCategoryDone.push("false");
      }
    }

    console.log(`DEBUG: updateCategoryDone for ${activeContentType}:`, newCategoryDone);
    setCategoryDone(newCategoryDone);
  };
  
  // Function to handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // --- Daily progress reset logic START ---
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastResetDate = await STORAGE.getLastDailyProgressResetDate();

      if (currentDate !== lastResetDate) {
        console.log(`DEBUG: onRefresh - New day (${currentDate}), last reset was (${lastResetDate}). Resetting daily subcategory progress.`);
        await STORAGE.resetAllSubCategoryProgress();
        await STORAGE.setLastDailyProgressResetDate(currentDate);
      } else {
        console.log(`DEBUG: onRefresh - Daily subcategory progress already reset for ${currentDate}.`);
      }
      // --- Daily progress reset logic END ---
      
      // Fetch latest content for current content type
      if (contentTypeStore.activeContentType) {
        console.log('Refreshing content for:', contentTypeStore.activeContentType);
        const categoriesData = await API.getCategoriesByContentType(contentTypeStore.activeContentType);
        categoriesStore.update(categoriesData);
      }
      
      // Update category completion status for current content type
      await updateCategoryDone();
      
      // Update app-wide progress for progress bar
      const appProgress = await getAppWideProgress();
      setAppWideProgress(appProgress);
    } catch (error) {
      console.error('Error refreshing content:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const updateProgress = async () => {
      await updateCategoryDone();
      const appProgress = await getAppWideProgress();
      setAppWideProgress(appProgress);
    };
    updateProgress();
  }, [activeTab]);
  
  // When returning from a cards page, refresh to see if any categories were completed
  useEffect(() => {
    if (!cardsPageVisible && selectedCategoryData) {
      console.log('Returning from cards page - refresh will be handled by close function');
      // Refresh is now handled in the close function itself, so this is just for logging
    }
  }, [cardsPageVisible]);
  
  // Calculate total completion for progress bar (always out of 20 subcategories)
  const getTotalCompletion = () => {
    const completedCount = appWideProgress.filter(value => value === "true").length;
    return { completedCount, totalCount: 20 };
  };
  

  // Effect to initialize RevenueCat and set up listener
  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (REVENUECAT_API_KEY && (REVENUECAT_API_KEY as string) !== 'YOUR_REVENUECAT_API_KEY_HERE') {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG); 
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        setIsRevenueCatConfigured(true);
        console.log("DEBUG: RevenueCat SDK configured.");

        // Define the listener function
        const customerInfoUpdateListener = async (customerInfo: CustomerInfo) => { 
          console.log("DEBUG: CustomerInfo updated via listener:", customerInfo.entitlements.active);
          updateSubscriptionStatus(customerInfo);
        };

        // Add listener for customer info updates
        Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

        // Initial fetch of customer info
        getCustomerInfo(); // Fetch when app starts and SDK is configured

        // Store the listener reference for cleanup
        return () => {
          Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener); // Pass listener here
        };

      } else {
        console.error("ERROR: RevenueCat API Key is a placeholder or incorrect. Please update it.");
        return () => {}; // Return an empty cleanup function if not configured
      }
    };

    let cleanupRevenueCat: (() => void) | undefined;
    initializeRevenueCat().then(cleanup => {
      cleanupRevenueCat = cleanup;
    });

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isRevenueCatConfigured) {
        console.log('DEBUG: App has come to the foreground, fetching customer info.');
        getCustomerInfo();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup listener on component unmount
    return () => {
      if (cleanupRevenueCat) {
        cleanupRevenueCat();
      }
      appStateSubscription.remove();
    };
  }, [isRevenueCatConfigured]); // Dependency array includes isRevenueCatConfigured

  // Initialize app-wide progress on app start
  useEffect(() => {
    const initializeProgress = async () => {
      const appProgress = await getAppWideProgress();
      setAppWideProgress(appProgress);
    };
    initializeProgress();
  }, []);

  // Function to update subscription status based on RevenueCat CustomerInfo
  const updateSubscriptionStatus = (customerInfo: CustomerInfo) => { 
    // Normal flow for production - removed dev mode override logic
    const isActive = typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== "undefined";
    userStore.setIsSubscribed(isActive); 
    setSubscribed(isActive); 
    
    console.log(`DEBUG: updateSubscriptionStatus - User is ${isActive ? 'SUBSCRIBED' : 'NOT SUBSCRIBED'} to ${PREMIUM_ENTITLEMENT_ID}`);
    // TODO: Potentially update freeTrialAvailable state based on offerings and entitlements
  };


  const getCustomerInfo = async () => {
    // Removed dev mode override logic for production
    if (!isRevenueCatConfigured) {
      console.log("DEBUG: RevenueCat not configured yet, skipping getCustomerInfo.");
      return;
    }
    setIsLoading(true);
    try {
      console.log("DEBUG: Fetching CustomerInfo from RevenueCat...");
      const customerInfo = await Purchases.getCustomerInfo();
      console.log("DEBUG: Fetched CustomerInfo from RevenueCat:", customerInfo.entitlements.active);
      updateSubscriptionStatus(customerInfo);

      console.log("DEBUG: Fetching offerings from RevenueCat...");
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
        offeringsStore.update(offerings); 
        console.log("DEBUG: Offerings fetched and updated in store:", offerings.current);
        
        const currentOffering = offerings.current;
        const productIdentifiersForEligibilityCheck = currentOffering.availablePackages.map(p => p.product.identifier);
        const isEligibleForIntro = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIdentifiersForEligibilityCheck);
        
        let trialIsActuallyAvailable = false;
        for (const pkg of currentOffering.availablePackages) {
            // Check if the product has a free trial or introductory offer AND if the user is eligible for it.
            const product = pkg.product;
            const isEligible = isEligibleForIntro[product.identifier]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
            
            if (isEligible && product.subscriptionOptions?.some((opt: SubscriptionOption) => opt.freePhase !== null || opt.introPhase !== null)) {
                trialIsActuallyAvailable = true;
                break;
            }
        }
        setFreeTrialAvailable(trialIsActuallyAvailable && !userStore.isSubscribed);
        console.log(`DEBUG: Free trial available: ${trialIsActuallyAvailable && !userStore.isSubscribed} (Eligibility Checked for ${productIdentifiersForEligibilityCheck.join(', ')}, User subscribed: ${userStore.isSubscribed})`);

      } else {
        console.log("DEBUG: No current offerings found from RevenueCat or no packages in current offering.");
        offeringsStore.update({current: null, all: {}}); 
        setFreeTrialAvailable(false);
      }
    } catch (error) {
      console.error("ERROR: Failed to get CustomerInfo or Offerings from RevenueCat:", error);
      userStore.setIsSubscribed(false);
      setSubscribed(false);
      setFreeTrialAvailable(false);
    } finally {
      setIsLoading(false); 
    }
  };

  // Fetch customer info when RevenueCat is configured
   useEffect(() => {
    if (isRevenueCatConfigured) {
      getCustomerInfo(); // Fetch when app starts and SDK is configured
    }
  }, [isRevenueCatConfigured]);

  const showLimitedTimeOffer = async () => {
    // Check if the limited time offer can be shown based on frequency limits
    const canShow = await STORAGE.canShowLimitedTimeOffer();
    
    if (canShow) {
      // Mark that the offer is being shown now
      await STORAGE.setLimitedTimeOfferLastShown();
      setLimitedTimeOfferModalVisible(true);
    } else {
      console.log('Limited time offer cannot be shown yet due to frequency limits');
    }
  };

  // Effect to handle daily reset and update progress when activeContentType changes
  useEffect(() => {
    const handleActiveContentTypeChange = async () => {
      if (contentTypeStore.activeContentType) {
        // --- Daily progress reset logic START ---
        const currentDate = new Date().toISOString().split('T')[0];
        const lastResetDate = await STORAGE.getLastDailyProgressResetDate();

        if (currentDate !== lastResetDate) {
          console.log(`DEBUG: Main Effect (activeContentType change) - New day (${currentDate}), last reset was (${lastResetDate}). Resetting daily subcategory progress.`);
          await STORAGE.resetAllSubCategoryProgress();
          await STORAGE.setLastDailyProgressResetDate(currentDate);
        } else {
          console.log(`DEBUG: Main Effect (activeContentType change) - Daily subcategory progress already reset for ${currentDate}.`);
        }
        // --- Daily progress reset logic END ---
        
        console.log('DEBUG: Active content type changed to:', contentTypeStore.activeContentType);
        
        // Add small delay to ensure SwipeableFooter has updated categoriesStore
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update category completion for current content type
        // (SwipeableFooter already handles fetching and updating categoriesStore)
        await updateCategoryDone();
        
        // Update app-wide progress
        const appProgress = await getAppWideProgress();
        setAppWideProgress(appProgress);
      } else {
        // No active content type, clear everything
        console.log("DEBUG: No active content type, clearing categories from store.");
        categoriesStore.update({});
        await updateCategoryDone();
        const appProgress = await getAppWideProgress();
        setAppWideProgress(appProgress);
      }
    };

    handleActiveContentTypeChange();
  }, [contentTypeStore.activeContentType]);

  const makePurchase = async (packageToPurchase: PurchasesPackage | null | undefined, fromScreen?: string) => {
    if (!packageToPurchase) {
      Alert.alert('Error', 'No package selected for purchase.');
      return;
    }
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('DEBUG: Purchase successful', customerInfo.entitlements.active);
      updateSubscriptionStatus(customerInfo); // This will set userStore.isSubscribed

      // Determine subscription type from the purchased package
      let purchasedSubscriptionType = 'unknown';
      if (packageToPurchase.packageType === 'ANNUAL' || packageToPurchase.identifier.toLowerCase().includes('annual')) {
        purchasedSubscriptionType = 'annual';
      } else if (packageToPurchase.packageType === 'MONTHLY' || packageToPurchase.identifier.toLowerCase().includes('weekly')) { // Assuming weekly is handled as a custom monthly type or by identifier
        purchasedSubscriptionType = 'weekly';
      } else if (packageToPurchase.packageType === 'LIFETIME') {
        purchasedSubscriptionType = 'lifetime';
      } // Add more conditions if you have other package types like 'free_trial' as a package
      
      await STORAGE.setSubscriptionType(purchasedSubscriptionType);
      userStore.setSubscriptionType(purchasedSubscriptionType); // Also update in MobX store

      // Handle navigation after successful purchase
      if (fromScreen === 'freeTrial' || currentScreen === 'freeTrial') {
        // After free trial purchase, navigate to login
        console.log("DEBUG: Purchase from free trial successful, navigating to login");
        router.replace('/login');
      } else {
        // For limited time offer and other purchases, close modals and stay in main content
        console.log("DEBUG: Purchase from", fromScreen || "other screen", "successful, staying in main content");
        setLimitedTimeOfferModalVisible(false);
        setInfoBottomSheetVisible(false);
        setSettingsBottomSheetVisible(false);
        // Refresh content to update subscription status
        await onRefresh();
      }

    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('DEBUG: Purchase error', e);
        Alert.alert('Purchase Error', e.message);
      } else {
        console.log('DEBUG: Purchase cancelled by user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseFreeTrial = async () => {
    // Find a package that offers a trial. This logic assumes the 'current' offering
    // has a package eligible for a trial (often the weekly or a specific trial package).
    // You might need more specific logic if you have multiple offerings or complex trial conditions.
    const currentOffering = offeringsStore.offerings?.current;
    if (!currentOffering) {
      Alert.alert("Error", "No subscription offers currently available.");
      return;
    }

    let trialPackage: PurchasesPackage | undefined = undefined;

    // Option 1: If you have a package specifically named e.g., 'trial_package_identifier'
    // trialPackage = currentOffering.availablePackages.find(p => p.identifier === 'your_trial_package_id');

    // Option 2: Find any package that has an introductory discount and the user is eligible
    if (!trialPackage) {
      for (const pkg of currentOffering.availablePackages) {
        if (pkg.product.subscriptionOptions?.some((opt: SubscriptionOption) => opt.freePhase !== null || opt.introPhase !== null)) {
          const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([pkg.product.identifier]);
          if (eligibility[pkg.product.identifier]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE) {
            trialPackage = pkg;
            console.log(`DEBUG: Found trial eligible package: ${pkg.identifier}`);
            break;
          }
        }
      }
    }
    
    // Fallback: often the weekly package might be the one with the trial if no specific one is found
    if (!trialPackage) {
        trialPackage = currentOffering.weekly || currentOffering.availablePackages.find((p: PurchasesPackage) => 
            p.packageType === Purchases.PACKAGE_TYPE.WEEKLY && 
            p.product.subscriptionOptions?.some((opt: SubscriptionOption) => opt.freePhase !== null || opt.introPhase !== null)
        );
        if (trialPackage) console.log(`DEBUG: Using weekly package as potential trial package: ${trialPackage.identifier}`);
    }

    if (trialPackage) {
      await makePurchase(trialPackage, 'freeTrial');
    } else {
      Alert.alert("No Trial Available", "Currently, no free trial option is available or you might not be eligible.");
      console.warn("WARN: Could not find a suitable package for free trial.");
    }
  };

  const purchaseWeekly = async () => {
    const weeklyPackage = offeringsStore.offerings?.current?.weekly || 
                          offeringsStore.offerings?.current?.availablePackages.find((p: PurchasesPackage) => p.packageType === Purchases.PACKAGE_TYPE.WEEKLY);
    await makePurchase(weeklyPackage, 'main');
  };

  const purchaseAnnual = async () => {
    const annualPackage = offeringsStore.offerings?.current?.annual || 
                          offeringsStore.offerings?.current?.availablePackages.find((p: PurchasesPackage) => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
    await makePurchase(annualPackage, 'main');
  };

  const purchaseSaleAnnual = async () => {
    // Use the "sale" offering for the limited time offer
    const saleAnnualPackage = offeringsStore.offerings?.all?.sale?.annual ||
                              offeringsStore.offerings?.all?.sale?.availablePackages?.find((p: PurchasesPackage) => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
    
    if (!saleAnnualPackage) {
      console.error('Sale annual package not found, falling back to regular annual package');
      await makePurchase(offeringsStore.offerings?.current?.annual, 'limitedTimeOffer');
      return;
    }
    
    console.log('DEBUG: Purchasing sale annual package:', saleAnnualPackage.identifier);
    await makePurchase(saleAnnualPackage, 'limitedTimeOffer');
  };

  // New function for weekly purchase from limited time offer
  const purchaseWeeklyFromOffer = async () => {
    const weeklyPackage = offeringsStore.offerings?.current?.weekly || 
                          offeringsStore.offerings?.current?.availablePackages.find((p: PurchasesPackage) => p.packageType === Purchases.PACKAGE_TYPE.WEEKLY);
    await makePurchase(weeklyPackage, 'limitedTimeOffer');
  };

  const restorePurchases = async () => {
    if (!isRevenueCatConfigured) {
      Alert.alert("Error", "Purchases system is not ready. Please try again in a moment.");
      return;
    }
    setIsLoading(true); 
    try {
      const restoreInfo = await Purchases.restorePurchases();
      console.log("DEBUG: Purchases restored successfully:", restoreInfo.entitlements.active);
      updateSubscriptionStatus(restoreInfo);
      if (restoreInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]) {
        Alert.alert("Success", "Your previous purchases have been restored.");
        
        // Handle navigation after successful restore - only from free trial page
        if (currentScreen === 'freeTrial') {
          // After restore from free trial screen, navigate to login
          console.log("DEBUG: Restore from free trial successful, navigating to login");
          router.replace('/login');
        } else {
          // For other screens, close modals and stay in main content
          console.log("DEBUG: Restore from other screen successful, staying in main content");
          setLimitedTimeOfferModalVisible(false);
          setInfoBottomSheetVisible(false);
          setSettingsBottomSheetVisible(false);
          await onRefresh();
        }
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases to restore.");
      }
    } catch (e: any) {
      console.error("ERROR: Failed to restore purchases:", e);
      Alert.alert("Error", e.message || "Failed to restore purchases. Please try again later.");
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    setChecker(!checker);
  }, [offeringsStore.offerings, subscribed, freeTrialAvailable]);

  const handleClosePaywall = () => {
    setPaywallDismissedInitially(true);
    // Decide where to navigate the user. If they haven't seen cards yet, show them. 
    // Otherwise, they might be closing a paywall shown later, so we might not want to force navigation.
    if (!cardsPageVisible) {
        setCardsPageVisible(true); // Or navigate to a default screen
    }
  };

  // Helper functions to calculate proper prices
  const calculateWeeklyPrice = (annualPrice: string): string => {
    try {
      // Remove currency symbol and parse
      const price = parseFloat(annualPrice.replace(/[^0-9.]/g, ''));
      const weeklyPrice = price / 52;
      return `$${weeklyPrice.toFixed(2)}`;
    } catch (error) {
      console.error('Error calculating weekly price:', error);
      return annualPrice;
    }
  };

  const calculateYearlyPrice = (weeklyPrice: string): string => {
    try {
      // Remove currency symbol and parse
      const price = parseFloat(weeklyPrice.replace(/[^0-9.]/g, ''));
      const yearlyPrice = price * 52;
      return `$${yearlyPrice.toFixed(2)}`;
    } catch (error) {
      console.error('Error calculating yearly price:', error);
      return weeklyPrice;
    }
  };

  const getProperPrices = () => {
    const weeklyProduct = offeringsStore.offerings?.current?.weekly?.product;
    const annualProduct = offeringsStore.offerings?.current?.annual?.product;
    const saleAnnualProduct = offeringsStore.offerings?.all?.sale?.annual?.product;

    return {
      weekly: {
        perWeek: weeklyProduct?.priceString || "$6.99",
        perYear: calculateYearlyPrice(weeklyProduct?.priceString || "$6.99")
      },
      annual: {
        perWeek: calculateWeeklyPrice(annualProduct?.priceString || "$149.99"),
        perYear: annualProduct?.priceString || "$149.99"
      },
      saleAnnual: {
        perWeek: calculateWeeklyPrice(saleAnnualProduct?.priceString || "$99.99"),
        perYear: saleAnnualProduct?.priceString || "$99.99"
      }
    };
  };

  // Show loading indicator during purchase or info fetch
  if (isLoading) { 
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Implement the correct flow: Free trial screen → Purchase screen → Login (if bought/started trial)
  if (!subscribed) {
    const prices = getProperPrices();
    
    if (currentScreen === 'freeTrial') {
      // Step 1: Free trial screen
      return (
        <GestureHandlerRootView>
          <View style={{flex: 1}}>
            <SubscriptionPageWithFreeTrial
              purchase={purchaseFreeTrial}
              pricePerWeek={prices.weekly.perWeek}
              restorePurchases={restorePurchases}
            />
          </View>
        </GestureHandlerRootView>
      );
    } else if (currentScreen === 'purchase') {
      // Step 2: Regular purchase screen (without free trial)
      return (
        <GestureHandlerRootView>
          <View style={{flex: 1}}>
            <SubscriptionPageWithoutFreeTrial
              weeklyPricePerWeek={prices.weekly.perWeek}
              weeklyPricePerYear={prices.weekly.perYear}
              annualPricePerWeek={prices.annual.perWeek}
              annualPricePerYear={prices.annual.perYear}
              purchaseWeekly={purchaseWeekly} 
              purchaseAnnual={purchaseAnnual}
              restorePurchases={restorePurchases}
            />
          </View>
        </GestureHandlerRootView>
      );
    }
  }
  
  // Step 3: Main content for subscribed users (after login/purchase)
  const showMainContent = subscribed;

  if (showMainContent) {
    const prices = getProperPrices();
    
    if (cardsPageVisible && selectedCategoryData) {
      return (
        <GestureHandlerRootView style={{flex:1}}> 
          <SwipeableCardsPage
            checkCategoryDone={async () => {
              await updateCategoryDone();
              const appProgress = await getAppWideProgress();
              setAppWideProgress(appProgress);
            }}
            category={selectedCategoryData.categoryName || activeTab}
            title={selectedCategoryData.id || cardsPageTitle}
            cardsPageVisible={cardsPageVisible}
            close={() => {
              const currentContentType = contentTypeStore.activeContentType; // Store current content type
              setCardsPageVisible(false);
              setSelectedCategoryData(null);
              
              // Force navigation back to the content type we were viewing with full refresh
              if (currentContentType) {
                const performFullRefresh = async () => {
                  // Trigger category refresh
                  setShouldRefreshCategories(true);
                  setForceNavigateToContentType(currentContentType);
                  
                  // Also trigger the same progress updates as onRefresh
                  await updateCategoryDone();
                  const appProgress = await getAppWideProgress();
                  setAppWideProgress(appProgress);
                  
                  // Reset flags after processing
                  setTimeout(() => {
                    setShouldRefreshCategories(false);
                    setForceNavigateToContentType(undefined);
                  }, 500);
                };
                
                performFullRefresh();
              }
              
              console.log("DEBUG: Closed SwipeableCardsPage, forcing navigation with full refresh to:", currentContentType);
            }}
            contentType={contentTypeStore.activeContentType}
          />
        </GestureHandlerRootView>
      );
    }

    return (
      <GestureHandlerRootView style={styles.container}>
        <Header
          categoryDone={appWideProgress}
          onPressInfo={() => {
            if (settingsBottomSheetVisible === false) {
              setInfoBottomSheetVisible(true);
            }
          }}
          onPressSettings={() => {
            if (infoBottomSheetVisible === false) {
              setSettingsBottomSheetVisible(true);
            }
          }}
        />
        
        {/* Main content with swipeable footer */}
        <SwipeableFooter
          categoryDone={categoryDone}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setCardsPageVisible={setCardsPageVisible}
          setCardsPageTitle={setCardsPageTitle}
          setSelectedCategoryData={setSelectedCategoryData}
          setInfoBottomSheetVisible={setInfoBottomSheetVisible}
          setSettingsBottomSheetVisible={setSettingsBottomSheetVisible}
          refreshing={refreshing}
          onRefresh={onRefresh}
          shouldRefreshCategories={shouldRefreshCategories}
          forceNavigateToContentType={forceNavigateToContentType}
        />

        {infoBottomSheetVisible && (
          <InfoPage
            closeBottomSheet={() => setInfoBottomSheetVisible(false)}
            triggerLimitedTimeOffer={showLimitedTimeOffer}
            purchaseRegularAnnual={purchaseAnnual}
            purchaseWeekly={purchaseWeekly}
            regularAnnualPrice={prices.annual.perYear}
            weeklyPrice={prices.weekly.perWeek}
          />
        )}

        {settingsBottomSheetVisible && (
          <SettingsPage
            closeBottomSheet={() => setSettingsBottomSheetVisible(false)}
            triggerLimitedTimeOffer={showLimitedTimeOffer}
            purchaseRegularAnnual={purchaseAnnual}
            purchaseWeekly={purchaseWeekly}
            regularAnnualPrice={prices.annual.perYear}
            weeklyPrice={prices.weekly.perWeek}
          />
        )}

        {limitedTimeOfferModalVisible && (
          <LimitedTimeOfferModal
            weeklyPricePerWeek={prices.weekly.perWeek}
            weeklyPricePerYear={prices.weekly.perYear}
            annualPricePerWeek={prices.saleAnnual.perWeek}
            annualPricePerYear={prices.saleAnnual.perYear}
            limitedTimeOfferModalVisible={limitedTimeOfferModalVisible}
            close={async () => setLimitedTimeOfferModalVisible(false)}
            purchaseAnnual={purchaseSaleAnnual}
            purchaseWeekly={purchaseWeeklyFromOffer}
          />
        )}
      </GestureHandlerRootView>
    );
  }
}

// Expo Router 2.x için doğru export formatı
const ObservedMain = observer(Main);
export default function Index() {
  return <ObservedMain />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: Colors.black,
  },

  contentContainer: { 
    backgroundColor: Colors.black,
    flex: 1,
  },

  pageContainer: {
    padding: horizontalScale(20),
    paddingVertical: verticalScale(20),
  },

  categoryTitle: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(22),
    marginBottom: verticalScale(15),
    marginTop: verticalScale(5),
  },

  allCategoriesContainer: {
    padding: horizontalScale(20),
    paddingBottom: verticalScale(30),
  },

  categorySection: {
    marginBottom: verticalScale(20),
    paddingTop: verticalScale(5),
    paddingBottom: verticalScale(5),
  },
});
