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
} from "react-native";
import { useEffect, useState } from "react";
import * as StoreReview from "expo-store-review";
import { Ionicons, FontAwesome6, AntDesign } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import ActionManagerScreen from "./ActionManagerScreen";
import { observer } from "mobx-react-lite";
import { socialStore, userStore } from "@/context/store";

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
// import { STORAGE } from "@/utils/storage"; // STORAGE.getSubscriptionType() was used, but section removed.

const { height } = Dimensions.get("screen");

const SettingsPage = ({
  closeBottomSheet,
  triggerLimitedTimeOffer,
}: {
  closeBottomSheet: () => void;
  triggerLimitedTimeOffer?: () => void;
}) => {
  const [messageSheetVisible, setMessageSheetVisible] = useState(false);
  const [goAnnualModalVisible, setGoAnnualModalVisible] = useState(false);
  const [actionManagerVisible, setActionManagerVisible] = useState(false);
  const [hacksPreviewVisible, setHacksPreviewVisible] = useState(false);

  // Access subscription status from userStore
  const { isSubscribed } = userStore;
  
  // For testing/development purposes, hardcode subscription type
  // This would normally come from userStore.subscriptionType
  const [subscriptionType, setSubscriptionType] = useState('weekly');

  // const [subscriptionType, setSubscriptionType] = useState(""); // No longer needed
  // const [offerings, setOfferings] = useState<any>({}); // No longer used

  // const getOfferings = async () => { ... }; // Removed as offerings not used
  // const getCustomerInfo = async () => { ... }; // Removed as subscriptionType not used

  // useEffect(() => { ... }, []); // Removed as getOfferings and getCustomerInfo removed

  const handleCloseGoAnnualModal = (purchased?: boolean) => {
    setGoAnnualModalVisible(false);
    if (!purchased && triggerLimitedTimeOffer) {
      triggerLimitedTimeOffer();
    }
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
        <BottomSheetView style={styles.bottomSheetInnerView}> 
          <Text style={styles.title}>Settings</Text>

          <View style={styles.optionsContainer}>
            {/* Show Go Annual button only for weekly subscribers */}
            {isSubscribed && subscriptionType === 'weekly' ? (
              <TouchableOpacity
                onPress={() => setGoAnnualModalVisible(true)}
                style={styles.settingsButton}
              >
                <View style={styles.settingsButtonTextContainer}>
                  <Text style={styles.settingsButtonText}>
                    Go annual & save %55
                  </Text>
                  <Text style={styles.settingsButtonIcon}>💰</Text>
                </View>
              </TouchableOpacity>
            ) : isSubscribed && subscriptionType === 'annual' ? (
              <TouchableOpacity
                style={styles.settingsButton}
              >
                <View style={styles.settingsButtonTextContainer}>
                  <Text style={styles.settingsButtonText}>
                    You're on annual plan!
                  </Text>
                  <Text style={styles.settingsButtonIcon}>✅</Text>
                </View>
              </TouchableOpacity>
            ) : null}

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
              onPress={() => setMessageSheetVisible(true)} // This will open the message sheet
              style={styles.settingsButton}
            >
              <View style={styles.settingsButtonTextContainer}>
                <Text style={styles.settingsButtonText}>I have feedback</Text>
                <Text style={styles.settingsButtonIcon}>💌</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setMessageSheetVisible(true)} // This will also open the message sheet
            style={styles.sendMessageButton}
          >
            <View style={styles.sendMessageButtonMainTextContainer}>
                <Text style={styles.sendMessageButtonText}>Send us a message </Text>
                <Text style={styles.sendMessageButtonEmoji}>👋</Text>
            </View>
            <Text style={styles.sendMessageButtonSubText}>or need help</Text>
          </TouchableOpacity>

          {/* Subscription Status Display */}
          <View style={styles.subscriptionStatusContainer}>
            <Text style={styles.subscriptionStatusText}>
              Subscription Status: {isSubscribed ? "Premium" : "Free"}
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
          {goAnnualModalVisible && (
            <GoAnnualModal
              goAnnualModalVisible={goAnnualModalVisible}
              close={handleCloseGoAnnualModal}
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
      </View>
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
    backgroundColor: Colors.darkGray, // Main background of the sheet
  },
  bottomSheetInnerView: { // Added for padding and potential different background for content area
    flex: 1,
    paddingVertical: verticalScale(20),
    // backgroundColor: Colors.anotherGray, // If content area needs different bg
  },
  title: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(26),
    marginLeft: horizontalScale(24),
    marginBottom: verticalScale(15), // Added margin below title
  },
  optionsContainer: { // To group main settings options
    width: "90%",
    alignSelf: "center",
    backgroundColor: Colors.gray, // Background for the options group as in image
    borderRadius: moderateScale(15),
    marginBottom: verticalScale(20),
    paddingVertical: verticalScale(5), // Padding inside the options container
  },
  settingsButton: {
    width: "100%", // Takes full width of optionsContainer
    alignSelf: "center",
    height: verticalScale(65), // Adjusted height
    // backgroundColor: Colors.gray, // Moved to optionsContainer
    // borderRadius: moderateScale(15), // Moved to optionsContainer or remove if items are borderless within group
    // marginTop: verticalScale(12), // Removed, handled by optionsContainer padding/margins
    justifyContent: 'center',
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
    fontFamily: "SFProBold", // Assuming SFProBold, adjust if needed
    fontSize: moderateScale(18), // Adjusted font size
  },
  settingsButtonIcon: {
    fontSize: moderateScale(24), // Adjusted icon size
  },
  sendMessageButton: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: Colors.gray, // Specific background for this button
    borderRadius: moderateScale(15),
    paddingVertical: verticalScale(15),
    paddingHorizontal: horizontalScale(20),
    alignItems: 'center', // Center content horizontally
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
    color: Colors.lightGray, // Lighter color for subtext
    fontFamily: "SFProRegular", // Assuming SFProRegular, adjust if needed
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },
  socialButtonsContainer: {
    flexDirection: "row",
    alignSelf: "center",
    justifyContent: "center",
    gap: horizontalScale(20), // Increased gap
    // position: "absolute", // Removed absolute positioning to flow naturally
    // bottom: verticalScale(16), // Removed
    marginTop: verticalScale(20), // Added margin to push it down
  },
  socialButton: {
    alignItems: "center",
    justifyContent: "center",
    width: horizontalScale(55), // Adjusted size
    height: horizontalScale(55), // Adjusted size
    backgroundColor: Colors.gray, // Background for social buttons
    borderRadius: moderateScale(28), // Adjusted for new size
    // Removed shadow for a flatter look as in design, can be added back if needed
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
  // Styles for MessageSheet Modal (mostly unchanged, review if needed)
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
});
