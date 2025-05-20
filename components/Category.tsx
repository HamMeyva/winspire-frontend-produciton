import { useEffect, useState, useRef } from "react";
import { Image } from "expo-image";
import { Text, StyleSheet, Pressable, View, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// context
import { categoriesStore } from "@/context/store";
import { observer } from "mobx-react-lite";

// utils
import { STORAGE } from "@/utils/storage";

const { width } = Dimensions.get("window");

function Category({
  title,
  completed,
  onPressCategory,
  categoryName,
  index,
}: {
  title: string;
  completed: string;
  onPressCategory: () => void;
  categoryName: string;
  index: number;
}) {
  const formatTitle = (title: string) => {
    if (title.length <= 18) return title;

    // For longer titles, use newlines to break into two lines
    const words = title.split(" ");
    
    // If there are only 2 or fewer words, just return the title
    if (words.length <= 2) return title;
    
    // Find a good breakpoint to split the title into two lines
    const midPoint = Math.floor(words.length / 2);
    
    // Insert a newline after a good break point
    words.splice(midPoint, 0, "\n");
    return words.join(" ");
  };

  const categoryData =
    categoriesStore.categories[categoryName][
      Object.keys(categoriesStore.categories[categoryName])[index]
    ];
    
  // Keep track of content count to detect new content
  const [hasNewContent, setHasNewContent] = useState(false);
  const previousContentCountRef = useRef<number>(0);
  const previousPublishedContentCountRef = useRef<number>(0);
  
  // Check for new content when the component mounts or updates
  useEffect(() => {
    if (!categoryData) return;
    
    const currentContentCount = categoryData.content?.length || 0;
    const currentPublishedContentCount = categoryData.content?.filter((item: { status: string }) => item.status === 'published')?.length || 0;
    
    console.log(`Category ${title}: Current published count: ${currentPublishedContentCount}, Previous: ${previousPublishedContentCountRef.current}`);
    
    // Always run the comparison, even on the first check
    if (previousPublishedContentCountRef.current > 0 && 
        currentPublishedContentCount > previousPublishedContentCountRef.current) {
      console.log(`Category ${title}: New published content detected!`);
      // Force the icon to be white by setting hasNewContent true
      setHasNewContent(true);
      
      // Store this category's new content state in AsyncStorage directly
      // We'll use AsyncStorage directly to avoid potential issues with STORAGE object
      const key = `category_${categoryName}_${index}_hasNewContent`;
      AsyncStorage.setItem(key, 'true');
    }
    
    // Update the reference counts
    previousContentCountRef.current = currentContentCount;
    previousPublishedContentCountRef.current = currentPublishedContentCount;
  }, [categoryData?.content?.length, categoryData?.content, categoryName, index]);
  
  // Check for saved new content status and reset flag when all content is viewed
  useEffect(() => {
    // First check if we have a stored value for this category's new content state
    const checkStoredNewContentStatus = async () => {
      try {
        // Use AsyncStorage directly
        const key = `category_${categoryName}_${index}_hasNewContent`;
        const storedValue = await AsyncStorage.getItem(key);
        if (storedValue === 'true') {
          setHasNewContent(true);
        }
      } catch (error) {
        console.error('Error reading hasNewContent from storage:', error);
      }
    };
    
    checkStoredNewContentStatus();
    
    // Reset new content flag when all content is viewed
    if (completed === "true" && categoryData?.content) {
      const currentPublishedCount = categoryData.content.filter((item: { status: string }) => item.status === 'published').length;
      
      if (previousPublishedContentCountRef.current === currentPublishedCount) {
        console.log(`Category ${title}: All content viewed and no new content detected`);
        setHasNewContent(false);
        // Clear the stored new content flag
        const key = `category_${categoryName}_${index}_hasNewContent`;
        AsyncStorage.removeItem(key);
      } else {
        console.log(`Category ${title}: New content detected, keeping icon white despite completed status`);
        setHasNewContent(true);
      }
    }
  }, [completed, categoryData?.content, categoryName, index]);

  // Map category names to their respective icons
  const getIconSource = () => {
    // Determine icon state based on completion and new content
    // IMPORTANT: If we have new content (hasNewContent=true), ALWAYS use default icon (white)
    // regardless of completed status
    // Otherwise, use completed icon (green) if all content is viewed
    // When new published content arrives, icon resets to white (hasNewContent becomes true)
    
    // Critical change: For categories with new content (hasNewContent=true),
    // icon should be WHITE (default) regardless of completed status.
    // Only use the green (completed) icon when all content has been viewed (completed="true")
    // AND there's no new content (hasNewContent=false).
    const isCompleted = completed === "true" && !hasNewContent;
    
    // Debug log for icon state
    console.log(`Category ${title}: completed=${completed}, hasNewContent=${hasNewContent}, using isCompleted=${isCompleted}`);
    
    // Define icon map - these must be static require statements
    const icons: { [key: string]: any } = {
      // Default icons (white)
      "tinder_default": require("@/assets/images/icons/Tinder Hacks Default.png"),
      "travel_default": require("@/assets/images/icons/Travel Hacks Default.png"),
      "mind_default": require("@/assets/images/icons/Mind Hacks Default.png"),
      "loophole_default": require("@/assets/images/icons/Loophole Hacks Default.png"),
      "money_default": require("@/assets/images/icons/Money Hacks Default.png"),
      "power_default": require("@/assets/images/icons/Power Hacks Default.png"),
      "survival_default": require("@/assets/images/icons/Survival Hacks Default.png"),
      "dating_hacks_default": require("@/assets/images/icons/Dating Hacks Default.png"),
      "dating_tips_default": require("@/assets/images/icons/Dating Tips Default.png"),
      "finance_default": require("@/assets/images/icons/Finance Tips Default.png"),
      "fitness_default": require("@/assets/images/icons/Fitness Tips Default.png"),
      "mindset_default": require("@/assets/images/icons/Mindset Tips Default.png"),
      "social_default": require("@/assets/images/icons/Social Tips Default.png"),
      
      // Completed icons (green)
      "tinder_completed": require("@/assets/images/icons/Tinder Hacks Completed.png"),
      "travel_completed": require("@/assets/images/icons/Travel Hacks Completed.png"),
      "mind_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
      "loophole_completed": require("@/assets/images/icons/Loophole Hacks Green.png"),
      "money_completed": require("@/assets/images/icons/Money Hacks Completed.png"),
      "power_completed": require("@/assets/images/icons/Power Hacks Completed.png"),
      "survival_completed": require("@/assets/images/icons/Survival Hacks Completed.png"),
      "dating_hacks_completed": require("@/assets/images/icons/Dating Hacks Completed.png"),
      "dating_tips_completed": require("@/assets/images/icons/Dating Tips Completed.png"),
      "finance_completed": require("@/assets/images/icons/Finance Tips Completed.png"),
      "fitness_completed": require("@/assets/images/icons/Fitness Tips Completed.png"),
      "mindset_completed": require("@/assets/images/icons/Mindset Tips Completed.png"),
      "social_completed": require("@/assets/images/icons/Social Tips Completed.png"),
    };
    
    // Determine which category this is
    let categoryKey = "";
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes("tinder")) {
      categoryKey = "tinder";
    } else if (titleLower.includes("travel")) {
      categoryKey = "travel";
    } else if (titleLower.includes("mind hack")) {
      categoryKey = "mind";
    } else if (titleLower.includes("loophole")) {
      categoryKey = "loophole";
    } else if (titleLower.includes("money")) {
      categoryKey = "money";
    } else if (titleLower.includes("power")) {
      categoryKey = "power";
    } else if (titleLower.includes("survival")) {
      categoryKey = "survival";
    } else if (titleLower.includes("business")) {
      // For business category, use money hacks icon as fallback
      categoryKey = "money";
    } else if (titleLower.includes("dating hack")) {
      categoryKey = "dating_hacks";
    } else if (titleLower.includes("dating tip")) {
      categoryKey = "dating_tips";
    } else if (titleLower.includes("finance") || titleLower.includes("wealth")) {
      categoryKey = "finance";
    } else if (titleLower.includes("fitness") || titleLower.includes("nutrition")) {
      categoryKey = "fitness";
    } else if (titleLower.includes("mindset") || titleLower.includes("motivation")) {
      categoryKey = "mindset";
    } else if (titleLower.includes("social")) {
      categoryKey = "social";
    } else {
      // Default if no match is found
      categoryKey = "mind";
    }
    
    // Create the full key by combining category with completion status
    const fullKey = `${categoryKey}_${isCompleted ? "completed" : "default"}`;
    
    // Return the appropriate icon or a default if not found
    return icons[fullKey] || icons["mind_default"];
  };

  return (
    <Pressable style={styles.container} onPress={onPressCategory}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{formatTitle(title)}</Text>
      </View>

      <View style={styles.iconWrapper}>
        <Image
          source={getIconSource()}
          style={styles.image}
          contentFit="contain"
        />
      </View>

      {completed === "true" && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>Done. Updates in 24h.</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: verticalScale(90),
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.black,
    borderColor: "#333333",
    borderRadius: moderateScale(16),
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    marginBottom: verticalScale(16),
    position: "relative",
  },

  titleContainer: {
    width: width * 0.7,
    flexDirection: "column",
    justifyContent: "center",
  },

  title: {
    fontWeight: "bold",
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(22),
    lineHeight: moderateScale(28),
  },

  iconWrapper: {
    height: verticalScale(48),
    width: horizontalScale(48),
    justifyContent: "center",
    alignItems: "center",
  },
  
  iconContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  
  dollarSign: {
    position: "absolute",
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },

  image: {
    height: verticalScale(48),
    width: horizontalScale(48),
  },

  completedContainer: {
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
    left: horizontalScale(16),
    height: verticalScale(22),
    bottom: verticalScale(-11),
    width: horizontalScale(140),
    backgroundColor: "#4f9ef4",
    borderRadius: moderateScale(6),
  },

  completedText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(11),
  },
});

export default Category;
