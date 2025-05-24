import {
  View,
  Text,
  ScrollView,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Share,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import * as StoreReview from "expo-store-review";
import { categoriesStore } from "@/context/store";
import { userStore } from '@/context/store';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import React from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import SwipeTutorialOverlay from "@/components/SwipeTutorialOverlay";

// components
import CardsContainer from "@/components/CardsContainer";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// utils
import { STORAGE } from "@/utils/storage";
import { API } from "@/utils/api";

const { width } = Dimensions.get("screen");

export default function SwipeableCardsPage({
  title,
  category,
  cardsPageVisible,
  close,
  checkCategoryDone,
  contentType,
}: {
  title: string;
  category: string;
  cardsPageVisible: boolean;
  close: () => void;
  checkCategoryDone: () => void;
  contentType: string;
}) {
  const scrollViewRef = useRef<any>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [showPageNumberContainer, setShowPageNumberContainer] = useState(false);
  
  // Track card statuses
  const [cardActions, setCardActions] = useState<Record<number, 'like' | 'dislike' | 'maybe'>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'like' | 'dislike' | 'maybe'>('all');
  const [filteredCardIndices, setFilteredCardIndices] = useState<number[]>([]);
  
  // State for backend content
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // State for current category title in header
  const [categoryTitle, setCategoryTitle] = useState<string>("");
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  useEffect(() => {
    if (showPageNumberContainer === false) {
      setShowPageNumberContainer(true);

      setTimeout(() => {
        setShowPageNumberContainer(false);
      }, 5000);
    }
  }, [pageNumber]);

  // Load card actions on mount
  useEffect(() => {
    const loadCardActions = async () => {
      const actions = await STORAGE.getAllCardActions(category, title);
      setCardActions(actions);
      updateFilteredCards(actions, filterMode);
    };
    
    loadCardActions();
  }, [category, title]);
  
  // Effect to check if tutorial should be shown
  useEffect(() => {
    const checkTutorialStatus = async () => {
      console.log('[SwipeableCardsPage] Tutorial Check Effect: cardsPageVisible =', cardsPageVisible);
      if (cardsPageVisible) { // Only run when modal becomes visible
        try {
          const userId = userStore.userId || 'guest';
          const storageKey = `hasSeenSwipeTutorial_v1_${userId}`;
          const hasSeenTutorial = await AsyncStorage.getItem(storageKey);
          console.log(`[SwipeableCardsPage] Tutorial Check: AsyncStorage ${storageKey} =`, hasSeenTutorial);
          if (hasSeenTutorial !== 'true') {
            console.log('[SwipeableCardsPage] Tutorial Check: Setting showTutorialModal to true');
            setShowTutorialModal(true);
          } else {
            console.log('[SwipeableCardsPage] Tutorial Check: Tutorial already seen, not showing.');
          }
        } catch (error) {
          console.error('[SwipeableCardsPage] Error reading tutorial status from AsyncStorage:', error);
          // Potentially show tutorial on error, or handle as needed
          // setShowTutorialModal(true);
        }
      } else {
        // Optional: Reset if needed when page is hidden
        // console.log('[SwipeableCardsPage] Tutorial Check: Page not visible, doing nothing.');
      }
    };

    checkTutorialStatus();
  }, [cardsPageVisible]);

  const handleDismissTutorial = async () => {
    console.log('[SwipeableCardsPage] Dismissing tutorial.');
    try {
      const userId = userStore.userId || 'guest';
      const storageKey = `hasSeenSwipeTutorial_v1_${userId}`;
      await AsyncStorage.setItem(storageKey, 'true');
      console.log(`[SwipeableCardsPage] Tutorial status saved to AsyncStorage for key ${storageKey}.`);
      setShowTutorialModal(false);
    } catch (error) {
      console.error('[SwipeableCardsPage] Error saving tutorial status to AsyncStorage:', error);
      setShowTutorialModal(false); // Still hide modal on error
    }
  };

  // Constants for prompt limits and behavior
  const MAX_PROMPTS_PER_CATEGORY = 10; // Show maximum 10 prompts per category
  
  // Fetch content from backend with limit
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Get categoryId from the title parameter
        const categoryId = title;
        
        console.log(`DEBUG: SwipeableCardsPage - Fetching content for category: ${category} (ID: ${categoryId}) with contentType: ${contentType}`);
        
        // Orijinal getContentByCategory fonksiyonunu kullanarak içerikleri çek
        // Bu daha güvenilir ve mevcut API yapısıyla uyumlu
        const contentData = await API.getContentByCategory(categoryId, contentType, "published");
        
        console.log(`DEBUG: SwipeableCardsPage - API response received: ${contentData ? contentData.length : 0} items`);
        console.log(`DEBUG: SwipeableCardsPage - First item sample:`, contentData && contentData[0] ? contentData[0] : "No content");
        
        if (contentData && contentData.length > 0) {
          // İçeriği MAX_PROMPTS_PER_CATEGORY (10) ile sınırla
          const limitedContentData = contentData.slice(0, MAX_PROMPTS_PER_CATEGORY);
          console.log(`DEBUG: SwipeableCardsPage - Limiting content to ${limitedContentData.length} items out of ${contentData.length} total`);
          
          // TEMPORARY FIX: Using all content regardless of expiration status so users can see published prompts
          console.log(`DEBUG: SwipeableCardsPage - Using all ${limitedContentData.length} content items for category ${category}`);
          
          // Mark content as viewed when it's displayed
          for (let i = 0; i < limitedContentData.length; i++) {
            // Record that this prompt was viewed now
            STORAGE.setPromptViewed(category, title, i);
          }
          
          // Simply use all content without checking for expiration
          setContentItems(limitedContentData);
        } else {
          console.log(`DEBUG: SwipeableCardsPage - No content found for category ${category}`);
          // Set a placeholder content item to show the user that no content was found
          setContentItems([{
            body: `Bu kategori (${category}) için henüz içerik eklenmemiş. Lütfen daha sonra tekrar deneyiniz veya başka bir kategori seçiniz.\n\nSeçilen içerik türü: ${contentType}\nKategori ID: ${categoryId}`,
            summary: `Bu kategori için içerik bulunamadı.`,
            title: `İçerik Bulunamadı`
          }]);
        }
        
        // Run check for expired prompts in the background
        STORAGE.checkAndMarkExpiredPrompts();
        // Kimlik doğrulama hatası olduğu için devre dışı bırakıldı
        // API.reportExpiredPrompts();
      } catch (error: any) {
        console.error(`DEBUG: SwipeableCardsPage - Error fetching content:`, error);
        // Set an error message content item
        setContentItems([{
          body: `İçerik yüklenirken bir hata oluştu. Hata mesajı: ${error.message || "Bilinmeyen hata"}. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.\n\nTeknik bilgi: Kategori=${category}, İçerik Türü=${contentType}, ID=${title}`,
          summary: `İçerik yüklenirken hata oluştu.`,
          title: `Hata`
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    if (category && contentType && title) {
      console.log(`DEBUG: SwipeableCardsPage - Required parameters present: category=${category}, contentType=${contentType}, title=${title}`);
      fetchContent();
    } else {
      console.log(`DEBUG: SwipeableCardsPage - Missing required parameter: category=${category}, contentType=${contentType}, title=${title}`);
      setLoading(false);
      setContentItems([{
        body: `Eksik parametreler: ${!category ? 'Kategori, ' : ''}${!contentType ? 'İçerik Türü, ' : ''}${!title ? 'Kategori ID' : ''}`,
        summary: `Eksik parametreler nedeniyle içerik yüklenemedi.`,
        title: `Parametre Hatası`
      }]);
    }
  }, [category, contentType, title]);
  
  // Load category title
  useEffect(() => {
    try {
      if (categoriesStore.categories && 
          categoriesStore.categories[category] && 
          categoriesStore.categories[category][title] && 
          categoriesStore.categories[category][title].name) {
        setCategoryTitle(categoriesStore.categories[category][title].name);
      } else {
        // Try to find the title from category keys
        if (categoriesStore.categories && categoriesStore.categories[category]) {
          const keys = Object.keys(categoriesStore.categories[category]);
          if (keys.length > 0 && parseInt(title) < keys.length) {
            const key = keys[parseInt(title)];
            if (categoriesStore.categories[category][key] && 
                categoriesStore.categories[category][key].name) {
              setCategoryTitle(categoriesStore.categories[category][key].name);
            } else {
              setCategoryTitle("Content");
            }
          } else {
            setCategoryTitle("Content");
          }
        } else {
          setCategoryTitle("Content");
        }
      }
    } catch (error) {
      console.error("Error setting category title:", error);
      setCategoryTitle("Content");
    }
  }, [category, title]);
  
  // Update filtered cards when filter mode changes
  const updateFilteredCards = (actions: Record<number, 'like' | 'dislike' | 'maybe'>, mode: 'all' | 'like' | 'dislike' | 'maybe') => {
    if (mode === 'all') {
      setFilteredCardIndices([]);
      return;
    }
    
    const indices = Object.entries(actions)
      .filter(([_, action]) => action === mode)
      .map(([index]) => parseInt(index));
      
    setFilteredCardIndices(indices);
  };
  
  // Listen for changes to card actions
  useEffect(() => {
    const checkForCardStatusChanges = async () => {
      const actions = await STORAGE.getAllCardActions(category, title);
      if (JSON.stringify(actions) !== JSON.stringify(cardActions)) {
        setCardActions(actions);
        updateFilteredCards(actions, filterMode);
      }
    };
    
    const intervalId = setInterval(checkForCardStatusChanges, 1000);
    return () => clearInterval(intervalId);
  }, [cardActions, filterMode]);

  const getCards = () => {
    // Show loading indicator
    if (loading) {
      return [
        <View key="loading" style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>İçerik yükleniyor...</Text>
        </View>
      ];
    }
    
    // If we have content items from the backend, use those
    if (contentItems.length > 0) {
      const cards = contentItems.map((item, index) => (
        <CardsContainer
          key={index}
          text={item.body || item.summary || "No content available"}
          category={category}
          title={title}
          cardIndex={index}
          onSwipeComplete={() => {
            // Check if there are more cards to show
            if (pageNumber < contentItems.length) {
              scrollViewRef.current.scrollTo({
                x: width * pageNumber,
                y: 0,
                animated: true,
              });
            }
          }}
        />
      ));
      
      // Apply filtering if needed
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map(index => {
          const card = cards[index];
          return React.cloneElement(card, {
            onSwipeComplete: () => {
              const currentFilteredIndex = filteredCardIndices.indexOf(index);
              if (currentFilteredIndex < filteredCardIndices.length - 1) {
                scrollViewRef.current.scrollTo({
                  x: width * (currentFilteredIndex + 1),
                  y: 0,
                  animated: true,
                });
              }
            }
          });
        });
      }
      
      return cards;
    }
    
    // Fallback to using stored content if backend content isn't available
    try {
      if (!categoriesStore.categories[category] || !categoriesStore.categories[category][title]) {
        // Return a placeholder card if data is missing
        return [
          <CardsContainer
            key={0}
            text="No content available for this category"
            category={category}
            title={title}
            cardIndex={0}
            onSwipeComplete={() => {}}
          />
        ];
      }
      
      const data = categoriesStore.categories[category][title];
      
      let cards = [];
      
      if (data.manual) {
        const manualCount = data.manualCount;
  
        cards = Object.keys(data.texts[manualCount]).map((_, index) => (
          <CardsContainer
            key={index}
            text={decodeURIComponent(data.texts[manualCount][index.toString()])}
            category={category}
            title={title}
            cardIndex={index}
            onSwipeComplete={() => {
              // Check if there are more cards to show
              const maxPages = Object.keys(data.texts[manualCount]).length;
              if (pageNumber < maxPages) {
                scrollViewRef.current.scrollTo({
                  x: width * pageNumber,
                  y: 0,
                  animated: true,
                });
              }
            }}
          />
        ));
      } else if (data.texts && Array.isArray(data.texts)) {
        cards = data.texts.map((text: string, index: number) => (
          <CardsContainer 
            key={index} 
            text={decodeURIComponent(text)} 
            category={category}
            title={title}
            cardIndex={index}
            onSwipeComplete={() => {
              // Check if there are more cards to show
              const maxPages = data.texts.length;
              if (pageNumber < maxPages) {
                scrollViewRef.current.scrollTo({
                  x: width * pageNumber,
                  y: 0,
                  animated: true,
                });
              }
            }}
          />
        ));
      } else {
        // Return a placeholder card if data is missing or in unexpected format
        return [
          <CardsContainer
            key={0}
            text="No content available for this category"
            category={category}
            title={title}
            cardIndex={0}
            onSwipeComplete={() => {}}
          />
        ];
      }
      
      // Apply filtering if needed
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map(index => {
          const card = cards[index];
          // We need to clone the element to add the onSwipeComplete prop with the correct index
          return React.cloneElement(card, {
            onSwipeComplete: () => {
              const currentFilteredIndex = filteredCardIndices.indexOf(index);
              if (currentFilteredIndex < filteredCardIndices.length - 1) {
                scrollViewRef.current.scrollTo({
                  x: width * (currentFilteredIndex + 1),
                  y: 0,
                  animated: true,
                });
              }
            }
          });
        });
      }
      
      return cards;
    } catch (error) {
      console.error("Error rendering cards:", error);
      // Return a placeholder card if there's an error
      return [
        <CardsContainer
          key={0}
          text="There was an error loading content"
          category={category}
          title={title}
          cardIndex={0}
          onSwipeComplete={() => {}}
        />
      ];
    }
  };

  const getDots = () => {
    // If we have content items from the backend, use their length
    if (contentItems.length > 0) {
      // Show filtered page count if filtering is active
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map((_, index) => (
          <View
            key={index}
            style={[
              styles.footerDot,
              {
                backgroundColor:
                  pageNumber === index + 1 ? Colors.lightGray : Colors.white,
              },
            ]}
          />
        ));
      }
      
      return Array.from({ length: contentItems.length }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.footerDot,
            {
              backgroundColor:
                pageNumber === index + 1 ? Colors.lightGray : Colors.white,
            },
          ]}
        />
      ));
    }
    
    // Fallback to using stored content if backend content isn't available
    try {
      if (!categoriesStore.categories[category] || !categoriesStore.categories[category][title]) {
        return [
          <View
            key={0}
            style={[
              styles.footerDot,
              { backgroundColor: Colors.lightGray },
            ]}
          />
        ];
      }
      
      const data = categoriesStore.categories[category][title];
      
      if (filterMode !== 'all' && filteredCardIndices.length > 0) {
        return filteredCardIndices.map((_, index) => (
          <View
            key={index}
            style={[
              styles.footerDot,
              {
                backgroundColor:
                  pageNumber === index + 1 ? Colors.lightGray : Colors.white,
              },
            ]}
          />
        ));
      }
      
      let maxPages = 1;
      
      if (data.manual && data.texts && data.texts[data.manualCount]) {
        maxPages = Object.keys(data.texts[data.manualCount]).length;
      } else if (data.texts && Array.isArray(data.texts)) {
        maxPages = data.texts.length;
      }
      
      return Array.from({ length: maxPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.footerDot,
            {
              backgroundColor:
                pageNumber === index + 1 ? Colors.lightGray : Colors.white,
            },
          ]}
        />
      ));
    } catch (error) {
      console.error("Error rendering dots:", error);
      return [
        <View
          key={0}
          style={[
            styles.footerDot,
            { backgroundColor: Colors.lightGray },
          ]}
        />
      ];
    }
  };

  const updateCategoryDone = async () => {
    const value = await STORAGE.getReviewShown();

    if (value === null) {
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

      if (percentage >= 100) {
        if (await StoreReview.hasAction()) {
          const isAvailable = await StoreReview.isAvailableAsync();

          if (isAvailable) {
            StoreReview.requestReview()
              .then(async () => {
                await STORAGE.setReviewShown();

                console.log("Review requested successfully!");
              })
              .catch((error) => {
                console.error("Error requesting review:", error);
              });
          }
        }
      }
    }
  };

  useEffect(() => {
    updateCategoryDone();

    const intervalId = setInterval(() => {
      updateCategoryDone();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Function to handle sharing the app or category with current card content
  const onShareApp = async () => {
    try {
      // Get the current card content based on page number
      let currentCardContent = "";
      if (contentItems.length > 0 && pageNumber > 0 && pageNumber <= contentItems.length) {
        const currentItem = contentItems[pageNumber - 1];
        currentCardContent = currentItem.body || currentItem.summary || "";
        
        // Limit the length of the content for sharing
        if (currentCardContent.length > 200) {
          currentCardContent = currentCardContent.substring(0, 197) + "...";
        }
      }
      
      const shareMessage = `"${currentCardContent}"

Check out this and more in the Winspire app! Download now from`;
      
      const result = await Share.share({
        message: shareMessage,
        url: 'https://winspire.app',
        title: 'Share Winspire Content'
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(`Shared content with activity type: ${result.activityType}`);
        } else {
          // shared
          console.log('Content shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share was dismissed');
      }
    } catch (error: any) {
      console.error('Error sharing:', error.message);
    }
  };

  // Log showTutorialModal state before rendering the overlay
  console.log('[SwipeableCardsPage] Render: showTutorialModal =', showTutorialModal);

  return (
    <Modal animationType="slide" visible={cardsPageVisible}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Pressable onPress={close}>
            <Ionicons name="chevron-back" size={moderateScale(28)} color="white" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {categoryTitle || title}
          </Text>
          <TouchableOpacity onPress={onShareApp} style={styles.shareIconContainer}>
            <Ionicons name="share-outline" size={moderateScale(26)} color="white" />
          </TouchableOpacity>
        </View>

        {showPageNumberContainer && pageNumber > 0 && (
          <View style={styles.pageNumberContainer}>
            <Text style={styles.pageNumberText}>
              {pageNumber} /{" "}
              {(() => {
                try {
                  if (filterMode !== 'all' && filteredCardIndices.length > 0) {
                    return filteredCardIndices.length;
                  }
                  
                  if (contentItems.length > 0) {
                    return contentItems.length;
                  }
                  
                  if (!categoriesStore.categories[category] || 
                      !categoriesStore.categories[category][title]) {
                    return 1;
                  }
                  
                  const data = categoriesStore.categories[category][title];
                  
                  if (data.manual && data.texts && data.texts[data.manualCount]) {
                    return Object.keys(data.texts[data.manualCount]).length;
                  } else if (data.texts && Array.isArray(data.texts)) {
                    return data.texts.length;
                  }
                  
                  return 1;
                } catch (error) {
                  console.error("Error calculating total pages:", error);
                  return 1;
                }
              })()}
            </Text>
          </View>
        )}

        <ScrollView
          horizontal
          pagingEnabled
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          style={styles.cardsScrollView}
          onScroll={async (event) => {
            const currentPage = Math.round(
              event.nativeEvent.contentOffset.x / width
            );

            setPageNumber(currentPage + 1);

            try {
              // Check if we're at the last page
              let isLastPage = false;
              
              if (contentItems.length > 0) {
                isLastPage = currentPage === contentItems.length - 1;
              } else if (categoriesStore.categories[category] && 
                        categoriesStore.categories[category][title]) {
                const data = categoriesStore.categories[category][title];
                
                if (data.manual && data.texts && data.texts[data.manualCount]) {
                  isLastPage = currentPage === Object.keys(data.texts[data.manualCount]).length - 1;
                } else if (data.texts && Array.isArray(data.texts)) {
                  isLastPage = currentPage === data.texts.length - 1;
                }
              }
              
              if (isLastPage) {
                await STORAGE.setCategoryDone(category, parseInt(title));
                checkCategoryDone();
              }
            } catch (error) {
              console.error("Error checking last page:", error);
            }
          }}
        >
          {getCards()}
        </ScrollView>

        <View style={styles.footerContainer}>
          <View style={styles.footerDotsContainer}>
            {getDots()}
          </View>
          <View style={styles.footerButtonsContainer}>
            {(() => {
              try {
                // Logic for 'Back' or 'Home' button
                if (pageNumber === 1 && (filterMode !== 'all' || (filteredCardIndices.length <= 1 && contentItems.length <=1) )) {
                  // Show 'Home' if it's the very first card and no real 'back' possible for current filter
                  // Or a placeholder if you prefer not to show 'Home'
                  return (
                    <Pressable
                      onPress={close} // Or a different action for 'Home'
                      style={[styles.footerButton, styles.backButton]} // Styled as 'Back' button
                    >
                      <Text style={[styles.footerButtonText, styles.backButtonText]}>Home</Text>
                    </Pressable>
                  );
                } else if (pageNumber > 1) {
                  return (
                    <Pressable
                      onPress={() => {
                        const effectiveCurrentIndex = filterMode === 'all' 
                          ? pageNumber - 1 
                          : filteredCardIndices.indexOf(contentItems[pageNumber - 1]?.originalIndex ?? -1);
                        
                        const targetVisualIndex = effectiveCurrentIndex -1; // scroll to previous visual item
                        
                        if (targetVisualIndex >= 0 && scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({
                            x: width * targetVisualIndex,
                            animated: true,
                          });
                        }
                        setPageNumber((prev) => Math.max(1, prev - 1));
                      }}
                      style={[styles.footerButton, styles.backButton]}
                    >
                      <Text style={[styles.footerButtonText, styles.backButtonText]}>Back</Text>
                    </Pressable>
                  );
                } else {
                  // Placeholder for consistent spacing if no button is shown on left
                  return <View style={styles.footerButtonPlaceholder} />;
                }
              } catch (error) {
                console.error("Error rendering back button:", error);
                return <View style={styles.footerButtonPlaceholder} />;
              }
            })()}

            {(() => {
              try {
                const totalCardsToConsider = filterMode === 'all' ? contentItems.length : filteredCardIndices.length;
                // Logic for 'Next' or 'Done' button
                if (pageNumber < totalCardsToConsider) {
                  return (
                    <Pressable
                      onPress={() => {
                        const effectiveCurrentIndex = filterMode === 'all' 
                          ? pageNumber - 1 
                          : filteredCardIndices.indexOf(contentItems[pageNumber - 1]?.originalIndex ?? -1);
                        
                        const targetVisualIndex = effectiveCurrentIndex + 1; // scroll to next visual item

                        if (targetVisualIndex < totalCardsToConsider && scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({
                            x: width * targetVisualIndex,
                            animated: true,
                          });
                        }
                        setPageNumber((prev) => Math.min(totalCardsToConsider, prev + 1));
                      }}
                      style={[styles.footerButton, styles.nextButton]}
                    >
                      <Text style={[styles.footerButtonText, styles.nextButtonText]}>Next</Text>
                    </Pressable>
                  );
                } else if (pageNumber === totalCardsToConsider && totalCardsToConsider > 0) {
                    // Show 'Done' if it's the last card
                    return (
                        <Pressable
                          onPress={() => {
                            if (Platform.OS === "ios") {
                                StoreReview.requestReview();
                            }
                            close();
                          }}
                          style={[styles.footerButton, styles.nextButton]} // Styled as 'Next' button (or a specific 'Done' style)
                        >
                          <Text style={[styles.footerButtonText, styles.nextButtonText]}>Done</Text>
                        </Pressable>
                    );
                } else {
                    // Placeholder for consistent spacing if no button is shown on right
                    return <View style={styles.footerButtonPlaceholder} />;
                }
              } catch (error) {
                console.error("Error rendering next/done button:", error);
                return <View style={styles.footerButtonPlaceholder} />;
              }
            })()}
          </View>
        </View>
      </View>
      {/* Render Tutorial Overlay on top of everything in the Modal */}
      <SwipeTutorialOverlay visible={showTutorialModal} onDismiss={handleDismissTutorial} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  
  cardsScrollView: {
    backgroundColor: "#F0EDE5", // Beige/off-white background from the reference image
  },

  headerContainer: {
    width: "100%",
    flexDirection: "row",
    paddingLeft: horizontalScale(20),
    paddingRight: horizontalScale(20),
    paddingTop: verticalScale(
      Platform.OS === "android" ? 20 : 60
    ),
    paddingBottom: verticalScale(20),
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(22),
    flex: 1, // Allows title to take space and center correctly
    textAlign: "center",
    marginHorizontal: horizontalScale(5), // Add some margin to prevent overlap with icons
  },

  shareIconContainer: { // Added style for the share icon container
    padding: horizontalScale(5), // Add padding for easier touch
  },

  pageNumberContainer: {
    position: "absolute",
    top: verticalScale(Platform.OS === "android" ? 60 : 120),
    right: horizontalScale(25),
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(10),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: moderateScale(25),
    zIndex: 10,
  },

  pageNumberText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(14),
  },

  footerContainer: {
    paddingBottom: verticalScale(Platform.OS === "android" ? 30 : 40),
    paddingHorizontal: horizontalScale(20),
  },

  footerDotsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: horizontalScale(8),
    bottom: verticalScale(180), // Positioned exactly in the middle of the black space
    zIndex: 100,
  },

  footerDot: {
    width: horizontalScale(8),
    height: horizontalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "white", // Ensure dots are white
  },

  footerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: verticalScale(15),
    marginBottom: verticalScale(40),
    marginRight: horizontalScale(50),
    marginLeft: horizontalScale(40),
  },

  footerButton: {
    width: "38%",
    height: verticalScale(35),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(30),
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  footerButtonPlaceholder: {
    width: "48%",
    height: verticalScale(55),
  },

  footerButtonText: {
    fontFamily: "SFProBold",
    fontSize: moderateScale(18),
  },

  backButton: {
    backgroundColor: "#BCBCBC", // Light gray color from the reference image
  },
  backButtonText: {
    color: Colors.white,
  },

  nextButton: {
    backgroundColor: "#FF5A5F", // Coral red color from the reference image
  },
  nextButtonText: {
    color: Colors.white,
  },

  loadingContainer: {
    width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: horizontalScale(20),
  },
  
  loadingText: {
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
    marginTop: verticalScale(20),
    textAlign: "center",
  },
}); 