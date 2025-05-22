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
import ProgressBar from "@/components/ProgressBar";
import Footer from "@/components/Footer";
import Category from "@/components/Category";
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

  const updateCategoryDone = async () => {
    const newCategoryDone = [];

    for (let category of Object.keys(categoriesStore.categories)) {
      for (let i = 0; i < 5; i++) {
        const value = await STORAGE.getCategoryDone(category, i);

        newCategoryDone.push(value);
      }
    }

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
      
      // Update category completion status
      await updateCategoryDone();
    } catch (error) {
      console.error('Error refreshing content:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    updateCategoryDone();
  }, [activeTab]);
  
  // When returning from a cards page, refresh to see if any categories were completed
  useEffect(() => {
    if (!cardsPageVisible && selectedCategoryData) {
      console.log('Returning from cards page, checking for completed categories');
      updateCategoryDone();
    }
  }, [cardsPageVisible]);
  
  // Calculate total completion for progress bar (always out of 20 subcategories)
  const getTotalCompletion = () => {
    const completedCount = categoryDone.filter(value => value === "true").length;
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

  // Function to update subscription status based on RevenueCat CustomerInfo
  const updateSubscriptionStatus = (customerInfo: CustomerInfo) => { 
    // Check for developer mode override first
    if (userStore.devModeOverride) {
      // If developer mode is active, keep subscription status as true
      setSubscribed(true);
      console.log(`DEBUG: updateSubscriptionStatus - Developer mode active, keeping subscription status as true`);
      return;
    }
    
    // Normal flow for non-developer mode
    const isActive = typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== "undefined";
    userStore.setIsSubscribed(isActive); 
    setSubscribed(isActive); 
    
    console.log(`DEBUG: updateSubscriptionStatus - User is ${isActive ? 'SUBSCRIBED' : 'NOT SUBSCRIBED'} to ${PREMIUM_ENTITLEMENT_ID}`);
    // TODO: Potentially update freeTrialAvailable state based on offerings and entitlements
  };


  const getCustomerInfo = async () => {
    // Check for developer mode override first
    if (userStore.devModeOverride) {
      console.log("DEV: Developer mode active - bypassing subscription checks");
      setSubscribed(true);
      setIsLoading(false);
      return;
    }
    
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

  const showLimitedTimeOffer = () => {
    setLimitedTimeOfferModalVisible(true);
  };

  useEffect(() => {
    const loadDataForActiveContentType = async () => {
      if (contentTypeStore.activeContentType) {
        // setLoadingCategories(true); 

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
        
        console.log('Fetching categories for new activeContentType:', contentTypeStore.activeContentType);
        try {
          const categoriesData = await API.getCategoriesByContentType(contentTypeStore.activeContentType);
          categoriesStore.update(categoriesData);
          await updateCategoryDone(); 
        } catch (error) {
          console.error('Error fetching categories for activeContentType:', error);
          // categoriesStore.update({}); 
        }
        // setLoadingCategories(false);
      } else {
        // No active content type, ensure categories are cleared if necessary
        if (Object.keys(categoriesStore.categories).length > 0) {
          console.log("DEBUG: No active content type, clearing categories from store.");
          categoriesStore.update({});
          await updateCategoryDone(); 
        }
      }
    };

    loadDataForActiveContentType();
  }, [contentTypeStore.activeContentType]); 

  const makePurchase = async (packageToPurchase: PurchasesPackage | null | undefined) => {
    if (!packageToPurchase) {
      Alert.alert("Error", "Selected subscription package is not available. Please try again later.");
      console.error("ERROR: Attempted to purchase a null/undefined package.");
      return;
    }
    if (!isRevenueCatConfigured) {
      Alert.alert("Error", "Purchases system is not ready. Please try again in a moment.");
      return;
    }
    setIsLoading(true);
    try {
      console.log(`DEBUG: Attempting to purchase package: ${packageToPurchase.identifier}`);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log("DEBUG: Purchase successful for package:", packageToPurchase.identifier, "CustomerInfo:", customerInfo.entitlements.active);
      updateSubscriptionStatus(customerInfo); // Update UI immediately
      Alert.alert("Success", "Your subscription is now active!");
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error(`ERROR: Purchase failed for package ${packageToPurchase.identifier}:`, e);
        Alert.alert("Purchase Error", e.message || "An error occurred during the purchase. Please try again.");
      } else {
        console.log("DEBUG: User cancelled the purchase flow.");
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
      await makePurchase(trialPackage);
    } else {
      Alert.alert("No Trial Available", "Currently, no free trial option is available or you might not be eligible.");
      console.warn("WARN: Could not find a suitable package for free trial.");
    }
  };

  const purchaseWeekly = async () => {
    const weeklyPackage = offeringsStore.offerings?.current?.weekly || 
                          offeringsStore.offerings?.current?.availablePackages.find((p: PurchasesPackage) => p.packageType === Purchases.PACKAGE_TYPE.WEEKLY);
    await makePurchase(weeklyPackage);
  };

  const purchaseAnnual = async () => {
    const annualPackage = offeringsStore.offerings?.current?.annual || 
                          offeringsStore.offerings?.current?.availablePackages.find((p: PurchasesPackage) => p.packageType === Purchases.PACKAGE_TYPE.ANNUAL);
    await makePurchase(annualPackage);
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

  // When returning from a cards page, refresh to see if any categories were completed
  useEffect(() => {
    if (!cardsPageVisible && selectedCategoryData) {
      console.log('Returning from cards page, checking for completed categories');
      updateCategoryDone();
    }
  }, [cardsPageVisible]);

  // Effect to fetch data when activeContentType changes and handle daily reset
  useEffect(() => {
    const fetchDataForActiveContentType = async () => {
      if (contentTypeStore.activeContentType) {
        // setLoadingCategories(true); 

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
        
        console.log('Fetching categories for new activeContentType:', contentTypeStore.activeContentType);
        try {
          const categoriesData = await API.getCategoriesByContentType(contentTypeStore.activeContentType);
          categoriesStore.update(categoriesData);
          await updateCategoryDone(); 
        } catch (error) {
          console.error('Error fetching categories for activeContentType:', error);
          // categoriesStore.update({}); 
        }
        // setLoadingCategories(false);
      } else {
        // No active content type, ensure categories are cleared if necessary
        if (Object.keys(categoriesStore.categories).length > 0) {
          console.log("DEBUG: No active content type, clearing categories from store.");
          categoriesStore.update({});
          await updateCategoryDone(); 
        }
      }
    };

    fetchDataForActiveContentType();
  }, [contentTypeStore.activeContentType]); 

  const handleClosePaywall = () => {
    setPaywallDismissedInitially(true);
    // Decide where to navigate the user. If they haven't seen cards yet, show them. 
    // Otherwise, they might be closing a paywall shown later, so we might not want to force navigation.
    if (!cardsPageVisible) {
        setCardsPageVisible(true); // Or navigate to a default screen
    }
  };

  // Show loading indicator during purchase or info fetch
  if (isLoading) { 
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Dev function to skip to login
  const skipToLogin = async () => {
    console.log('DEV: Activating developer mode to skip to login');
    
    // For development only - skip to login even if not subscribed
    setPaywallDismissedInitially(true);
    setSubscribed(true); // Pretend the user is subscribed to bypass subscription checks
    
    // Persist the subscription status in AsyncStorage
    try {
      // Set the dev mode flag in AsyncStorage
      await AsyncStorage.setItem('DEV_SKIP_TO_LOGIN', 'true');
      console.log('DEV: Saved subscription bypass flag to AsyncStorage');
      
      // Use the proper MobX action to update the userStore
      userStore.setDevModeOverride(true);
      console.log('DEV: Enabled developer mode in userStore');
      
      // Navigate to login with a small delay to ensure state updates are processed
      setTimeout(() => {
        router.replace('/login');
      }, 300); // Increased delay to ensure state propagation
    } catch (error) {
      console.error('Error in skipToLogin:', error);
      // Try to navigate anyway
      router.replace('/login');
    }
  };

  // Implement the correct flow: Free trial screen → Purchase screen → Login (if bought/started trial)
  if (!subscribed) {
    if (currentScreen === 'freeTrial') {
      // Step 1: Free trial screen
      return (
        <GestureHandlerRootView>
          <SubscriptionPageWithFreeTrial
            purchase={() => {
              // After free trial screen, show purchase screen
              setCurrentScreen('purchase');
            }}
            pricePerWeek={
              offeringsStore.offerings?.current?.weekly?.product.priceString || "$6.99"
            }
            restorePurchases={restorePurchases}
          />
        </GestureHandlerRootView>
      );
    } else if (currentScreen === 'purchase') {
      // Step 2: Regular purchase screen (without free trial)
      return (
        <GestureHandlerRootView>
          <View style={{flex: 1}}>
            {/* X button to skip to login (dev feature) */}
            <TouchableOpacity 
              style={{
                position: 'absolute', 
                top: 50, 
                right: 20, 
                zIndex: 999,
                backgroundColor: 'rgba(0,0,0,0.5)',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center'
              }} 
              onPress={skipToLogin}
            >
              <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>X</Text>
            </TouchableOpacity>
            
            <SubscriptionPageWithoutFreeTrial
              weeklyPricePerWeek={
                offeringsStore.offerings?.current?.weekly?.product.priceString || "$6.99"
              }
              weeklyPricePerYear={ 
                offeringsStore.offerings?.current?.weekly?.product.priceString || "$359.88" 
              }
              annualPricePerWeek={
                offeringsStore.offerings?.current?.annual?.product.priceString || "$2.99" 
              }
              annualPricePerYear={
                offeringsStore.offerings?.current?.annual?.product.priceString || "$149.99" 
              }
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
    const categories = Object.keys(categoriesStore.categories);
    
    if (cardsPageVisible && selectedCategoryData) {
      return (
        <GestureHandlerRootView style={{flex:1}}> 
          <SwipeableCardsPage
            checkCategoryDone={async () => await updateCategoryDone()}
            category={selectedCategoryData.categoryName || activeTab}
            title={selectedCategoryData.id || cardsPageTitle}
            cardsPageVisible={cardsPageVisible}
            close={() => {
              setCardsPageVisible(false);
              setSelectedCategoryData(null);
              console.log("DEBUG: Closed SwipeableCardsPage");
            }}
            contentType={contentTypeStore.activeContentType}
          />
        </GestureHandlerRootView>
      );
    }

    console.log(`DEBUG: Main - Current categories: ${categories.join(', ')}`);

    const setActiveTabFooter = (value: string) => {
      console.log(`DEBUG: Main - Setting active tab to: ${value}`);
      setActiveTab(value);
    };

    return (
      <GestureHandlerRootView style={styles.container}>
        <Header
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
        
        {/* Progress Bar */}
        <ProgressBar 
          completedCount={getTotalCompletion().completedCount}
          totalCount={getTotalCompletion().totalCount}
        />
        


        {/* Vertical ScrollView to show all categories for the selected content type */}
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.white}
              colors={[Colors.white]}
              progressBackgroundColor={Colors.black}
            />
          }
        >
          {categories && categories.length > 0 ? (
            <View style={styles.allCategoriesContainer}>
              {/* Display all categories as a flat list */}
              {(() => {
                let allCategoryItems: JSX.Element[] = [];
                let itemIndex = 0;
                
                // Flatten the categories into a single list
                categories.forEach((category, categoryIndex) => {
                  if (!categoriesStore.categories[category]) {
                    return;
                  }
                  
                  const categoryKeys = Object.keys(categoriesStore.categories[category] || {});
                  
                  // Display up to 5 items (or fewer if there aren't that many)
                  categoryKeys.slice(0, 5).forEach((key, i) => {
                    const categoryItem = categoriesStore.categories[category][key];
                    
                    if (!categoryItem || !categoryItem.name) {
                      return;
                    }
                    
                    allCategoryItems.push(
                      <Category
                        key={`item-${itemIndex}`}
                        index={i}
                        categoryName={category}
                        completed={categoryDone[categoryIndex * 5 + i] || "false"}
                        title={categoryItem.name}
                        onPressCategory={() => {
                          setInfoBottomSheetVisible(false);
                          setSettingsBottomSheetVisible(false);
                          setCardsPageVisible(true);
                          console.log(`DEBUG: Selected category: ${category}, item: ${key}, name: ${categoryItem.name}`);
                          
                          // Log detailed information to help debug
                          console.log(`DEBUG: Category details - MongoDB ID: ${key}`);
                          console.log(`DEBUG: Content type: ${contentTypeStore.activeContentType}`);
                          console.log(`DEBUG: Full category data:`, categoryItem);
                          
                          // Make sure we're passing the MongoDB ObjectId as the key instead of the index
                          setCardsPageTitle(key);
                          setSelectedCategoryData({
                            ...categoryItem,
                            id: key, 
                            categoryName: category
                          });
                        }}
                      />
                    );
                    itemIndex++;
                  });
                });
                
                return allCategoryItems;
              })()}
            </View>
          ) : (
            <View style={styles.pageContainer}>
              <Text style={{ 
                color: Colors.white, 
                textAlign: 'center',
                fontFamily: "SFProMedium",
                fontSize: moderateScale(16),
                padding: horizontalScale(20)
              }}>
                Please select a content type or wait for categories to load
              </Text>
            </View>
          )}
        </ScrollView>

        <Footer activeTab={activeTab} setActiveTab={setActiveTabFooter} />

        {infoBottomSheetVisible && (
          <InfoPage
            closeBottomSheet={() => setInfoBottomSheetVisible(false)}
            triggerLimitedTimeOffer={showLimitedTimeOffer} 
          />
        )}

        {settingsBottomSheetVisible && (
          <SettingsPage
            closeBottomSheet={() => setSettingsBottomSheetVisible(false)}
            triggerLimitedTimeOffer={showLimitedTimeOffer} 
          />
        )}

        {limitedTimeOfferModalVisible && (
          <LimitedTimeOfferModal
            weeklyPricePerWeek={
              offeringsStore.offerings?.all?.default?.weekly?.product
                ?.priceString || ""
            }
            weeklyPricePerYear={ 
              offeringsStore.offerings?.all?.default?.weekly?.product
                ?.priceString || "" 
            }
            annualPricePerWeek={
              (offeringsStore.offerings?.all?.sale?.annual?.product
                ?.priceString) || ""
            }
            annualPricePerYear={
              (offeringsStore.offerings?.all?.sale?.annual?.product
                ?.priceString) || ""
            }
            limitedTimeOfferModalVisible={limitedTimeOfferModalVisible}
            close={async () => setLimitedTimeOfferModalVisible(false)}
            purchaseAnnual={purchaseAnnual} // Pass existing purchaseAnnual function
            purchaseWeekly={purchaseWeekly} // Pass existing purchaseWeekly function
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

const REVENUECAT_API_KEY = 'appl_TaLTvwpygoiZhOCYceJEewBuouG';
const PREMIUM_ENTITLEMENT_ID = 'Pro';
