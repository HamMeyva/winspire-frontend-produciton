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
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import * as StoreReview from "expo-store-review";
import { categoriesStore, userStore } from "@/context/store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import React from "react";
import { observer } from "mobx-react-lite";

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

const { width } = Dimensions.get("screen");

export default observer(function CardsPage({
  title,
  category,
  cardsPageVisible,
  close,
  checkCategoryDone,
}: {
  title: string;
  category: string;
  cardsPageVisible: boolean;
  close: () => void;
  checkCategoryDone: () => void;
}) {
  const scrollViewRef = useRef<any>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [showPageNumberContainer, setShowPageNumberContainer] = useState(false);

  // Track card statuses
  const [cardActions, setCardActions] = useState<Record<number, 'like' | 'dislike' | 'maybe'>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'like' | 'dislike' | 'maybe'>('all');
  const [filteredCardIndices, setFilteredCardIndices] = useState<number[]>([]);

  useEffect(() => {
    if (showPageNumberContainer === false) {
      setShowPageNumberContainer(true);

      setTimeout(() => {
        setShowPageNumberContainer(false);
      }, 5000);
    }
  }, [pageNumber]);

  // Helper to get the raw list of all cards (texts and their original indices)
  const getAllCardsWithOriginalIndices = (): { text: string; originalIndex: number }[] => {
    const data = categoriesStore.categories[category]?.[title];
    if (!data) return [];

    if (data.manual) {
      const manualCount = data.manualCount;
      if (data.texts?.[manualCount]) {
        return Object.entries(data.texts[manualCount]).map(([key, value]) => ({
          text: String(value),
          originalIndex: parseInt(key),
        }));
      }
    } else if (Array.isArray(data.texts)) {
      return data.texts.map((text: string, index: number) => ({
        text: String(text),
        originalIndex: index,
      }));
    }
    return [];
  };

  // Helper to get the list of cards that should be displayed to the user
  const getEffectiveCardsList = (): { text: string; originalIndex: number }[] => {
    const allCards = getAllCardsWithOriginalIndices();
    if (!allCards.length) return [];

    // Apply subscription-based limit first
    const subscribableCards = !userStore.isSubscribed && allCards.length > 0
      ? [allCards[0]]
      : allCards;

    // Then apply filtering
    if (filterMode === 'all') {
      return subscribableCards;
    }
    // For filtered views, we check if the original indices of subscribableCards are in filteredCardIndices
    return subscribableCards.filter(card => filteredCardIndices.includes(card.originalIndex));
  };

  useEffect(() => {
    const loadCardActions = async () => {
      const actions = await STORAGE.getAllCardActions(category, title);
      setCardActions(actions);
      // Initial filter update - based on all cards originally
      const allOriginalCardIndices = getAllCardsWithOriginalIndices().map(c => c.originalIndex);
      let initialFilteredIndices: number[] = [];
      if (filterMode !== 'all') {
        initialFilteredIndices = Object.entries(actions)
          .filter(([_, action]) => action === filterMode)
          .map(([index]) => parseInt(index))
          .filter(idx => allOriginalCardIndices.includes(idx)); // Ensure indices are valid
      }
      setFilteredCardIndices(initialFilteredIndices);
    };
    
    loadCardActions();
  }, [category, title, filterMode]); 
  
  // Update filteredCardIndices when cardActions change or filterMode changes
  const updateFilteredCardIndicesLogic = (currentActions: Record<number, 'like' | 'dislike' | 'maybe'>, currentFilterMode: 'all' | 'like' | 'dislike' | 'maybe') => {
    if (currentFilterMode === 'all') {
      setFilteredCardIndices([]); // No specific indices needed for 'all'
      return;
    }
    const indices = Object.entries(currentActions)
      .filter(([_, action]) => action === currentFilterMode)
      .map(([index]) => parseInt(index));
    setFilteredCardIndices(indices);
  };

  //This useEffect updates filteredCardIndices when cardActions or filterMode changes.
  useEffect(() => {
    updateFilteredCardIndicesLogic(cardActions, filterMode);
  }, [cardActions, filterMode]);
  
  // Listen for changes to card actions from storage (e.g., if another part of app changes it)
  useEffect(() => {
    const checkForCardStatusChanges = async () => {
      const actions = await STORAGE.getAllCardActions(category, title);
      if (JSON.stringify(actions) !== JSON.stringify(cardActions)) {
        setCardActions(actions);
        updateFilteredCardIndicesLogic(actions, filterMode);
      }
    };
    
    const intervalId = setInterval(checkForCardStatusChanges, 1000);
    return () => clearInterval(intervalId);
  }, [cardActions, filterMode]);

  const cardsToDisplay = getEffectiveCardsList();

  const getCards = () => {
    if (!cardsToDisplay.length) {
        // Optionally, show a message if no cards match filters or for free user limit if applicable
        return (
            <View style={styles.cardsContainer}> 
                <Text style={styles.noCardsText}>
                    {filterMode !== 'all' ? 'No cards match your filter.' : 'No content available.'}
                </Text>
            </View>
        );
    }

    return cardsToDisplay.map(({ text, originalIndex }, displayIndex) => (
      <CardsContainer
        key={`${category}-${title}-${originalIndex}`} // More unique key
        text={decodeURIComponent(text)}
        category={category}
        title={title}
        cardIndex={originalIndex} // Pass the originalIndex for actions
        onSwipeComplete={() => {
          const maxPages = cardsToDisplay.length;
          if (pageNumber < maxPages) {
            scrollViewRef.current.scrollTo({
              x: width * pageNumber, // pageNumber is 1-based index of current card
              y: 0,
              animated: true,
            });
          }
        }}
      />
    ));
  };

  const getDots = () => {
    const numPages = cardsToDisplay.length;
    if (numPages <= 1 && Platform.OS === 'android') return null; // Don't show dots if only one page on Android
    if (numPages === 0) return null;

    let dots = [];
    const currentPageForDots = Math.min(pageNumber, numPages); // Ensure pageNumber is within bounds

    for (let i = 1; i <= numPages; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.footerDot,
            {
              backgroundColor:
                i === currentPageForDots ? Colors.red : Colors.lightGray2,
            },
          ]}
        />
      );
    }
    return dots;
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

  return (
    <Modal animationType="slide" visible={cardsPageVisible}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Ionicons
            onPress={close} // Keep original close for the main modal
            name="close-sharp"
            size={moderateScale(32)}
            color={Colors.white}
          />

          <Text style={styles.headerTitle}>
            {
              categoriesStore.categories[category][
                Object.keys(categoriesStore.categories[category])[
                  parseInt(title)
                ]
              ].name
            }
          </Text>

          <Entypo
            onPress={async () => {
              if (categoriesStore.categories[category][title].manual) {
                await Share.share({
                  message: decodeURIComponent(
                    categoriesStore.categories[category][title].texts[
                      categoriesStore.categories[category][title].manualCount
                    ][pageNumber - 1] +
                      "\n\n" +
                      "via Winspire App: www.winspire.app"
                  ),
                });
              } else {
                await Share.share({
                  message: decodeURIComponent(
                    categoriesStore.categories[category][title].texts[
                      pageNumber - 1
                    ] +
                      "\n\n" +
                      "via Winspire App: www.winspire.app"
                  ),
                });
              }
            }}
            name="share"
            size={moderateScale(28)}
            color={Colors.white}
          />
        </View>

        {showPageNumberContainer && (
          <View style={styles.pageNumberContainer}>
            <Text style={styles.pageNumberText}>
              {pageNumber} / {cardsToDisplay.length}
            </Text>
          </View>
        )}

        <ScrollView
          horizontal
          pagingEnabled
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          onScroll={async (event) => {
            const currentPage = Math.round(
              event.nativeEvent.contentOffset.x / width
            );

            setPageNumber(currentPage + 1);

            if (
              currentPage === cardsToDisplay.length - 1
            ) {
              await STORAGE.setCategoryDone(category, parseInt(title));

              checkCategoryDone();
            }
          }}
        >
          {getCards()}
        </ScrollView>

        <View style={styles.footerContainer}>
          <View style={styles.footerDotsContainer}>{getDots()}</View>

          <View style={styles.footerButtonsContainer}>
            {pageNumber > 1 ? (
              <Pressable
                onPress={() => {
                  scrollViewRef.current.scrollTo({
                    x: width * (pageNumber - 2),
                    y: 0,
                    animated: true,
                  });
                }}
                style={[
                  styles.footerButton,
                  { backgroundColor: Colors.lightGray },
                ]}
              >
                <Text style={styles.footerButtonText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  close();
                }}
                style={[
                  styles.footerButton,
                  { backgroundColor: Colors.lightGray },
                ]}
              >
                <Text style={styles.footerButtonText}>Home</Text>
              </Pressable>
            )}

            {pageNumber < cardsToDisplay.length ? (
              <Pressable
                onPress={() => {
                  scrollViewRef.current.scrollTo({
                    x: width * pageNumber, // pageNumber is 1-based index
                    y: 0,
                    animated: true,
                  });
                }}
                style={[styles.footerButton, { backgroundColor: Colors.red }]}
              >
                <Text style={styles.footerButtonText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  close();
                }}
                style={[styles.footerButton, { backgroundColor: Colors.red }]}
              >
                <Text style={styles.footerButtonText}>Done</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.footerSeperator} />
        </View>
      </View>
    </Modal>
  );
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },

  headerContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 2,
    height: verticalScale(120),
    backgroundColor: Colors.black,
    borderBottomColor: Colors.gray,
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingTop: Platform.OS === "ios" ? verticalScale(40) : 0,
  },

  headerTitle: {
    width: "70%",
    textAlign: "center",
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(24),
  },

  pageNumberContainer: {
    zIndex: 99,
    position: "absolute",
    alignItems: "center",
    top: verticalScale(130),
    justifyContent: "center",
    height: verticalScale(22),
    right: horizontalScale(10),
    width: horizontalScale(52),
    borderRadius: moderateScale(10),
    backgroundColor: Colors.lightGray2,
  },

  pageNumberText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(14),
  },

  cardsContainer: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(532),
    backgroundColor: Colors.cardBackground,
  },

  footerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: verticalScale(20),
    paddingHorizontal: horizontalScale(20),
    height: Platform.OS === "ios" ? verticalScale(220) : verticalScale(200),
  },

  footerDotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(6),
    justifyContent: "center",
  },

  footerDot: {
    height: verticalScale(8),
    width: horizontalScale(8),
    borderRadius: moderateScale(8),
  },

  footerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(40),
    justifyContent: "space-between",
    marginBottom: Platform.OS === "ios" ? verticalScale(88) : verticalScale(78),
  },

  footerButton: {
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(52),
    width: horizontalScale(120),
    borderRadius: moderateScale(30),
  },

  footerButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(32),
  },

  footerSeperator: {
    bottom: 0,
    width: width,
    position: "absolute",
    height: verticalScale(80),
    backgroundColor: Colors.cardSeperator,
  },
  noCardsText: { 
    color: Colors.white,
    fontSize: moderateScale(18),
    fontFamily: 'SFProMedium',
    textAlign: 'center',
    padding: 20,
  },
});
