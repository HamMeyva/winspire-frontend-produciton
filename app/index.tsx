import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
  Text,
  RefreshControl,
} from "react-native";
import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
} from "@/context/store";

// utils
import { STORAGE } from "@/utils/storage";
import { API } from "@/utils/api";

const { width } = Dimensions.get("screen");

function Main() {
  const scrollViewRef = useRef<any>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [checker, setChecker] = useState(false);
  const [subscribed, setSubscribed] = useState(true);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);

  const [infoBottomSheetVisible, setInfoBottomSheetVisible] =
    useState<boolean>(false);
  const [settingsBottomSheetVisible, setSettingsBottomSheetVisible] =
    useState<boolean>(false);

  const [limitedTimeOfferModalVisible, setLimitedTimeOfferModalVisible] =
    useState(false);

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
  

  const getCustomerInfo = async () => {
    console.log("DEBUG: getCustomerInfo called, setting subscribed to true");
    setSubscribed(true);
    return null;
  };

  const checkTrialEligibility = async () => {
    // Placeholder for future IAP implementation
    return false;
  };

  const restorePurchases = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const purchasePackage = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const handleLimitedTimeOffer = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  useEffect(() => {
    console.log("DEBUG: Main component mounted");
    handleLimitedTimeOffer();
    getCustomerInfo();
  }, []);

  const purchaseFreeTrial = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const purchaseMonthly = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const purchaseAnnual = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  useEffect(() => {
    setChecker(!checker);
  }, [offeringsStore.offerings, subscribed, freeTrialAvailable]);

  const showLimitedTimeOffer = () => {
    setLimitedTimeOfferModalVisible(true);
  };

  useEffect(() => {
    const loadDataForActiveContentType = async () => {
      if (contentTypeStore.activeContentType) {
        // setLoadingCategories(true); // Optional: manage a loading state

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
          await updateCategoryDone(); // Refresh completion status after new data
        } catch (error) {
          console.error('Error fetching categories for activeContentType:', error);
          // categoriesStore.update({}); // Optionally clear if fetch fails
        }
        // setLoadingCategories(false);
      } else {
        // No active content type, ensure categories are cleared if necessary
        if (Object.keys(categoriesStore.categories).length > 0) {
          console.log("DEBUG: No active content type, clearing categories from store.");
          categoriesStore.update({});
          await updateCategoryDone(); // Reflect cleared state
        }
      }
    };

    loadDataForActiveContentType();
  }, [contentTypeStore.activeContentType]); // Re-run when activeContentType changes

  if (!subscribed && freeTrialAvailable) {
    return (
      <GestureHandlerRootView>
        <SubscriptionPageWithFreeTrial />
      </GestureHandlerRootView>
    );
  } else if (!subscribed) {
    <GestureHandlerRootView>
      <SubscriptionPageWithoutFreeTrial
        weeklyPricePerWeek={
          offeringsStore.offerings.all.default.weekly?.product
            .pricePerWeekString
        }
        weeklyPricePerYear={
          offeringsStore.offerings.all.default.weekly?.product
            .pricePerYearString
        }
        annualPricePerWeek={
          offeringsStore.offerings.all.default.annual?.product
            .pricePerWeekString
        }
        annualPricePerYear={
          offeringsStore.offerings.all.default.annual?.product
            .pricePerYearString
        }
        purchaseWeekly={purchaseMonthly}
        purchaseAnnual={purchaseAnnual}
        restorePurchases={restorePurchases}
      />
    </GestureHandlerRootView>;
  } else if (subscribed) {
    const categories = Object.keys(categoriesStore.categories);
    
    console.log(`DEBUG: Main - Current categories: ${categories.join(', ')}`);

    const setActiveTabFooter = (value: string) => {
      console.log(`DEBUG: Main - Setting active tab to: ${value}`);
      // We don't need to scroll horizontally anymore, just update the UI
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
                            id: key, // Ensure the ID is passed correctly
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
                Lütfen içerik türü seçin veya kategorilerin yüklenmesini bekleyin
              </Text>
            </View>
          )}
        </ScrollView>

        <Footer activeTab={activeTab} setActiveTab={setActiveTabFooter} />

        {infoBottomSheetVisible && (
          <InfoPage
            closeBottomSheet={() => setInfoBottomSheetVisible(false)}
            triggerLimitedTimeOffer={showLimitedTimeOffer} // Pass the function
          />
        )}

        {settingsBottomSheetVisible && (
          <SettingsPage
            closeBottomSheet={() => setSettingsBottomSheetVisible(false)}
            triggerLimitedTimeOffer={showLimitedTimeOffer} // Pass the function
          />
        )}

        {cardsPageVisible && selectedCategoryData && (
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
        )}

        {limitedTimeOfferModalVisible && (
          <LimitedTimeOfferModal
            weeklyPricePerWeek={
              offeringsStore.offerings?.all?.default?.weekly?.product
                ?.pricePerWeekString || ""
            }
            weeklyPricePerYear={
              offeringsStore.offerings?.all?.default?.weekly?.product
                ?.pricePerYearString || ""
            }
            annualPricePerWeek={
              offeringsStore.offerings?.all?.sale?.annual?.product
                ?.pricePerWeekString || ""
            }
            annualPricePerYear={
              offeringsStore.offerings?.all?.sale?.annual?.product
                ?.pricePerYearString || ""
            }
            limitedTimeOfferModalVisible={limitedTimeOfferModalVisible}
            close={async () => setLimitedTimeOfferModalVisible(false)}
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
