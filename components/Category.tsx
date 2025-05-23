import { useEffect, useState, useRef } from "react";
import { Image } from "expo-image";
import { Text, StyleSheet, Pressable, View, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// context
import { categoriesStore, contentTypeStore } from "@/context/store";
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
    // Get the active content type
    const activeContentType = contentTypeStore.activeContentType;
    
    // Only modify titles for tips and tips2 content types
    if (activeContentType === 'tip' || activeContentType === 'tip2') {
      // Format titles for tips categories based on the API response
      if (title.includes('Dating')) {
        return 'Dating & Relationships';
      } else if (title.includes('Finance') || title.includes('Wealth')) {
        return 'Finance & Wealth Building';
      } else if (title.includes('Fitness')) {
        return 'Fitness & Nutrition';
      } else if (title.includes('Mindset') || title.includes('Motivation')) {
        return 'Mindset & Motivation';
      } else if (title.includes('Social')) {
        return 'Social Skills';
      }
      
      // Format titles for tips2 categories based on the terminal logs
      else if (title.includes('Career') || title.includes('Leadership')) {
        return 'Career & Leadership';
      } else if (title.includes('Creative') || title.includes('Problem')) {
        return 'Creative Thinking & Problem-Solving';
      } else if (title.includes('Productivity') || title.includes('Time')) {
        return 'Productivity & Time Management';
      } else if (title.includes('Psychology') || title.includes('Influence')) {
        return 'Psychology & Influence';
      } else if (title.includes('Wisdom') || title.includes('Learning')) {
        return 'Wisdom & Learning';
      }
    }
    
    // For other content types (hack, hack2), keep the original title
    // If title is too long, handle line breaks
    if (title.length > 14) { // Reduced character count to match image
      const words = title.split(" ");
      
      // If there are only 2 or fewer words, just return the title
      if (words.length <= 2) return title;
      
      // Find a good breakpoint to split the title into two lines
      const midPoint = Math.floor(words.length / 2);
      
      // Insert a newline after a good break point
      words.splice(midPoint, 0, "\n");
      return words.join(" ");
    }
    
    return title;
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
    
    // First check if we have a stored value for this category's new content state
    const checkStoredNewContentStatus = async () => {
      try {
        // Get the active content type
        const activeContentType = contentTypeStore.activeContentType;
        
        // Get the category key from the title
        const categoryKey = Object.keys(categoriesStore.categories[categoryName])[index];
        
        // Create a unique key for this category and content type
        const storageKey = `${activeContentType}_${categoryKey}_newContent`;
        
        // Check if we have a stored value
        const storedNewContentStatus = await AsyncStorage.getItem(storageKey);
        
        if (storedNewContentStatus === 'true') {
          setHasNewContent(true);
        }
      } catch (error) {
        console.error('Error checking stored new content status:', error);
      }
    };
    
    checkStoredNewContentStatus();
    
    // If this is not the first render and we have more content than before, mark as having new content
    if (previousContentCountRef.current > 0 && currentContentCount > previousContentCountRef.current) {
      setHasNewContent(true);
      
      // Store this state for future app launches
      const storeNewContentStatus = async () => {
        try {
          // Get the active content type
          const activeContentType = contentTypeStore.activeContentType;
          
          // Get the category key from the title
          const categoryKey = Object.keys(categoriesStore.categories[categoryName])[index];
          
          // Create a unique key for this category and content type
          const storageKey = `${activeContentType}_${categoryKey}_newContent`;
          
          // Store that this category has new content
          await AsyncStorage.setItem(storageKey, 'true');
        } catch (error) {
          console.error('Error storing new content status:', error);
        }
      };
      
      storeNewContentStatus();
    }
    
    // Update refs for next comparison
    previousContentCountRef.current = currentContentCount;
    previousPublishedContentCountRef.current = currentPublishedContentCount;
  }, [categoryData, categoryName, index]);

  // Map category names to their respective icons
  const getIconSource = () => {
    // Determine if the category is completed
    const isCompleted = completed === "true";
    
    // Get the active content type
    const activeContentType = contentTypeStore.activeContentType;
    
    // Convert title to lowercase for easier comparison
    const titleLower = title.toLowerCase();
    
    // Initialize category key
    let categoryKey = "";
    
    // Map of icons for each category and completion state
    const icons: { [key: string]: any } = {
      // Hack content type icons
      "dating_default": require("@/assets/images/icons/Dating Hacks Default.png"),
      "dating_completed": require("@/assets/images/icons/Dating Hacks Completed.png"),
      "money_default": require("@/assets/images/icons/Money Hacks Default.png"),
      "money_completed": require("@/assets/images/icons/Money Hacks Completed.png"),
      "power_default": require("@/assets/images/icons/Power Hacks Default.png"),
      "power_completed": require("@/assets/images/icons/Power Hacks Completed.png"),
      "survival_default": require("@/assets/images/icons/Survival Hacks Default.png"),
      "survival_completed": require("@/assets/images/icons/Survival Hacks Completed.png"),
      "trend_default": require("@/assets/images/icons/Trend Hacks Default.png"),
      "trend_completed": require("@/assets/images/icons/Trend Hacks Completed.png"),
      
      // Hack2 content type icons
      "tinder_default": require("@/assets/images/icons/Tinder Hacks Default.png"),
      "tinder_completed": require("@/assets/images/icons/Tinder Hacks Completed.png"),
      "travel_default": require("@/assets/images/icons/Travel Hacks Default.png"),
      "travel_completed": require("@/assets/images/icons/Travel Hacks Completed.png"),
      "mind_default": require("@/assets/images/icons/Mind Hacks Default.png"),
      "mind_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
      "loophole_default": require("@/assets/images/icons/Loophole Hacks Default.png"),
      "loophole_completed": require("@/assets/images/icons/Loophole Hacks Green.png"),
      "business_default": require("@/assets/images/icons/Business-hacks-default.png"),
      "business_completed": require("@/assets/images/icons/Business-hacks-completed.png"),
      
      // Tip content type icons
      "dating_tips_default": require("@/assets/images/icons/Dating Tips Default.png"),
      "dating_tips_completed": require("@/assets/images/icons/Dating Tips Completed.png"),
      "finance_default": require("@/assets/images/icons/Finance Tips Default.png"),
      "finance_completed": require("@/assets/images/icons/Finance Tips Completed.png"),
      "fitness_default": require("@/assets/images/icons/Fitness Tips Default.png"),
      "fitness_completed": require("@/assets/images/icons/Fitness Tips Completed.png"),
      "mindset_default": require("@/assets/images/icons/Mindset Tips Default.png"),
      "mindset_completed": require("@/assets/images/icons/Mindset Tips Completed.png"),
      "social_default": require("@/assets/images/icons/Social Tips Default.png"),
      "social_completed": require("@/assets/images/icons/Social Tips Completed.png"),
      
      // Tip2 content type icons
      "career_default": require("@/assets/images/icons/Career Tips Default.png"),
      "career_completed": require("@/assets/images/icons/Career Tips Completed.png"),
      "productivity_default": require("@/assets/images/icons/Productivity Tips Default.png"),
      "productivity_completed": require("@/assets/images/icons/Productivity Tips Completed.png"),
      "creative_default": require("@/assets/images/icons/Creative Tips Default.png"),
      "creative_completed": require("@/assets/images/icons/Creative Tips Completed.png"),
      "psychology_default": require("@/assets/images/icons/Psychology Tips Default.png"),
      "psychology_completed": require("@/assets/images/icons/Psychology Tips Completed.png"),
      "wisdom_learning_default": require("@/assets/images/icons/Wisdom Tips Default.png"),
      "wisdom_learning_completed": require("@/assets/images/icons/Wisdom Tips Completed.png"),
    };
    
    // Handle Hack content type categories
    if (activeContentType === 'hack') {
      if (titleLower.includes("dating")) {
        categoryKey = "dating";
      } else if (titleLower.includes("money")) {
        categoryKey = "money";
      } else if (titleLower.includes("power")) {
        categoryKey = "power";
      } else if (titleLower.includes("survival")) {
        categoryKey = "survival";
      } else if (titleLower.includes("trend")) {
        categoryKey = "trend";
      }
    }
    // Handle Hack2 content type categories
    else if (activeContentType === 'hack2') {
      if (titleLower.includes("tinder")) {
        categoryKey = "tinder";
      } else if (titleLower.includes("travel")) {
        categoryKey = "travel";
      } else if (titleLower.includes("mind")) {
        categoryKey = "mind";
      } else if (titleLower.includes("loophole")) {
        categoryKey = "loophole";
      } else if (titleLower.includes("business")) {
        categoryKey = "business";
      }
    }
    // Handle Tips content type categories
    else if (activeContentType === 'tip') {
      if (titleLower.includes("dating")) {
        categoryKey = "dating_tips";
      } else if (titleLower.includes("finance") || titleLower.includes("wealth")) {
        categoryKey = "finance";
      } else if (titleLower.includes("fitness") || titleLower.includes("nutrition")) {
        categoryKey = "fitness";
      } else if (titleLower.includes("mindset") || titleLower.includes("motivation")) {
        categoryKey = "mindset";
      } else if (titleLower.includes("social")) {
        categoryKey = "social";
      }
    }
    // Handle Tips2 content type categories
    else if (activeContentType === 'tip2') {
      if (titleLower.includes("career") || titleLower.includes("leadership")) {
        categoryKey = "career";
      } else if (titleLower.includes("productivity") || titleLower.includes("time")) {
        categoryKey = "productivity";
      } else if (titleLower.includes("creative") || titleLower.includes("problem")) {
        categoryKey = "creative";
      } else if (titleLower.includes("psychology") || titleLower.includes("influence")) {
        categoryKey = "psychology";
      } else if (titleLower.includes("wisdom") || titleLower.includes("learning")) {
        categoryKey = "wisdom_learning";
      }
    }
    
    // Default fallback if no match is found
    if (!categoryKey) {
      if (activeContentType === 'tip2') {
        categoryKey = "wisdom_learning"; // Default for tip2
      } else if (activeContentType === 'hack2') {
        categoryKey = "mind"; // Default for hack2
      } else if (activeContentType === 'tip') {
        categoryKey = "mindset"; // Default for tip
      } else {
        categoryKey = "power"; // Default for hack
      }
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
          <Text style={styles.completedText}>Done. Updates in 24h</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: verticalScale(100), // Increased to match image exactly
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.black,
    borderColor: "#333333",
    borderRadius: moderateScale(16), // Adjusted to match image exactly
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20), // Adjusted to match image exactly
    paddingVertical: verticalScale(16), // Adjusted to match image exactly
    marginBottom: verticalScale(16), // Adjusted to match image exactly
    position: "relative",
  },

  titleContainer: {
    width: width * 0.65, // Adjusted width to match image
    flexDirection: "column",
    justifyContent: "center",
  },

  title: {
    fontWeight: "bold",
    color: Colors.white,
    fontFamily: "SFProBold", // SF Pro Bold for titles as specified
    fontSize: moderateScale(28), // Increased to match image exactly
    lineHeight: moderateScale(26), // Adjusted to match image exactly
  },

  iconWrapper: {
    height: verticalScale(48), // Increased to match image exactly
    width: horizontalScale(48), // Increased to match image exactly
    justifyContent: "center",
    alignItems: "center",
  },
  
  iconContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    height: verticalScale(60), // Increased to match image exactly
    width: horizontalScale(60), // Increased to match image exactly
  },

  completedContainer: {
    alignItems: "center",
    position: "absolute",
    justifyContent: "center",
    left: horizontalScale(16),
    height: verticalScale(22), // Increased to match image exactly
    bottom: verticalScale(-11), // Adjusted position to match image exactly
    width: horizontalScale(170), // Adjusted width to match image exactly
    backgroundColor: Colors.blue, // Blue as shown in the image
    borderRadius: moderateScale(6), // Adjusted to match image exactly
  },

  completedText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(11), // Increased to match image exactly
    letterSpacing: -0.2, // Slight negative letter spacing for exact match
  },
});

export default observer(Category);
