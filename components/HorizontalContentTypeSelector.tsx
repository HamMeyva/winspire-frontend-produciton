import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

// context
import { contentTypeStore, categoriesStore } from '@/context/store';

// constants
import { Colors } from '@/constants/Colors';
import { moderateScale, horizontalScale, verticalScale } from '@/constants/Metrics';

// components
import Category from './Category';

// utils
import { API } from '@/utils/api';

const { width } = Dimensions.get('window');

interface HorizontalContentTypeSelectorProps {
  categoryDone: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setCardsPageVisible: (visible: boolean) => void;
  setCardsPageTitle: (title: string) => void;
  setSelectedCategoryData: (data: any) => void;
  setInfoBottomSheetVisible: (visible: boolean) => void;
  setSettingsBottomSheetVisible: (visible: boolean) => void;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

const HorizontalContentTypeSelector = observer(({
  categoryDone,
  activeTab,
  setActiveTab,
  setCardsPageVisible,
  setCardsPageTitle,
  setSelectedCategoryData,
  setInfoBottomSheetVisible,
  setSettingsBottomSheetVisible,
  refreshing,
  onRefresh,
}: HorizontalContentTypeSelectorProps) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoriesByContentType, setCategoriesByContentType] = useState<Record<string, any>>({});
  const animatedValue = useSharedValue(0);

  // Content types in the desired order
  const contentTypes = ['hack', 'hack2', 'tip', 'tip2'];

  // Fetch categories for all content types on mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      const allCategories: Record<string, any> = {};
      
      for (const contentType of contentTypes) {
        try {
          const categories = await API.getCategoriesByContentType(contentType);
          allCategories[contentType] = categories;
        } catch (error) {
          console.error(`Error fetching categories for ${contentType}:`, error);
          allCategories[contentType] = {};
        }
      }
      
      setCategoriesByContentType(allCategories);
      
      // Set initial active content type if not set
      if (!contentTypeStore.activeContentType && contentTypes.length > 0) {
        contentTypeStore.setActiveContentType(contentTypes[0]);
      }
    };

    fetchAllCategories();
  }, []);

  // Update current index when active content type changes
  useEffect(() => {
    const index = contentTypes.indexOf(contentTypeStore.activeContentType);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
      animatedValue.value = withTiming(index);
      
      // Scroll to the correct position
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
        });
      }
    }
  }, [contentTypeStore.activeContentType]);

  // Handle scroll events
  const onScroll = (event: any) => {
    try {
      if (!event?.nativeEvent?.contentOffset) return;
      
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      
      if (index !== currentIndex && index >= 0 && index < contentTypes.length) {
        setCurrentIndex(index);
        animatedValue.value = withTiming(index);
        
        // Update content type store
        const newContentType = contentTypes[index];
        if (newContentType && newContentType !== contentTypeStore.activeContentType) {
          contentTypeStore.setActiveContentType(newContentType);
          
          // Update categories store with new content type data
          const newCategories = categoriesByContentType[newContentType] || {};
          categoriesStore.update(newCategories);
          
          // Set active tab to first category of new content type
          const categoryNames = Object.keys(newCategories);
          if (categoryNames.length > 0) {
            setActiveTab(categoryNames[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error in onScroll handler:', error);
    }
  };

  // Render content for each content type
  const renderContentType = ({ item: contentType }: { item: string }) => {
    const categories = categoriesByContentType[contentType] || {};
    const categoryNames = Object.keys(categories);

    return (
      <View style={styles.contentTypeContainer}>
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
          {categoryNames.length > 0 ? (
            <View style={styles.allCategoriesContainer}>
              {(() => {
                let allCategoryItems: JSX.Element[] = [];
                let itemIndex = 0;
                
                // Flatten the categories into a single list
                categoryNames.forEach((category, categoryIndex) => {
                  if (!categories[category]) {
                    return;
                  }
                  
                  const categoryKeys = Object.keys(categories[category] || {});
                  
                  // Display up to 5 items (or fewer if there aren't that many)
                  categoryKeys.slice(0, 5).forEach((key, i) => {
                    const categoryItem = categories[category][key];
                    
                    if (!categoryItem || !categoryItem.name) {
                      return;
                    }
                    
                    try {
                      allCategoryItems.push(
                        <Category
                          key={`${contentType}-${itemIndex}`}
                          index={i}
                          categoryName={category}
                          completed={categoryDone[categoryIndex * 5 + i] || "false"}
                          title={categoryItem.name}
                          onPressCategory={() => {
                            try {
                              setInfoBottomSheetVisible(false);
                              setSettingsBottomSheetVisible(false);
                              setCardsPageVisible(true);
                              console.log(`DEBUG: Selected category: ${category}, item: ${key}, name: ${categoryItem.name}`);
                              
                              // Log detailed information to help debug
                              console.log(`DEBUG: Category details - MongoDB ID: ${key}`);
                              console.log(`DEBUG: Content type: ${contentType}`);
                              console.log(`DEBUG: Full category data:`, categoryItem);
                              
                              // Make sure we're passing the MongoDB ObjectId as the key instead of the index
                              setCardsPageTitle(key);
                              setSelectedCategoryData({
                                ...categoryItem,
                                id: key,
                                categoryName: category
                              });
                            } catch (error) {
                              console.error('Error in onPressCategory:', error);
                            }
                          }}
                        />
                      );
                    } catch (error) {
                      console.error('Error rendering category:', error);
                    }
                    itemIndex++;
                  });
                });
                
                return allCategoryItems;
              })()}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Loading {getDisplayName(contentType)} categories...
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Get display name for content types
  const getDisplayName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hack': return 'Hacks';
      case 'hack2': return 'Hacks 2';
      case 'tip': return 'Tips';
      case 'tip2': return 'Tips 2';
      default: return type;
    }
  };

  // Animated style for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    try {
      const containerWidth = width - horizontalScale(40); // Account for margins
      const indicatorWidth = containerWidth / 4 - horizontalScale(10);
      const translateX = interpolate(
        animatedValue.value,
        [0, 1, 2, 3],
        [horizontalScale(5), containerWidth / 4 + horizontalScale(5), (containerWidth / 2) + horizontalScale(5), ((3 * containerWidth) / 4) + horizontalScale(5)],
        Extrapolate.CLAMP
      );
      
      return {
        transform: [{ translateX: isNaN(translateX) ? 0 : translateX }],
      };
    } catch (error) {
      console.error('Error in indicatorStyle animation:', error);
      return {
        transform: [{ translateX: 0 }],
      };
    }
  });

  // Add loading state
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Component is ready when we have at least some content types
    if (contentTypes.length > 0) {
      setIsReady(true);
    }
  }, [contentTypes]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Content type indicator */}
      <View style={styles.indicatorContainer}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        {contentTypes.map((type, index) => (
          <View key={type} style={styles.indicatorItem}>
            <Text style={[
              styles.indicatorText,
              index === currentIndex && styles.activeIndicatorText
            ]}>
              {getDisplayName(type)}
            </Text>
          </View>
        ))}
      </View>

      {/* Horizontal scrollable content */}
      <FlatList
        ref={flatListRef}
        data={contentTypes}
        renderItem={renderContentType}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialScrollIndex={Math.max(0, Math.min(currentIndex, contentTypes.length - 1))}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            try {
              if (flatListRef.current && info.index >= 0 && info.index < contentTypes.length) {
                flatListRef.current.scrollToIndex({ index: info.index, animated: false });
              }
            } catch (error) {
              console.error('Error in scrollToIndex retry:', error);
            }
          });
        }}
      />
    </View>
  );
});

export default HorizontalContentTypeSelector;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  
  indicatorContainer: {
    flexDirection: 'row',
    height: verticalScale(40),
    backgroundColor: '#1a1a1a',
    marginHorizontal: horizontalScale(20),
    marginVertical: verticalScale(10),
    borderRadius: moderateScale(20),
    position: 'relative',
    alignItems: 'center',
  },
  
  indicator: {
    position: 'absolute',
    width: (width - horizontalScale(40)) / 4 - horizontalScale(10),
    height: verticalScale(30),
    backgroundColor: Colors.green,
    borderRadius: moderateScale(15),
  },
  
  indicatorItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  
  indicatorText: {
    color: Colors.white,
    fontFamily: 'SFProMedium',
    fontSize: moderateScale(14),
    opacity: 0.6,
  },
  
  activeIndicatorText: {
    opacity: 1,
    color: Colors.white,
  },
  
  contentTypeContainer: {
    width,
    flex: 1,
  },
  
  contentContainer: {
    backgroundColor: Colors.black,
    flex: 1,
  },
  
  allCategoriesContainer: {
    padding: horizontalScale(20),
    paddingBottom: verticalScale(30),
  },
  
  emptyContainer: {
    padding: horizontalScale(20),
    paddingVertical: verticalScale(40),
    alignItems: 'center',
  },
  
  emptyText: {
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'SFProMedium',
    fontSize: moderateScale(16),
  },
}); 