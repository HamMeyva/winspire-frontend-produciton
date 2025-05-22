import { useState, useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, Image, Platform, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// utils
import { STORAGE } from "@/utils/storage";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// context
import { categoriesStore } from "@/context/store";

export default function Header({
  onPressInfo,
  onPressSettings,
}: {
  onPressInfo: () => void;
  onPressSettings: () => void;
}) {
  const [categoryDonePercentage, setCategoryDonePercentage] =
    useState<number>(0);

  const updateCategoryDone = async () => {
    // Track completion across all content types (hack, hack2, tip, tip2)
    const contentTypes = ['hack', 'hack2', 'tip', 'tip2'];
    let totalCompleted = 0;
    let totalCategories = 0;
    
    // Get all category completion statuses from storage
    for (const contentType of contentTypes) {
      try {
        // Get categories for this content type from storage
        const categoriesForType = await STORAGE.getAllCategoriesForContentType(contentType);
        if (!categoriesForType || !Array.isArray(categoriesForType)) continue;
        
        // Count total categories for accurate percentage calculation
        totalCategories += categoriesForType.length;
        
        // Check completion status for each category
        for (const category of categoriesForType) {
          // Each category counts as 1 subcategory (5% of progress)
          const isDone = await STORAGE.getCategoryDone(category, 0);
          if (isDone === "true") {
            totalCompleted++;
            console.log(`DEBUG: Category ${category} in ${contentType} is completed`);
          }
        }
      } catch (error) {
        console.error(`Error checking completion for ${contentType}:`, error);
      }
    }

    // Calculate percentage based on actual number of categories
    // Each category should contribute 5% to the total progress (assuming 20 total categories)
    const percentage = totalCategories > 0 ? (totalCompleted / totalCategories) * 100 : 0;
    console.log(`DEBUG: Progress - ${totalCompleted} completed out of ${totalCategories} total categories (${percentage.toFixed(2)}%)`);

    setCategoryDonePercentage(percentage);
  };



  useEffect(() => {
    updateCategoryDone();

    const intervalId = setInterval(() => {
      updateCategoryDone();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <SafeAreaView style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            {/* White logo as background */}
            <Image
              resizeMode="contain"
              source={require("@/assets/images/logo.png")}
              style={[styles.logo, {tintColor: '#333333'}]}
            />
            
            {/* Green logo with clipping based on progress */}
            <View style={[styles.progressLogoContainer, {width: `${categoryDonePercentage}%`}]}>
              <Image
                resizeMode="contain"
                source={require("@/assets/images/logo.png")}
                style={[styles.logo, {tintColor: Colors.green}]}
              />
            </View>
          </View>
        </SafeAreaView>

        <SafeAreaView style={styles.settingsContainer}>
          <View style={styles.iconCircle}>
            <Feather
              onPress={onPressInfo}
              name="info"
              size={moderateScale(20)}
              color={Colors.black}
            />
          </View>

          <View style={styles.iconCircle}>
            <Feather
              onPress={onPressSettings}
              name="settings"
              size={moderateScale(20)}
              color={Colors.black}
            />
          </View>
        </SafeAreaView>
      </View>

      {/* Single progress bar with proper styling */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${categoryDonePercentage}%`,
              borderTopRightRadius:
                categoryDonePercentage === 100 ? moderateScale(2.5) : 0,
              borderBottomRightRadius:
                categoryDonePercentage === 100 ? moderateScale(2.5) : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderBottomWidth: 1,
    height: verticalScale(148),
    backgroundColor: Colors.black,
    borderBottomColor: "#333333",
  },

  headerContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    height: verticalScale(120),
    backgroundColor: Colors.black,
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(24),
  },

  logoContainer: {
    height: "100%",
    justifyContent: "center",
    marginTop: Platform.OS === "ios" ? verticalScale(28) : 0,
  },
  
  logoWrapper: {
    position: "relative",
    width: horizontalScale(150),
    height: verticalScale(40),
    justifyContent: "center",
  },

  logo: {
    width: horizontalScale(150),
    height: verticalScale(40),
  },
  
  progressLogoContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    overflow: "hidden",
  },
  
  completedLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(12),
  },

  medal: {
    width: horizontalScale(44),
  },

  settingsContainer: {
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(12),
    marginTop: Platform.OS === "ios" ? verticalScale(28) : 0,
  },
  
  iconCircle: {
    width: horizontalScale(32),
    height: horizontalScale(32),
    borderRadius: horizontalScale(16),
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  progressBarContainer: {
    width: "88%",
    alignSelf: "center",
    height: verticalScale(5),
    backgroundColor: "#333333",
    borderRadius: moderateScale(2.5),
  },

  progressBar: {
    height: "100%",
    backgroundColor: Colors.green,
    borderTopLeftRadius: moderateScale(2.5),
    borderBottomLeftRadius: moderateScale(2.5),
  },
});
