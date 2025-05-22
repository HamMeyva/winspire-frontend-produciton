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
    if (title.length > 18) {
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
    const isCompleted = completed === "true" && !hasNewContent;
    
    // Debug log for icon state
    console.log(`Category ${title}: completed=${completed}, hasNewContent=${hasNewContent}, using isCompleted=${isCompleted}`);
    
    // Get the active content type
    const activeContentType = contentTypeStore.activeContentType;
    
    // Define all icons for different content types
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
      // Using Mind Hacks images as fallbacks for Trend Hacks
      "trend_default": require("@/assets/images/icons/Mind Hacks Default.png"),
      "trend_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
      
      // Hack2 content type icons
      "tinder_default": require("@/assets/images/icons/Tinder Hacks Default.png"),
      "tinder_completed": require("@/assets/images/icons/Tinder Hacks Completed.png"),
      "travel_default": require("@/assets/images/icons/Travel Hacks Default.png"),
      "travel_completed": require("@/assets/images/icons/Travel Hacks Completed.png"),
      "mind_default": require("@/assets/images/icons/Mind Hacks Default.png"),
      "mind_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
      "loophole_default": require("@/assets/images/icons/Loophole Hacks Default.png"),
      "loophole_completed": require("@/assets/images/icons/Loophole Hacks Green.png"),
      "business_default": require("@/assets/images/icons/Money Hacks Default.png"),
      "business_completed": require("@/assets/images/icons/Money Hacks Completed.png"),
      
      // Tips content type icons
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
      
      // Tips2 content type icons - using existing icons as fallbacks
      // Career & Leadership -> using Mindset Tips icons
      "career_leadership_default": require("@/assets/images/icons/Mindset Tips Default.png"),
      "career_leadership_completed": require("@/assets/images/icons/Mindset Tips Completed.png"),
      // Productivity & Time Management -> using Finance Tips icons
      "productivity_time_default": require("@/assets/images/icons/Finance Tips Default.png"),
      "productivity_time_completed": require("@/assets/images/icons/Finance Tips Completed.png"),
      // Creative Thinking & Problem-Solving -> using Mind Hacks icons
      "creative_thinking_default": require("@/assets/images/icons/Mind Hacks Default.png"),
      "creative_thinking_completed": require("@/assets/images/icons/Mind Hacks Completed.png"),
      // Psychology & Influence -> using Social Tips icons
      "psychology_influence_default": require("@/assets/images/icons/Social Tips Default.png"),
      "psychology_influence_completed": require("@/assets/images/icons/Social Tips Completed.png"),
      // Wisdom & Learning -> using Fitness Tips icons
      "wisdom_learning_default": require("@/assets/images/icons/Fitness Tips Default.png"),
      "wisdom_learning_completed": require("@/assets/images/icons/Fitness Tips Completed.png")
    };
    
    // Determine which category this is based on title and content type
    let categoryKey = "";
    const titleLower = title.toLowerCase();
    
    // Handle Tips2 content type categories (Career & Leadership, etc.)
    if (activeContentType === 'tip2') {
      if (titleLower.includes("career") || titleLower.includes("leadership")) {
        categoryKey = "career_leadership";
      } else if (titleLower.includes("productivity") || titleLower.includes("time management")) {
        categoryKey = "productivity_time";
      } else if (titleLower.includes("creative") || titleLower.includes("problem-solving")) {
        categoryKey = "creative_thinking";
      } else if (titleLower.includes("psychology") || titleLower.includes("influence")) {
        categoryKey = "psychology_influence";
      } else if (titleLower.includes("wisdom") || titleLower.includes("learning")) {
        categoryKey = "wisdom_learning";
      }
    }
    // Handle Hack content type categories
    else if (activeContentType === 'hack') {
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
    fontSize: moderateScale(24),
    lineHeight: moderateScale(30),
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
    width: horizontalScale(180),
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
