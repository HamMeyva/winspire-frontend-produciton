import React, { useMemo } from "react";
import Feather from "@expo/vector-icons/Feather";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, Image, Platform, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// utils (removed unused imports to reduce API calls)

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
  categoryDone,
  onPressInfo,
  onPressSettings,
}: {
  categoryDone: any[];
  onPressInfo: () => void;
  onPressSettings: () => void;
}) {
  // Calculate progress percentage from categoryDone array (20 subcategories total)
  const categoryDonePercentage = useMemo(() => {
    if (!categoryDone || categoryDone.length === 0) return 0;
    
    const completedCount = categoryDone.filter(value => value === "true").length;
    const totalCount = 20; // Total of 20 subcategories across all content types
    const percentage = (completedCount / totalCount) * 100;
    
    console.log(`DEBUG: Header Progress - ${completedCount} completed out of ${totalCount} total subcategories (${percentage.toFixed(2)}%)`);
    
    return percentage;
  }, [categoryDone]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
                 <SafeAreaView style={styles.logoContainer}>
           {categoryDonePercentage === 100 ? (
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
           ) : (
             <View style={styles.logoWrapper}>
               {/* Gray logo as background */}
               <Image
                 resizeMode="contain"
                 source={require("@/assets/images/logo.png")}
                 style={[styles.logo, {tintColor: Colors.white}]}
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
           )}
         </SafeAreaView>

                 <SafeAreaView style={styles.settingsContainer}>
           <TouchableOpacity style={styles.iconCircle} onPress={onPressInfo}>
             <Feather
               name="info"
               size={moderateScale(18)}
               color={Colors.white}
             />
           </TouchableOpacity>

           <TouchableOpacity style={styles.iconCircle} onPress={onPressSettings}>
             <Feather
               name="settings"
               size={moderateScale(18)}
               color={Colors.white}
             />
           </TouchableOpacity>
         </SafeAreaView>
      </View>

             {/* Rounded pill progress bar */}
       <View style={styles.progressBarContainer}>
         <View style={styles.progressBarBackground}>
           <View style={[styles.progressBarFill, { width: `${categoryDonePercentage}%` }]} />
         </View>
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
    height: verticalScale(105),
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
     backgroundColor: Colors.black,
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
     paddingVertical: verticalScale(8),
   },

   progressBarBackground: {
     width: "100%",
     height: verticalScale(20),
     backgroundColor: Colors.white,
     borderRadius: moderateScale(10),
     overflow: 'hidden',
   },

   progressBarFill: {
     height: "100%",
     backgroundColor: Colors.green,
     borderRadius: moderateScale(10),
   },
});