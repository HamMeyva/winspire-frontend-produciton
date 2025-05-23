import AsyncStorage from "@react-native-async-storage/async-storage";
import { userStore } from '@/context/store';

// Helper function to create user-specific keys
const getUserSpecificKey = (baseKey: string) => {
  const userId = userStore.userId || 'guest';
  return `${userId}_${baseKey}`;
};

export const STORAGE = {
  setCategoryDone: async (category: string, subCategoryID: number) => {
    const key = getUserSpecificKey(category + "." + subCategoryID);
    await AsyncStorage.setItem(key, "true");
  },

  getCategoryDone: async (category: string, subCategoryID: number) => {
    const key = getUserSpecificKey(category + "." + subCategoryID);
    const value = await AsyncStorage.getItem(key);
    return value;
  },

  resetCategoryDone: async (categories: any) => {
    const doneControlTime = await AsyncStorage.getItem(getUserSpecificKey("done-control-time"));

    if (doneControlTime === null) {
      await AsyncStorage.setItem(
        getUserSpecificKey("done-control-time"),
        new Date().getUTCDate().toString()
      );
    } else if (
      doneControlTime !== new Date().getUTCDate().toString() &&
      new Date().getUTCHours() >= 6
    ) {
      for (let category of Object.keys(categories)) {
        for (let subCategory of Object.keys(categories[category])) {
          await AsyncStorage.setItem(getUserSpecificKey(category + "." + subCategory), "false");
          await AsyncStorage.setItem(
            getUserSpecificKey("done-control-time"),
            new Date().getUTCDate().toString()
          );
        }
      }
    }
  },

  setCampaignLastDate: async () => {
    const now = Date.now();
    await AsyncStorage.setItem(getUserSpecificKey("campaignLastDate"), now.toString());
  },

  getCampaignLastDate: async () => {
    const value = await AsyncStorage.getItem(getUserSpecificKey("campaignLastDate"));
    return value;
  },

  setSubscriptionType: async (type: string) => {
    await AsyncStorage.setItem(getUserSpecificKey("subscriptionType"), type);
  },

  getSubscriptionType: async () => {
    const value = await AsyncStorage.getItem(getUserSpecificKey("subscriptionType"));
    return value;
  },

  setReviewShown: async () => {
    await AsyncStorage.setItem(getUserSpecificKey("reviewShown"), "true");
  },

  getReviewShown: async () => {
    const value = await AsyncStorage.getItem(getUserSpecificKey("reviewShown"));
    return value;
  },
  
  // Card swipe actions (like, dislike, maybe)
  setCardAction: async (category: string, title: string, cardIndex: number, action: 'like' | 'dislike' | 'maybe') => {
    // User-specific action key
    const actionKey = getUserSpecificKey(`card-action:${category}:${title}:${cardIndex}`);
    await AsyncStorage.setItem(actionKey, action);
    
    // User-specific detailed action key with timestamp
    const detailedKey = getUserSpecificKey(`card-action-detail:${category}:${title}:${cardIndex}`);
    const detailedValue = JSON.stringify({
      category,
      title,
      cardIndex,
      action,
      timestamp: Date.now(),
      synced: false // backend'e gönderildi mi?
    });
    
    await AsyncStorage.setItem(detailedKey, detailedValue);
  },

  getCardAction: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`card-action:${category}:${title}:${cardIndex}`);
    const value = await AsyncStorage.getItem(key);
    return value as 'like' | 'dislike' | 'maybe' | null;
  },
  
  // Get detailed action info
  getCardActionDetails: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`card-action-detail:${category}:${title}:${cardIndex}`);
    const value = await AsyncStorage.getItem(key);
    
    if (value) {
      return JSON.parse(value);
    }
    
    return null;
  },
  
  getAllCardActions: async (category: string, title: string) => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = getUserSpecificKey(`card-action:${category}:${title}:`);
    const actionKeys = keys.filter(key => key.startsWith(prefix));
    
    const actions: Record<number, 'like' | 'dislike' | 'maybe'> = {};
    
    await Promise.all(
      actionKeys.map(async (key) => {
        const cardIndex = parseInt(key.split(':')[3]);
        const action = await AsyncStorage.getItem(key);
        if (action === 'like' || action === 'dislike' || action === 'maybe') {
          actions[cardIndex] = action;
        }
      })
    );
    
    return actions;
  },
  
  // Get ALL card actions across all categories for admin panel
  getAllCardActionsForAdminPanel: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = getUserSpecificKey('card-action-detail:');
    const actionKeys = keys.filter(key => key.startsWith(prefix));
    
    const actions: any[] = [];
    
    await Promise.all(
      actionKeys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const actionDetail = JSON.parse(value);
            actions.push(actionDetail);
          } catch (error) {
            console.error('Error parsing action details:', error);
          }
        }
      })
    );
    
    // Sort by timestamp, newest first
    return actions.sort((a, b) => b.timestamp - a.timestamp);
  },
  
  // Mark a card action as synced with backend
  markCardActionSynced: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`card-action-detail:${category}:${title}:${cardIndex}`);
    const value = await AsyncStorage.getItem(key);
    
    if (value) {
      try {
        const actionDetail = JSON.parse(value);
        actionDetail.synced = true;
        await AsyncStorage.setItem(key, JSON.stringify(actionDetail));
      } catch (error) {
        console.error('Error marking action as synced:', error);
      }
    }
  },
  
  // Get all unsynced card actions to send to backend
  getUnsyncedCardActions: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = getUserSpecificKey('card-action-detail:');
    const actionKeys = keys.filter(key => key.startsWith(prefix));
    
    const unsyncedActions: any[] = [];
    
    await Promise.all(
      actionKeys.map(async (key) => {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const actionDetail = JSON.parse(value);
            if (!actionDetail.synced) {
              unsyncedActions.push(actionDetail);
            }
          } catch (error) {
            console.error('Error parsing action details:', error);
          }
        }
      })
    );
    
    return unsyncedActions;
  },
  
  clearCardActions: async (category: string, title: string) => {
    const keys = await AsyncStorage.getAllKeys();
    const actionPrefix = getUserSpecificKey(`card-action:${category}:${title}:`);
    const detailPrefix = getUserSpecificKey(`card-action-detail:${category}:${title}:`);
    
    const actionKeys = keys.filter(key => key.startsWith(actionPrefix) || key.startsWith(detailPrefix));
    
    if (actionKeys.length > 0) {
      await AsyncStorage.multiRemove(actionKeys);
    }
  },
  
  // Export all card actions as JSON string (for admin panel)
  exportCardActionsAsJSON: async () => {
    const actions = await STORAGE.getAllCardActionsForAdminPanel();
    return JSON.stringify(actions, null, 2);
  },

  // New functions for tracking prompt views and expiration

  // Record when a prompt was viewed with timestamp
  setPromptViewed: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`prompt-viewed:${category}:${title}:${cardIndex}`);
    const timestamp = Date.now();
    await AsyncStorage.setItem(key, timestamp.toString());
  },

  // Check if a prompt has been viewed
  getPromptViewedTimestamp: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`prompt-viewed:${category}:${title}:${cardIndex}`);
    const value = await AsyncStorage.getItem(key);
    return value ? parseInt(value) : null;
  },

  // Mark a prompt as expired (after 24 hours)
  setPromptExpired: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`prompt-expired:${category}:${title}:${cardIndex}`);
    await AsyncStorage.setItem(key, "true");
  },

  // Check if a prompt has expired
  getPromptExpired: async (category: string, title: string, cardIndex: number) => {
    // TEMPORARY FIX: Always return false to disable expiration
    // This ensures all published content is visible in the app
    // Original code was:
    // const key = `prompt-expired:${category}:${title}:${cardIndex}`;
    // const value = await AsyncStorage.getItem(key);
    // return value === "true";
    
    return false; // Return false so content is never considered expired
  },

  // Get all prompt views for a category with their timestamps
  getAllPromptViews: async (category: string, title: string) => {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = getUserSpecificKey(`prompt-viewed:${category}:${title}:`);
    const viewKeys = keys.filter(key => key.startsWith(prefix));
    
    const views: Record<number, number> = {}; // cardIndex -> timestamp
    
    await Promise.all(
      viewKeys.map(async (key) => {
        const cardIndex = parseInt(key.split(':')[3]);
        const timestamp = await AsyncStorage.getItem(key);
        if (timestamp) {
          views[cardIndex] = parseInt(timestamp);
        }
      })
    );
    
    return views;
  },

  // Check all prompts and mark those viewed >24h ago as expired
  checkAndMarkExpiredPrompts: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const viewKeys = keys.filter(key => key.startsWith(getUserSpecificKey('prompt-viewed:')));
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    await Promise.all(
      viewKeys.map(async (key) => {
        // Extract category, title, cardIndex from key
        const parts = key.split(':');
        if (parts.length === 4) {
          const [_, category, title, cardIndex] = parts;
          
          // Get timestamp when prompt was viewed
          const timestampStr = await AsyncStorage.getItem(key);
          if (timestampStr) {
            const timestamp = parseInt(timestampStr);
            
            // Check if it was viewed more than 24 hours ago
            if (now - timestamp >= oneDayMs) {
              // Mark as expired
              await STORAGE.setPromptExpired(category, title, parseInt(cardIndex));
            }
          }
        }
      })
    );
  },

  // Get the IDs of all expired prompts that need to be moved to "deleted" on backend
  getPromptsPendingDeletion: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const expiredKeys = keys.filter(key => key.startsWith(getUserSpecificKey('prompt-expired:')));
    
    const pendingDeletion: Array<{category: string, title: string, cardIndex: number}> = [];
    
    await Promise.all(
      expiredKeys.map(async (key) => {
        // Extract category, title, cardIndex from key
        const parts = key.split(':');
        if (parts.length === 4) {
          const [_, category, title, cardIndex] = parts;
          
          // Get if this expired prompt is already reported to backend
          const reportedKey = getUserSpecificKey(`prompt-deletion-reported:${category}:${title}:${cardIndex}`);
          const isReported = await AsyncStorage.getItem(reportedKey) === "true";
          
          if (!isReported) {
            pendingDeletion.push({
              category,
              title,
              cardIndex: parseInt(cardIndex)
            });
          }
        }
      })
    );
    
    return pendingDeletion;
  },

  // Mark a prompt as reported to backend for deletion
  setPromptDeletionReported: async (category: string, title: string, cardIndex: number) => {
    const key = getUserSpecificKey(`prompt-deletion-reported:${category}:${title}:${cardIndex}`);
    await AsyncStorage.setItem(key, 'true');
  },
  
  // Methods for tracking new content in categories
  setCategoryHasNewContent: async (category: string, index: number, hasNewContent: boolean) => {
    const key = getUserSpecificKey(`category_${category}_${index}_hasNewContent`);
    await AsyncStorage.setItem(key, hasNewContent ? 'true' : 'false');
  },
  
  getCategoryHasNewContent: async (category: string, index: number) => {
    const key = getUserSpecificKey(`category_${category}_${index}_hasNewContent`);
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  },
  
  clearCategoryHasNewContent: async (category: string, index: number) => {
    const key = getUserSpecificKey(`category_${category}_${index}_hasNewContent`);
    await AsyncStorage.removeItem(key);
  },

  resetAllSubCategoryProgress: async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userIdPrefix = userStore.userId ? `${userStore.userId}_` : "guest_";
      
      const keysToRemove = allKeys.filter(key => {
        if (key.startsWith(userIdPrefix)) {
          const baseKey = key.substring(userIdPrefix.length);
          // Check if baseKey matches the pattern "categoryName.subCategoryID"
          // where subCategoryID is a number (e.g., "Affirmations.0", "Mindfulness.12")
          const parts = baseKey.split('.');
          if (parts.length > 1) { // Ensures there's at least one '.'
            const lastPart = parts[parts.length - 1];
            // Check if the part after the last dot is a number
            if (!isNaN(parseInt(lastPart)) && Number.isInteger(parseFloat(lastPart))) {
              // This key matches the pattern for a subcategory done status
              return true;
            }
          }
        }
        return false;
      });

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log("DEBUG: Reset subcategory progress. Removed keys:", keysToRemove);
      }
    } catch (error) {
      console.error("ERROR: Failed to reset subcategory progress:", error);
    }
  },

  getLastDailyProgressResetDate: async () => {
    const key = getUserSpecificKey('last_daily_progress_reset_date');
    return await AsyncStorage.getItem(key);
  },

  setLastDailyProgressResetDate: async (date: string) => {
    const key = getUserSpecificKey('last_daily_progress_reset_date');
    await AsyncStorage.setItem(key, date);
  },
  
  // Store categories for a content type to track completion across content types
  storeCategoriesForContentType: async (contentType: string, categories: string[]) => {
    if (!categories || categories.length === 0) return;
    
    const key = getUserSpecificKey(`content_type_categories_${contentType}`);
    await AsyncStorage.setItem(key, JSON.stringify(categories));
    console.log(`DEBUG: Stored ${categories.length} categories for content type ${contentType}`);
  },
  
  // Get all categories for a specific content type
  getAllCategoriesForContentType: async (contentType: string) => {
    const key = getUserSpecificKey(`content_type_categories_${contentType}`);
    const value = await AsyncStorage.getItem(key);
    
    if (!value) return [];
    
    try {
      const categories = JSON.parse(value);
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error(`Error parsing categories for ${contentType}:`, error);
      return [];
    }
  },

  // Limited time offer frequency tracking
  setLimitedTimeOfferLastShown: async () => {
    const timestamp = Date.now().toString();
    const key = getUserSpecificKey('limited_time_offer_last_shown');
    await AsyncStorage.setItem(key, timestamp);
  },

  getLimitedTimeOfferLastShown: async () => {
    const key = getUserSpecificKey('limited_time_offer_last_shown');
    const value = await AsyncStorage.getItem(key);
    return value ? parseInt(value) : null;
  },

  // Check if limited time offer can be shown based on subscription status
  canShowLimitedTimeOffer: async () => {
    const lastShownTimestamp = await STORAGE.getLimitedTimeOfferLastShown();
    
    if (!lastShownTimestamp) {
      // Never shown before, so it can be shown
      return true;
    }

    const now = Date.now();
    const timeSinceLastShown = now - lastShownTimestamp;
    
    // Get subscription type
    const subscriptionType = await STORAGE.getSubscriptionType();
    
    if (!subscriptionType || subscriptionType === 'trial' || subscriptionType === 'free') {
      // Free trial users: Once per day (24 hours)
      const oneDayMs = 24 * 60 * 60 * 1000;
      return timeSinceLastShown >= oneDayMs;
    } else if (subscriptionType === 'weekly') {
      // Weekly subscribers: Once per week (7 days)
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      return timeSinceLastShown >= oneWeekMs;
    } else {
      // Annual subscribers: Don't show limited time offer
      return false;
    }
  },
};
