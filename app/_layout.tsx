import { Image } from "expo-image";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { Platform, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

import "react-native-reanimated";

// utils
import { API } from "@/utils/api";

// context
import { categoriesStore, offeringsStore } from "@/context/store";
import { AuthProvider, useAuth } from "@/context/auth";
import { PurchaseProvider } from "@/context/purchase"; // PurchaseProvider handles RC init
import { userStore } from "../context/store"; // Import userStore

SplashScreen.preventAutoHideAsync();

// Authentication navigation handler component
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [initialRouteChecked, setInitialRouteChecked] = useState(false);

  // Check for dev skip flag in AsyncStorage
  useEffect(() => {
    const checkDevSkipFlag = async () => {
      try {
        const devSkipFlag = await AsyncStorage.getItem('DEV_SKIP_TO_LOGIN');
        if (devSkipFlag === 'true') {
          // Use the proper MobX action to set developer mode
          userStore.setDevModeOverride(true);
          console.log('DEV: Developer mode activated from stored flag');
        }
      } catch (error) {
        console.error('Error checking dev skip flag:', error);
      }
    };
    
    checkDevSkipFlag();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // Check if we've done the initial route check
    if (!initialRouteChecked) {
      // Mark initial check as done
      setInitialRouteChecked(true);
      
      // Check if we have a dev mode override
      const hasDevOverride = userStore.devModeOverride;
      
      // If we're in dev mode and logged in, go directly to the main page
      if (hasDevOverride && user) {
        console.log('DEV: Initial navigation - Developer mode active, going to main page');
        if (segments[0] !== undefined) {
          router.replace('/');
        }
        return; // Skip all other navigation checks
      }
      
      // Implement the correct flow: Free trial screen → Purchase screen → Login (if bought/started trial)
      // First, check if user is subscribed (from userStore)
      const isSubscribed = userStore.isSubscribed;
      
      // If user is subscribed but not logged in, redirect to login
      if (isSubscribed && !user && segments[0] !== 'login') {
        router.replace('/login');
      }
      // If user is subscribed and logged in, but on login page, redirect to main page
      else if (isSubscribed && user && segments[0] === 'login') {
        router.replace('/');
      }
      // If user is not subscribed, redirect to main page (which will show subscription screens)
      else if (!isSubscribed && segments[0] !== undefined && segments[0] !== 'login') {
        router.replace('/');
      }
      // If user is logged in and subscribed but not on main page, redirect to main page
      else if (user && isSubscribed && segments[0] === undefined) {
        router.replace('/');
      }
    }
  }, [isLoading, user, segments, router, initialRouteChecked, userStore.isSubscribed, userStore.devModeOverride]);
  
  // Additional navigation checks for subsequent navigation
  useEffect(() => {
    if (isLoading || !initialRouteChecked) return;
    
    // Check if we have a dev mode override
    const hasDevOverride = userStore.devModeOverride;
    
    // If we're in dev mode and logged in, don't redirect to subscription screens
    if (hasDevOverride && user) {
      console.log('DEV: Developer mode active - bypassing subscription checks');
      return; // Skip all other navigation checks
    }
    
    // Protected route access control - only allow access if user is logged in AND subscribed
    const isInProtectedRoute = segments[0] !== 'login' && segments[0] !== undefined;
    if (isInProtectedRoute) {
      // If not subscribed, redirect to main page (which will show subscription screens)
      if (!userStore.isSubscribed) {
        router.replace('/');
      }
      // If subscribed but not logged in, redirect to login
      else if (userStore.isSubscribed && !user) {
        router.replace('/login');
      }
    }
  }, [user, segments, isLoading, initialRouteChecked, userStore.isSubscribed, userStore.devModeOverride]);

  // Yükleme ekranı
  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212'}}>
        <Text style={{color: '#FFFFFF', fontSize: 16}}>Yükleniyor...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayout() {
  const [loaded] = useFonts({
    SFProBold: require("../assets/fonts/SFProBold.otf"),
    SFProMedium: require("../assets/fonts/SFProMedium.otf"),
  });
  
  // Add state to track API initialization
  const [apiInitialized, setApiInitialized] = useState(false);

  // Prefetch common images
  const prefetchImages = async () => {
    console.log("DEBUG: Prefetch images placeholder called");
    // Only prefetch images if there are actual categories with images
    if (categoriesStore.categories && Object.keys(categoriesStore.categories).length > 0) {
      for (let i of Object.keys(categoriesStore.categories)) {
        for (let j of Object.keys(categoriesStore.categories[i])) {
          if (
            categoriesStore.categories[i][j].images && 
            categoriesStore.categories[i][j].images.default
          ) {
            Image.prefetch(
              [
                categoriesStore.categories[i][j].images.default,
                categoriesStore.categories[i][j].images.completed,
              ],
              "memory-disk"
            );
          }
        }
      }
    }
  };

  // Initialize the new API structure
  const initializeApi = async () => {
    try {
      console.log("DEBUG: Initializing API for new backend");
      
      // Get the correct backend URL - use a dev mode flag to switch between environments
      // For development testing on physical device, use your computer's local IP address
      // For simulator testing, you can use localhost
      const isSimulator = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV;
      
      // Using correct production API URL
      // This is the actual working API endpoint
      const baseUrl = 'https://chefmagic.app';
      
      console.log(`DEBUG: Using API base URL: ${baseUrl}`);
      
      // For troubleshooting:
      // - If using a simulator, you could use 'http://localhost:5010'
      // - If on a physical device, you must use your computer's network IP
      // - Emulators might need to use '10.0.2.2:5010' (Android specific)
      
      console.log(`DEBUG: Using API base URL: ${baseUrl}`);
      
      // Initialize API client with backend URL
      await API.initialize(baseUrl);
      
      // Check API endpoints to verify connection and API structure
      console.log("DEBUG: Checking API endpoints");
      const endpointsWorking = await API.checkApiEndpoints();
      
      if (endpointsWorking) {
        console.log("DEBUG: API endpoints check successful");
      } else {
        console.error("DEBUG: API endpoints check failed - check your backend URL and ensure server is running");
        console.error(`DEBUG: Attempted connection to: ${baseUrl}`);
      }
      
      // Call placeholder API methods
      await API.setCategories();
      await API.setInfo();
      await API.setSocial();
      await API.setLimitedTimeSettings();
      
      // Set API as initialized
      setApiInitialized(true);
      console.log("DEBUG: API initialized successfully");
    } catch (error) {
      console.error("DEBUG: Error initializing API:", error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      console.log("DEBUG: Starting app initialization");
      
      try {
        await initializeApi();
        console.log("DEBUG: API initialization completed");
        
        // Only prefetch images if needed after API is initialized
        prefetchImages();
        console.log("DEBUG: prefetchImages called");
        
        console.log("DEBUG: App initialization completed");
      } catch (error) {
        console.error("DEBUG: Error during initialization:", error);
      }
    };
    
    initializeApp();
  }, []);

  // Determine when to hide splash screen based on minimal conditions
  if (loaded && apiInitialized) {
    console.log("DEBUG: All conditions met, hiding splash screen");
    console.log("DEBUG: Fonts loaded:", loaded);
    console.log("DEBUG: API initialized:", apiInitialized);
    console.log("DEBUG: userStore.isSubscribed (at splash hide time):", userStore.isSubscribed); 
    
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
  } else {
    console.log("DEBUG: Splash screen conditions not met");
    console.log("DEBUG: Fonts loaded:", loaded);
    console.log("DEBUG: API initialized:", apiInitialized);
    console.log("DEBUG: userStore.isSubscribed (while splash visible):", userStore.isSubscribed); 
    
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <AuthenticationGuard>
        <PurchaseProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </PurchaseProvider>
      </AuthenticationGuard>
    </AuthProvider>
  );
}

// Expo Router 2.x kullanımı için doğru export formatı
export default function Layout() {
  return <RootLayout />;
}
