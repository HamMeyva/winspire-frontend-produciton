import { makeAutoObservable } from "mobx";
import { STORAGE } from '@/utils/storage';
import AsyncStorage from "@react-native-async-storage/async-storage";

class CATEGORIES_STORE {
  categories: Record<string, any> = {};

  constructor() {
    makeAutoObservable(this);
  }

  update(newCategories: Record<string, any>) {
    this.categories = newCategories;
  }
}

export const categoriesStore = new CATEGORIES_STORE();

class INFO_STORE {
  info: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  update(newInfo: string[]) {
    this.info = newInfo;
  }
}

export const infoStore = new INFO_STORE();

class SOCIAL_STORE {
  social = {
    instagram: "",
    twitter: "",
    tiktok: "",
  };

  constructor() {
    makeAutoObservable(this);
  }

  update(newSocial: { instagram: string; twitter: string; tiktok: string }) {
    this.social = newSocial;
  }
}

export const socialStore = new SOCIAL_STORE();

class LIMITED_TIME_OFFER_STORE {
  limitedTimeCountdown = 60; // default 60 seconds
  limitedTimeFrequency = 10; // default 10 days

  constructor() {
    makeAutoObservable(this);
  }

  update(settings: {
    limitedTimeCountdown: number;
    limitedTimeFrequency: number;
  }) {
    this.limitedTimeCountdown = settings.limitedTimeCountdown;
    this.limitedTimeFrequency = settings.limitedTimeFrequency;
  }
}

export const limitedTimeOfferStore = new LIMITED_TIME_OFFER_STORE();

class OFFERINGS_STORE {
  offerings: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  update(newOfferings: any) {
    this.offerings = newOfferings;
  }
}

export const offeringsStore = new OFFERINGS_STORE();

class CONTENT_TYPE_STORE {
  constructor() {
    makeAutoObservable(this);
  }

  contentTypes: string[] = [];
  activeContentType: string = '';

  update(newContentTypes: string[]) {
    this.contentTypes = newContentTypes;
    if (newContentTypes.length > 0 && this.activeContentType === '') {
      this.activeContentType = newContentTypes[0];
    }
  }

  setActiveContentType(contentType: string) {
    this.activeContentType = contentType;
  }
}

export const contentTypeStore = new CONTENT_TYPE_STORE();

class USER_STORE {
  isSubscribed: boolean = false;
  userId: string | null = null;
  devModeOverride: boolean = false; // New flag for developer mode override
  // You can add other user-specific properties here, e.g., email, etc.

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    // Check for dev mode override on initialization
    this.checkDevModeOverride();
  }

  // MobX action to set dev mode override
  setDevModeOverride(value: boolean) {
    this.devModeOverride = value;
    if (value) {
      this.isSubscribed = true;
      console.log("DEBUG: Developer mode override set to", value);
    }
  }

  // Check for developer mode override in AsyncStorage
  async checkDevModeOverride() {
    try {
      const value = await AsyncStorage.getItem('DEV_SKIP_TO_LOGIN');
      if (value === 'true') {
        this.setDevModeOverride(true);
        console.log("DEBUG: Developer mode override enabled - subscription forced to true");
      }
    } catch (error) {
      console.error("Error checking dev mode override:", error);
    }
  }

  setIsSubscribed(status: boolean) {
    // If dev mode override is enabled, always keep subscription as true
    if (this.devModeOverride) {
      this.isSubscribed = true;
      console.log("DEBUG: Subscription status override - forced to true by dev mode");
    } else {
      this.isSubscribed = status;
      console.log("DEBUG: User subscribed status updated in store:", status);
    }
  }

  setUserData(userData: { id: string; [key: string]: any }) {
    this.userId = userData.id;
    // Potentially set other user-specific data here if needed
    console.log("DEBUG: User data set in store, userId:", this.userId);
  }

  clearUserData() {
    this.userId = null;
    this.isSubscribed = false;
    // Clear other user-specific data if any
    console.log("DEBUG: User data cleared from store.");
  }

  // You can add other actions here, e.g., setUserData(), clearUserData()
}

export const userStore = new USER_STORE();
