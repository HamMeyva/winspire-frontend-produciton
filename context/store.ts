import { makeAutoObservable } from "mobx";
import { STORAGE } from '@/utils/storage';

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
  // You can add other user-specific properties here, e.g., email, etc.

  constructor() {
    makeAutoObservable(this);
  }

  setIsSubscribed(status: boolean) {
    this.isSubscribed = status;
    console.log("DEBUG: User subscribed status updated in store:", status);
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
