import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
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

interface SwipeableFooterProps {
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
  shouldRefreshCategories?: boolean;
  forceNavigateToContentType?: string;
}

const SwipeableFooter = observer(({
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
  shouldRefreshCategories,
  forceNavigateToContentType,
}: SwipeableFooterProps) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoriesByContentType, setCategoriesByContentType] = useState<Record<string, any>>({});
  
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

  // Refetch categories when shouldRefreshCategories prop changes
  useEffect(() => {
    if (shouldRefreshCategories) {
      const fetchAllCategories = async () => {
        console.log('DEBUG: SwipeableFooter - Refreshing all categories due to shouldRefreshCategories');
        const currentActiveContentType = contentTypeStore.activeContentType; // Preserve current content type
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
        
        // Update categories store with current active content type data (preserve the current type)
        if (currentActiveContentType && allCategories[currentActiveContentType]) {
          const currentCategories = allCategories[currentActiveContentType] || {};
          categoriesStore.update(currentCategories);
          console.log('DEBUG: SwipeableFooter - Preserved content type after refresh:', currentActiveContentType);
        } else if (contentTypeStore.activeContentType) {
          // Fallback to current active content type if the preserved one is not available
          const currentCategories = allCategories[contentTypeStore.activeContentType] || {};
          categoriesStore.update(currentCategories);
        }
      };

      fetchAllCategories();
    }
  }, [shouldRefreshCategories]);

  // Handle forced navigation to specific content type
  useEffect(() => {
    if (forceNavigateToContentType && contentTypes.includes(forceNavigateToContentType)) {
      const targetIndex = contentTypes.indexOf(forceNavigateToContentType);
      console.log('DEBUG: SwipeableFooter - Forcing navigation to:', forceNavigateToContentType, 'at index:', targetIndex);
      
      // Update states
      setCurrentIndex(targetIndex);
      contentTypeStore.setActiveContentType(forceNavigateToContentType);
      
      // Update categories store with new content type data
      const newCategories = categoriesByContentType[forceNavigateToContentType] || {};
      categoriesStore.update(newCategories);
      
      // Set active tab to first category of new content type
      const categoryNames = Object.keys(newCategories);
      if (categoryNames.length > 0) {
        setActiveTab(categoryNames[0]);
      }
      
      // Scroll FlatList to correct position
      if (flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: targetIndex,
              animated: true,
            });
          } catch (error) {
            console.error('Error scrolling to forced content type:', error);
          }
        }, 100);
      }
    }
  }, [forceNavigateToContentType]);

  // Update current index when active content type changes
  useEffect(() => {
    const index = contentTypes.indexOf(contentTypeStore.activeContentType);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
      
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
                          completed={categoryDone[categoryIndex] || "false"}
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

  // Handle tab press
  const handleTabPress = (contentType: string, index: number) => {
    setCurrentIndex(index);
    contentTypeStore.setActiveContentType(contentType);
    
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Main content area with horizontal scrolling */}
      <View style={styles.contentArea}>
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

      {/* Bottom tab bar */}
<View style={styles.tabContainer}>
  <View style={styles.tabButtonsContainer}>
    {contentTypes.map((type, index) => {
      const isActive = index === currentIndex;
      return (
        <TouchableOpacity
          key={type}
          style={[
            styles.tabButton,
            isActive && styles.activeTabButton
          ]}
          onPress={() => handleTabPress(type, index)}
        >
          <Text 
            style={[
              styles.tabButtonText,
              isActive && styles.activeTabButtonText
            ]}
          >
            {getDisplayName(type)}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
  
  {/* White indicator bar at bottom */}
  <View style={styles.bottomIndicator} />
</View>
    </View>
  );
});

export default SwipeableFooter;
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.black,
    },
    
    contentArea: {
      flex: 1,
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
      paddingBottom: verticalScale(50),
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
    
    tabContainer: {
      backgroundColor: Colors.black,
      paddingHorizontal: horizontalScale(16),
      paddingVertical: verticalScale(14),
      paddingBottom: verticalScale(30), // Add space for home indicator
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    tabButtonsContainer: {
      flexDirection: 'row',
      backgroundColor: '#2A2A2A', // Dark gray pill background for all tabs
      borderRadius: moderateScale(30),
      padding: horizontalScale(5),
    },
    
    tabButton: {
      paddingVertical: verticalScale(14),
      paddingHorizontal: horizontalScale(24),
      borderRadius: moderateScale(22),
      marginHorizontal: horizontalScale(2),
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: horizontalScale(80),
      backgroundColor: 'transparent', // Transparent for inactive tabs
    },
    
    activeTabButton: {
      backgroundColor: '#505050', // Lighter gray for active tab on top of dark pill
    },
    
    tabButtonText: {
      color: Colors.white,
      fontFamily: 'SFProMedium',
      fontSize: moderateScale(15),
      opacity: 0.5,
      fontWeight: '500',
    },
    
    activeTabButtonText: {
      opacity: 1,
      fontWeight: '900',
      color: Colors.white,
    },
    
    bottomIndicator: {
      position: 'absolute',
      bottom: verticalScale(8),
      left: '50%',
      transform: [{ translateX: -horizontalScale(67) }], // Half of width to center
      width: horizontalScale(134),
      height: verticalScale(5),
      backgroundColor: Colors.white,
      borderRadius: moderateScale(2.5),
    },
  });