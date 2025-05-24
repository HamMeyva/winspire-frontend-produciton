import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import * as StoreReview from "expo-store-review";
import { Ionicons, FontAwesome6, AntDesign } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import ActionManagerScreen from "./ActionManagerScreen";
import { observer } from "mobx-react-lite";
import { socialStore, userStore } from "@/context/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// constants
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// components
import GoAnnualModal from "@/components/GoAnnualModal";
import HacksPreviewScreen from "@/components/HacksPreviewScreen";

// utils
import { STORAGE } from "@/utils/storage";

const { height } = Dimensions.get("screen");

const SettingsPage = ({
  closeBottomSheet,
  triggerLimitedTimeOffer,
  purchaseRegularAnnual,
  purchaseWeekly,
  regularAnnualPrice,
  weeklyPrice,
}: {
  closeBottomSheet: () => void;
  triggerLimitedTimeOffer?: () => void;
  purchaseRegularAnnual?: () => Promise<void>;
  purchaseWeekly?: () => Promise<void>;
  regularAnnualPrice?: string;
  weeklyPrice?: string;
}) => {
  const [messageSheetVisible, setMessageSheetVisible] = useState(false);
  const [goAnnualModalVisible, setGoAnnualModalVisible] = useState(false);
  const [actionManagerVisible, setActionManagerVisible] = useState(false);
  const [hacksPreviewVisible, setHacksPreviewVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Access subscription status from userStore
  const { isSubscribed } = userStore;
  
  // Get actual subscription type from storage
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);

  // Load subscription type on component mount
  useEffect(() => {
    const loadSubscriptionType = async () => {
      try {
        const type = await STORAGE.getSubscriptionType();
        setSubscriptionType(type);
      } catch (error) {
        console.error('Error loading subscription type:', error);
        setSubscriptionType(null);
      }
    };

    if (isSubscribed) {
      loadSubscriptionType();
    }
  }, [isSubscribed]);

  const handleCloseGoAnnualModal = (purchased?: boolean) => {
    setGoAnnualModalVisible(false);
    if (!purchased && triggerLimitedTimeOffer) {
      triggerLimitedTimeOffer();
    }
  };

  const resetAppData = async () => {
    try {
      setIsResetting(true);
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      
      // Reset user store using the clearUserData method
      userStore.clearUserData();
      
      // Close the bottom sheet
      closeBottomSheet();
      
      // Navigate to the root/index page which should show the purchase screen
      router.replace('/');
      
      console.log('App data has been reset successfully');
    } catch (error) {
      console.error('Error resetting app data:', error);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };
  
  const confirmReset = () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all app data and return you to the purchase screen. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetAppData
        }
      ]
    );
  };

  const handleContactUs = () => {
    Linking.openURL("mailto:contact@winspire.app");
    setContactModalVisible(false);
  };

  return (
    <BottomSheet
      snapPoints={["65%"]} // Adjusted snap point to accommodate new layout potentially
      enablePanDownToClose
      enableDynamicSizing={false}
      handleStyle={styles.handleStyle}
      onClose={() => closeBottomSheet()}
      handleIndicatorStyle={styles.handleIndicatorStyle}
    >
      <View style={styles.bottomSheetView}> 
        <ScrollView contentContainerStyle={styles.scrollContainerGlobal}>
          <BottomSheetView style={styles.bottomSheetInnerView}> 
            <Text style={styles.title}>Settings</Text>

            <View style={styles.optionsContainer}>
              {/* Reset App Data button */}
              <TouchableOpacity
                onPress={confirmReset}
                style={[styles.settingsButton, styles.resetButton]}
                disabled={isResetting}
              >
                <View style={styles.settingsButtonTextContainer}>
                  <Text style={styles.settingsButtonText}>
                    Reset App Data
                  </Text>
                  <Text style={styles.settingsButtonIcon}>🔄</Text>
                </View>
              </TouchableOpacity>
              
              {/* Show different content based on subscription status */}
              {isSubscribed && subscriptionType === 'annual' ? (
                // Thank you message for annual subscribers
                <View style={styles.thankYouContainer}>
                  <View style={styles.settingsButtonTextContainer}>
                    <Text style={styles.thankYouText}>
                      Thank you for your membership
                    </Text>
                    <Text style={styles.settingsButtonIcon}>❤️</Text>
                  </View>
                </View>
              ) : (
                // Go Annual button for weekly subscribers and free trial users
                <TouchableOpacity
                  onPress={() => setGoAnnualModalVisible(true)}
                  style={styles.settingsButton}
                >
                  <View style={styles.settingsButtonTextContainer}>
                    <Text style={styles.settingsButtonText}>
                      Go annual & Save %55
                    </Text>
                    <Text style={styles.settingsButtonIcon}>💰</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={async () => {
                  await Share.share({
                    title: "Winspire",
                    message:
                      Platform.OS === "android" ? "https://winspire.app" : "",
                    url: "https://winspire.app",
                  });
                }}
                style={styles.settingsButton}
              >
                <View style={styles.settingsButtonTextContainer}>
                  <Text style={styles.settingsButtonText}>Share the app</Text>
                  <Text style={styles.settingsButtonIcon}>🔗</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setContactModalVisible(true)}
                style={styles.settingsButton}
              >
                <View style={styles.settingsButtonTextContainer}>
                  <Text style={styles.settingsButtonText}>Send us a message</Text>
                  <FontAwesome6 name="comment-dots" size={moderateScale(20)} color={Colors.white} style={styles.iconStyle} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  // Ensure StoreReview is available before attempting to request a review
                  const isAvailable = await StoreReview.isAvailableAsync();
                  if (isAvailable) {
                    if (await StoreReview.hasAction()) { // Check if there is an action to perform
                      StoreReview.requestReview();
                    }
                  } else {
                    console.log("StoreReview is not available on this platform.");
                    // Optionally, provide feedback to the user if StoreReview is not available
                    Alert.alert("Rating not available", "Sorry, rating is not available on this device.");
                  }
                }}
                style={styles.settingsButton}
              >
                <View style={styles.settingsButtonTextContainer}>
                  <Text style={styles.settingsButtonText}>Rate us</Text>
                  <AntDesign name="heart" size={moderateScale(20)} color={Colors.white} style={styles.iconStyle} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Subscription Status Display */}
            <View style={styles.subscriptionStatusContainer}>
              <Text style={styles.subscriptionStatusText}>
                Subscription Status: {
                  userStore.isSubscribed 
                    ? userStore.subscriptionType 
                      ? userStore.subscriptionType.charAt(0).toUpperCase() + userStore.subscriptionType.slice(1) // Capitalize first letter
                      : "Premium" // Fallback if type is somehow null but subscribed
                    : "Free"
                }
              </Text>
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  if (socialStore.social.instagram) {
                    Linking.openURL(socialStore.social.instagram);
                  }
                }}
              >
                <AntDesign name="instagram" size={moderateScale(28)} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  if (socialStore.social.twitter) { // Assuming twitter field holds X URL
                    Linking.openURL(socialStore.social.twitter);
                  }
                }}
              >
                <FontAwesome6 name="x-twitter" size={moderateScale(26)} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => {
                  if (socialStore.social.tiktok) {
                    Linking.openURL(socialStore.social.tiktok);
                  }
                }}
              >
                <FontAwesome6 name="tiktok" size={moderateScale(24)} color="white" />
              </TouchableOpacity>
            </View>

            {/* Modals remain the same */}
            {goAnnualModalVisible && purchaseRegularAnnual && purchaseWeekly && regularAnnualPrice && weeklyPrice && (
              <GoAnnualModal
                goAnnualModalVisible={goAnnualModalVisible}
                close={handleCloseGoAnnualModal}
                purchaseRegularAnnual={purchaseRegularAnnual}
                purchaseWeekly={purchaseWeekly}
                regularAnnualPrice={regularAnnualPrice}
                weeklyPrice={weeklyPrice}
                showTimer={false}
              />
            )}
            <HacksPreviewScreen
              visible={hacksPreviewVisible}
              close={() => setHacksPreviewVisible(false)}
              onPurchasePress={() => {
                setHacksPreviewVisible(false);
                setGoAnnualModalVisible(true);
              }}
            />
            <Modal
              transparent={true}
              animationType="slide"
              visible={messageSheetVisible}
              onRequestClose={() => setMessageSheetVisible(false)}
            >
              <View style={styles.messageSheetView}>
                <TouchableOpacity 
                  style={styles.closeIcon}
                  onPress={() => setMessageSheetVisible(false)}
                >
                  <AntDesign name="close" size={24} color="black" />
                </TouchableOpacity>
                
                <Text style={styles.feedbackTitle}>Could you tell us your experience with the Winspire?</Text>
                <Text style={styles.feedbackSubtitle}>Please share your story in detail</Text>
                
                <TextInput
                  style={styles.feedbackInput}
                  multiline={true}
                  numberOfLines={6}
                  placeholder=""
                  placeholderTextColor="#999"
                />
                
                <View style={styles.paginationDots}>
                  <View style={[styles.paginationDot, { backgroundColor: '#e0e0e0' }]} />
                  <View style={[styles.paginationDot, { backgroundColor: '#ff0000' }]} />
                </View>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    // Submit feedback logic here
                    setMessageSheetVisible(false);
                  }}
                >
                  <Text style={styles.submitButtonText}>Submit feedback</Text>
                </TouchableOpacity>
              </View>
            </Modal>
            <ActionManagerScreen 
              visible={actionManagerVisible}
              onClose={() => setActionManagerVisible(false)}
            />
          </BottomSheetView>
        </ScrollView>
      </View>

      {/* Contact Us Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.centeredModalView}>
          <View style={styles.contactModalContent}>
            <Text style={styles.modalTitle}>Send us a message</Text>
            <TouchableOpacity style={styles.mailButton} onPress={handleContactUs}>
              <View style={styles.mailIconContainer}>
                <Ionicons name="mail" size={moderateScale(30)} color={Colors.white} />
              </View>
              <Text style={styles.mailButtonText}>Mail</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => setContactModalVisible(false)}
            >
              <Text style={styles.goBackButtonText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </BottomSheet>
  );
};

export default observer(SettingsPage);

const styles = StyleSheet.create({
  handleStyle: {
    backgroundColor: Colors.darkGray,
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },
  handleIndicatorStyle: { backgroundColor: Colors.white },
  bottomSheetView: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContainerGlobal: {
    flexGrow: 1,
    paddingBottom: verticalScale(50),
  },
  bottomSheetInnerView: {
    flex: 1,
    paddingVertical: verticalScale(20),
  },
  title: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(26),
    marginLeft: horizontalScale(24),
    marginBottom: verticalScale(15),
  },
  optionsContainer: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(20),
    paddingVertical: verticalScale(5),
  },
  settingsButton: {
    width: "100%",
    alignSelf: "center",
    height: verticalScale(65),
    justifyContent: "center",
    paddingHorizontal: horizontalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  resetButton: {
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  settingsButtonTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
  },
  settingsButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(18),
  },
  settingsButtonIcon: {
    fontSize: moderateScale(24),
  },
  thankYouContainer: {
    width: "100%",
    alignSelf: "center",
    height: verticalScale(65),
    justifyContent: "center",
    paddingHorizontal: horizontalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  thankYouText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(18),
  },
  sendMessageButton: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(15),
    paddingVertical: verticalScale(15),
    paddingHorizontal: horizontalScale(20),
    alignItems: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(20),
  },
  sendMessageButtonMainTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendMessageButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(18),
  },
  sendMessageButtonEmoji: {
    fontSize: moderateScale(18),
    marginLeft: horizontalScale(5),
  },
  sendMessageButtonSubText: {
    color: Colors.lightGray,
    fontFamily: "SFProRegular",
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },
  socialButtonsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "center",
    gap: horizontalScale(20),
    marginTop: verticalScale(20),
  },
  socialButton: {
    alignItems: "center",
    justifyContent: "center",
    width: horizontalScale(55),
    height: horizontalScale(55),
    backgroundColor: Colors.gray,
    borderRadius: moderateScale(28),
  },
  subscriptionStatusContainer: {
    alignItems: "center",
    marginVertical: verticalScale(15),
  },
  subscriptionStatusText: {
    color: Colors.lightGray,
    fontFamily: "SFProRegular",
    fontSize: moderateScale(16),
  },
  messageSheetView: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
    padding: moderateScale(20),
    alignItems: "center",
  },
  closeIcon: {
    position: "absolute",
    top: verticalScale(20),
    left: horizontalScale(20),
    zIndex: 10,
  },
  feedbackTitle: {
    fontSize: moderateScale(24),
    fontFamily: "SFProBold",
    textAlign: "center",
    marginTop: verticalScale(50),
    marginBottom: verticalScale(10),
    paddingHorizontal: horizontalScale(20),
  },
  feedbackSubtitle: {
    fontSize: moderateScale(16),
    fontFamily: "SFProRegular",
    color: "#666",
    textAlign: "center",
    marginBottom: verticalScale(30),
  },
  feedbackInput: {
    width: "90%",
    height: verticalScale(150),
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    textAlignVertical: "top",
    marginBottom: verticalScale(30),
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: verticalScale(30),
  },
  paginationDot: {
    width: horizontalScale(10),
    height: horizontalScale(10),
    borderRadius: horizontalScale(5),
    marginHorizontal: horizontalScale(5),
  },
  submitButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: verticalScale(15),
    borderRadius: moderateScale(25),
    width: "90%",
    alignItems: "center",
  },
  submitButtonText: {
    color: "black",
    fontSize: moderateScale(16),
    fontFamily: "SFProBold",
  },
  messageSheetContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(20),
  },
  messageSheetButtonContainer: {
    alignItems: "center",
    marginBottom: verticalScale(15),
  },
  messageSheetButtonImage: {
    width: horizontalScale(60),
    height: verticalScale(60),
    marginBottom: verticalScale(10),
  },
  messageSheetButtonTitle: {
    fontSize: moderateScale(16),
    fontFamily: "SFProMedium",
  },
  messageSheetCloseButton: {
    backgroundColor: Colors.gray,
    paddingVertical: verticalScale(15),
    width: "100%",
    alignItems: "center",
    borderColor: Colors.white,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(30),
  },
  messageSheetCloseButtonText: {
    color: Colors.white,
    fontFamily: "SFMedium",
    fontSize: moderateScale(20),
  },
  iconStyle: {
    marginLeft: horizontalScale(10),
  },
  centeredModalView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  contactModalContent: {
    width: "85%",
    backgroundColor: Colors.black,
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontFamily: "SFProBold",
    color: Colors.white,
    marginBottom: verticalScale(25),
  },
  mailButton: {
    alignItems: "center",
    marginBottom: verticalScale(25),
  },
  mailIconContainer: {
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(30),
    width: moderateScale(60),
    height: moderateScale(60),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  mailButtonText: {
    fontSize: moderateScale(16),
    fontFamily: "SFProMedium",
    color: Colors.white,
  },
  goBackButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: moderateScale(25),
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(50),
    width: '100%',
    alignItems: 'center',
  },
  goBackButtonText: {
    color: Colors.white,
    fontSize: moderateScale(16),
    fontFamily: "SFProBold",
  },
});
