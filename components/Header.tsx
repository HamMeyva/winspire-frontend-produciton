import { useState, useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, Image, Platform } from "react-native";

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
    const categories = Object.keys(categoriesStore.categories);
    const promises = [];

    for (let category of categories) {
      for (let i = 0; i < 5; i++) {
        promises.push(STORAGE.getCategoryDone(category, i));
      }
    }

    const results = await Promise.all(promises);
    const doneCount = results.filter((val) => val === "true").length;

    const totalItems = categories.length * 5;
    const percentage = (doneCount / totalItems) * 100;

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
          {categoryDonePercentage < 100 ? (
            <Image
              resizeMode="contain"
              source={require("@/assets/images/logo.png")}
              style={[styles.logo, {tintColor: Colors.green}]}
            />
          ) : (
            <View style={styles.completedLogoContainer}>
              <Image
                resizeMode="contain"
                source={require("@/assets/images/logo.png")}
                style={[styles.logo, {tintColor: Colors.green}]}
              />

              <Image
                resizeMode="contain"
                source={require("@/assets/images/medal.png")}
                style={styles.medal}
              />
            </View>
          )}
        </SafeAreaView>

        <SafeAreaView style={styles.settingsContainer}>
          <View style={styles.iconCircle}>
            <Feather
              onPress={onPressInfo}
              name="info"
              size={moderateScale(22)}
              color={Colors.white}
            />
          </View>

          <View style={styles.iconCircle}>
            <Feather
              onPress={onPressSettings}
              name="settings"
              size={moderateScale(22)}
              color={Colors.white}
            />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${categoryDonePercentage}%`,
              borderTopRightRadius:
                categoryDonePercentage === 100 ? moderateScale(12) : 0,
              borderBottomRightRadius:
                categoryDonePercentage === 100 ? moderateScale(12) : 0,
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

  logo: {
    width: horizontalScale(150),
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
    width: horizontalScale(36),
    height: horizontalScale(36),
    borderRadius: horizontalScale(18),
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },

  progressBarContainer: {
    width: "88%",
    alignSelf: "center",
    height: verticalScale(16),
    backgroundColor: Colors.white,
    borderRadius: moderateScale(12),
    opacity: 0.5,
  },

  progressBar: {
    height: "100%",
    backgroundColor: Colors.green,
    borderTopLeftRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(12),
  },
});
