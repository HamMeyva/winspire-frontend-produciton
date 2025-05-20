// import { initializeApp } from "firebase/app";
// import { collection, getDocs, getFirestore } from "firebase/firestore";

// context
import {
  categoriesStore,
  infoStore,
  limitedTimeOfferStore,
  socialStore,
} from "@/context/store";

// utils
import { STORAGE } from "@/utils/storage";
import { ApiClient } from "@/utils/apiClient";

// Helper function to check if a value is empty (null, undefined, empty string, empty array, empty object)
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

// Firebase configuration removed - to be replaced with new API configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyASt20vMUJUwK7b4TJDFgPjKk_XN237xwQ",
//   authDomain: "winspire-618ec.firebaseapp.com",
//   projectId: "winspire-618ec",
//   storageBucket: "winspire-618ec.firebasestorage.app",
//   messagingSenderId: "130624227936",
//   appId: "1:130624227936:web:0fcbddb391d55dcbcb9105",
//   measurementId: "G-KY8XZN789H",
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// Placeholder data - to be replaced with actual data from new API
const placeholderCategories: Record<string, any> = {};
const placeholderInfo: string[] = [];
const placeholderSocial = { instagram: "", twitter: "", tiktok: "" };
const placeholderOffers = { limitedTimeCountdown: 60, limitedTimeFrequency: 10 };
// Default placeholder content types from the model
const placeholderContentTypes = ['hack', 'tip', 'hack2', 'tip2', 'quote'];

export const API = {
  // Function to initialize API with new backend
  initialize: async (baseUrl: string) => {
    console.log("API.initialize: Initializing connection to new backend API");
    ApiClient.initialize(baseUrl);
    return true;
  },
  
  // Helper function to check API endpoints
  checkApiEndpoints: async (): Promise<boolean> => {
    console.log("DEBUG: API.checkApiEndpoints: Checking available API endpoints");
    try {
      // Try to access API root 
      const rootResponse = await ApiClient.get('/');
      console.log("DEBUG: API Root Response:", rootResponse);
      
      // Try to access categories endpoint
      const categoriesResponse = await ApiClient.get('/categories');
      console.log("DEBUG: Categories Endpoint Response:", categoriesResponse);
      
      // Try to access content types endpoint
      const contentTypesResponse = await ApiClient.get('/content/types');
      console.log("DEBUG: Content Types Response:", contentTypesResponse);
      
      // Try to retrieve test content
      try {
        interface ContentResponse {
          status: string;
          data: {
            content: Array<{
              _id: string;
              category: string;
              title?: string;
              body?: string;
              summary?: string;
              contentType?: string;
            }>;
          };
        }
        
        const testContentResponse = await ApiClient.get<ContentResponse>('/content?limit=1');
        console.log("DEBUG: Test Content Response (First content):", testContentResponse);
        
        if (testContentResponse && testContentResponse.data && 
            testContentResponse.data.content && 
            testContentResponse.data.content.length > 0) {
          
          const firstContentId = testContentResponse.data.content[0]._id;
          const firstContentCategoryId = testContentResponse.data.content[0].category;
          
          if (firstContentId && firstContentCategoryId) {
            console.log(`DEBUG: Found test content ID: ${firstContentId}, category ID: ${firstContentCategoryId}`);
            
            // Test getContentByCategory endpoint with real data
            try {
              const testCategoryContentResponse = await ApiClient.get<ContentResponse>(`/content/category/${firstContentCategoryId}`);
              console.log(`DEBUG: Test getContentByCategory response:`, testCategoryContentResponse);
              
              return true;
            } catch (categoryContentError) {
              console.error(`DEBUG: Error testing getContentByCategory endpoint:`, categoryContentError);
            }
          }
        }
      } catch (contentError) {
        console.error(`DEBUG: Error testing content endpoint:`, contentError);
      }
      
      return true;
    } catch (error) {
      console.error("DEBUG: API.checkApiEndpoints error:", error);
      return false;
    }
  },
  
  // Placeholder functions ready to be replaced with new API implementation
  setCategories: async () => {
    console.log("API.setCategories: Placeholder function called");
    try {
      // Ready to be replaced with actual implementation:
      // const categories = await ApiClient.get<Record<string, any>>('/categories');
      // categoriesStore.update(categories);
      
      // Placeholder implementation
      await STORAGE.resetCategoryDone(placeholderCategories);
      categoriesStore.update(placeholderCategories);
    } catch (error) {
      console.error("API.setCategories error:", error);
      categoriesStore.update(placeholderCategories);
    }
  },

  setInfo: async () => {
    console.log("API.setInfo: Placeholder function called");
    try {
      // Ready to be replaced with actual implementation:
      // const info = await ApiClient.get<string[]>('/app/info');
      // infoStore.update(info);
      
      // Placeholder implementation
      infoStore.update(placeholderInfo);
    } catch (error) {
      console.error("API.setInfo error:", error);
      infoStore.update(placeholderInfo);
    }
  },

  setSocial: async () => {
    console.log("API.setSocial: Placeholder function called");
    try {
      // Ready to be replaced with actual implementation:
      // const social = await ApiClient.get<{ instagram: string; twitter: string; tiktok: string }>('/app/social');
      // socialStore.update(social);
      
      // Placeholder implementation
      socialStore.update(placeholderSocial);
    } catch (error) {
      console.error("API.setSocial error:", error);
      socialStore.update(placeholderSocial);
    }
  },

  setLimitedTimeSettings: async () => {
    console.log("API.setLimitedTimeSettings: Placeholder function called");
    try {
      // Ready to be replaced with actual implementation:
      // const offers = await ApiClient.get<{ limitedTimeCountdown: number; limitedTimeFrequency: number }>('/app/offers');
      // limitedTimeOfferStore.update(offers);
      
      // Placeholder implementation
      limitedTimeOfferStore.update(placeholderOffers);
    } catch (error) {
      console.error("API.setLimitedTimeSettings error:", error);
      limitedTimeOfferStore.update(placeholderOffers);
    }
  },
  
  // New function to get content types from backend
  getContentTypes: async (): Promise<string[]> => {
    console.log("API.getContentTypes: Fetching content types from backend");
    try {
      // Use the existing initialized API client
      const response = await ApiClient.get<{status: string, data: string[]}>('/api/content/types');
      console.log("API.getContentTypes: Fetched response:", response);
      
      // Response formatını kontrol et
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        console.log("API.getContentTypes: Content types found:", response.data);
        return response.data;
      }
      
      console.log("API.getContentTypes: Using placeholder data");
      return placeholderContentTypes;
    } catch (error) {
      console.error("API.getContentTypes error:", error);
      // Return placeholder content types in case of error
      return placeholderContentTypes;
    }
  },
  
  getCategoriesByContentType: async (contentType: string): Promise<Record<string, any>> => {
    console.log(`API.getCategoriesByContentType: Fetching categories for ${contentType}`);
    try {
      const response = await ApiClient.get<{status: string, data: {categories: any[]}}>(`/api/categories/content-type/${contentType}`);
      console.log("API.getCategoriesByContentType: Fetched response:", response);
      
      if (response && response.status === 'success' && Array.isArray(response.data.categories)) {
        // Transform categories to the format expected by categoriesStore
        const formattedCategories: Record<string, any> = {};
        
        // Group categories by name
        response.data.categories.forEach(category => {
          const categoryName = category.name;
          
          // Initialize the category group if it doesn't exist
          if (!formattedCategories[categoryName]) {
            formattedCategories[categoryName] = {};
          }
          
          // Add this category to its group
          formattedCategories[categoryName][category._id] = {
            name: category.name,
            description: category.description,
            images: {
              default: category.icon || 'default-icon',
              completed: category.icon || 'default-icon'
            }
          };
        });
        
        console.log("API.getCategoriesByContentType: Formatted categories:", formattedCategories);
        console.log(`API.getCategoriesByContentType: Found ${Object.keys(formattedCategories).length} category groups with a total of ${response.data.categories.length} items`);
        return formattedCategories;
      }
      
      return {};
    } catch (error) {
      console.error(`API.getCategoriesByContentType error for ${contentType}:`, error);
      return {};
    }
  },
  
  getContentByCategory: async (categoryId: string, contentType?: string, status?: string): Promise<any[]> => {
    console.log(`DEBUG: API.getContentByCategory: Starting fetch for category ${categoryId} with contentType ${contentType || 'undefined'} and status ${status || 'published'}`);
    try {
      // Validate inputs
      if (isEmpty(categoryId)) {
        console.error('DEBUG: API.getContentByCategory: Invalid category ID');
        return [];
      }
      
      // Check for MongoDB ObjectId format (24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(categoryId)) {
        console.warn(`DEBUG: API.getContentByCategory: CategoryId "${categoryId}" does not appear to be a valid MongoDB ObjectId`);
        // Continue anyway as it might be a different ID format
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (contentType && !isEmpty(contentType)) {
        params.append('contentType', contentType);
      }
      
      // Always use published status unless explicitly overridden
      params.append('status', status || 'published');
      
      const url = `/api/content/category/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log(`DEBUG: API.getContentByCategory: Making request to: ${url}`);
      
      const response = await ApiClient.get<{status: string, data: {content: any[]}}>(url);
      
      // Verbose logging for all API responses to help debug
      console.log(`DEBUG: API Response status for ${url}: ${response.status}`);
      console.log(`DEBUG: API Response shape: ${JSON.stringify(Object.keys(response))}`);
      console.log(`DEBUG: API Response full data:`, response);
      
      // Check if response has the expected format
      if (response && response.status === 'success') {
        // Check for content in data.content (even if it's an empty array)
        if (response.data && response.data.content && Array.isArray(response.data.content)) {
          console.log(`DEBUG: API.getContentByCategory: Found ${response.data.content.length} content items`);
          return response.data.content;
        }
        
        // Some APIs might return content directly in data
        if (response.data && Array.isArray(response.data) && !isEmpty(response.data)) {
          console.log(`DEBUG: API.getContentByCategory: Found ${response.data.length} content items in data array`);
          return response.data;
        }
        
        // Check for other possible response formats
        if (response.data && typeof response.data === 'object') {
          for (const key in response.data) {
            const value = response.data[key as keyof typeof response.data];
            if (Array.isArray(value)) {
              console.log(`DEBUG: API.getContentByCategory: Found content in data.${key}`);
              return value;
            }
          }
        }
      }
      
      console.log(`DEBUG: API.getContentByCategory: No content found or invalid response format for category ${categoryId}`);
      return [];
    } catch (error: any) {
      // Check if this is a "No content found" 404 error - which we should treat as a normal empty result
      if (error.response && 
          error.response.status === 404 && 
          error.response.data && 
          error.response.data.message === "No content found for this category") {
        console.log(`DEBUG: API.getContentByCategory: No content found for category ${categoryId} with contentType ${contentType || 'undefined'} - returning empty array`);
        return [];
      }
      
      // For other errors, log them as actual errors
      console.error(`DEBUG: API.getContentByCategory error for category ${categoryId}:`, error);
      
      // Enhanced error logging
      if (error.response) {
        console.log(`DEBUG: API Error Response Status: ${error.response.status}`);
        console.log(`DEBUG: API Error Response Data:`, error.response.data);
        console.log(`DEBUG: API Error Response Headers:`, error.response.headers);
      } else if (error.request) {
        console.log(`DEBUG: API Error Request:`, error.request);
        console.log(`DEBUG: No response received from server`);
      } else {
        console.log(`DEBUG: API Error Message:`, error.message);
      }
      
      // Check for other 404 errors
      if (error.response && error.response.status === 404) {
        console.log(`DEBUG: No content found for category with ID ${categoryId} and contentType ${contentType || 'undefined'}`);
      }
      
      return [];
    }
  },
  
  // New function to send card action (like/dislike/maybe) to backend admin panel using the public endpoint
  sendCardAction: async (category: string, title: string, cardIndex: number, action: 'like' | 'dislike' | 'maybe'): Promise<boolean> => {
    console.log(`DEBUG: API.sendCardAction: Sending ${action} for category ${category}, title ${title}, card ${cardIndex}`);
    
    try {
      // If there's no category or title, don't proceed
      if (isEmpty(category) || isEmpty(title)) {
        console.error('DEBUG: API.sendCardAction: Invalid category or title');
        return false;
      }
      
      // Prepare payload
      const payload = {
        category,
        title,
        cardIndex,
        action,
        timestamp: Date.now()
      };
      
      // Use the new public endpoint that doesn't require authentication
      console.log(`DEBUG: API.sendCardAction: Using public endpoint for ${action} action`);
      const response = await ApiClient.post<{status: string}>('/api/content/action-public', payload);
      
      if (response && response.status === 'success') {
        console.log(`DEBUG: API.sendCardAction: Successfully sent ${action} to backend`);
        return true;
      }
      
      console.error(`DEBUG: API.sendCardAction: Failed to send ${action} to backend - API returned error`);
      return false;
    } catch (error) {
      console.error(`DEBUG: API.sendCardAction error:`, error);
      return false;
    }
  },
  
  // New function to mark prompts as viewed in backend
  markPromptViewed: async (category: string, title: string, cardIndex: number): Promise<boolean> => {
    console.log(`DEBUG: API.markPromptViewed: Marking prompt as viewed - category ${category}, title ${title}, card ${cardIndex}`);
    
    try {
      // Prepare payload
      const payload = {
        category,
        title,
        cardIndex,
        viewedTimestamp: Date.now()
      };
      
      // Send to backend
      const response = await ApiClient.post<{status: string}>('/api/content/viewed', payload);
      
      if (response && response.status === 'success') {
        console.log(`DEBUG: API.markPromptViewed: Successfully marked prompt as viewed`);
        return true;
      }
      
      console.error(`DEBUG: API.markPromptViewed: Failed to mark prompt as viewed - API returned error`);
      return false;
    } catch (error) {
      console.error(`DEBUG: API.markPromptViewed error:`, error);
      return false;
    }
  },
  
  // New function to mark prompts as expired (after 24 hours) and move to deleted section
  markPromptExpired: async (category: string, title: string, cardIndex: number): Promise<boolean> => {
    console.log(`DEBUG: API.markPromptExpired: This function is deprecated and no longer in use.`);
    console.log(`DEBUG: API.markPromptExpired: Prompt expiration is now handled automatically on the backend.`);
    return true; // Always return true to not break existing code
  },
  
  // New function to get limited number of prompts (10) per category
  getLimitedPrompts: async (categoryId: string, contentType?: string, limit: number = 10): Promise<any[]> => {
    console.log(`DEBUG: API.getLimitedPrompts: Fetching limited prompts for category ${categoryId}, limit: ${limit}`);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (contentType && !isEmpty(contentType)) {
        params.append('contentType', contentType);
      }
      // Always use published status
      params.append('status', 'published');
      params.append('limit', limit.toString());
      
      const url = `/api/content/category/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log(`DEBUG: API.getLimitedPrompts: Making request to: ${url}`);
      
      const response = await ApiClient.get<{status: string, data: {content: any[]}; limit: number}>(url);
      
      // Process the response similar to getContentByCategory
      if (response && response.status === 'success') {
        if (response.data && response.data.content && Array.isArray(response.data.content)) {
          console.log(`DEBUG: API.getLimitedPrompts: Found ${response.data.content.length} limited content items`);
          return response.data.content;
        }
        
        if (response.data && Array.isArray(response.data) && !isEmpty(response.data)) {
          console.log(`DEBUG: API.getLimitedPrompts: Found ${response.data.length} content items in data array`);
          return response.data;
        }
      }
      
      console.log(`DEBUG: API.getLimitedPrompts: No limited content found for category ${categoryId}`);
      return [];
    } catch (error) {
      console.error(`DEBUG: API.getLimitedPrompts error for category ${categoryId}:`, error);
      return [];
    }
  },
  
  // New function to report all expired prompts to backend
  reportExpiredPrompts: async (): Promise<boolean> => {
    console.log(`DEBUG: API.reportExpiredPrompts: This function is deprecated and no longer in use.`);
    console.log(`DEBUG: API.reportExpiredPrompts: Prompt expiration is now handled automatically on the backend.`);
    return true; // Always return true to not break existing code
  }
};
