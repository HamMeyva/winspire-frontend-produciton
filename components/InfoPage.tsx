import {
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

// constants
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

// components
import GoAnnualModal from "@/components/GoAnnualModal";

// utils
import { STORAGE } from "@/utils/storage";

const { width, height } = Dimensions.get("window");

export default function InfoPage({
  closeBottomSheet,
  triggerLimitedTimeOffer,
}: {
  closeBottomSheet: () => void;
  triggerLimitedTimeOffer?: () => void;
}) {
  const [goAnnualModalVisible, setGoAnnualModalVisible] = useState(false);

  const [subscriptionType, setSubscriptionType] = useState("");
  const [offerings, setOfferings] = useState<any>({});

  const getOfferings = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  const getCustomerInfo = async () => {
    // Placeholder for future IAP implementation
    return null;
  };

  useEffect(() => {
    getOfferings();
    getCustomerInfo();
  }, []);

  const handleCloseGoAnnualModal = (purchased?: boolean) => {
    setGoAnnualModalVisible(false);
    if (!purchased && triggerLimitedTimeOffer) {
      triggerLimitedTimeOffer();
    }
  };

  return (
    <BottomSheet
      handleStyle={{
        backgroundColor: Colors.darkGray,
        borderTopLeftRadius: moderateScale(15),
        borderTopRightRadius: moderateScale(15),
      }}
      snapPoints={["62%"]}
      enablePanDownToClose
      enableDynamicSizing={false}
      onClose={() => closeBottomSheet()}
      handleIndicatorStyle={{ backgroundColor: Colors.white }}
    >
      <BottomSheetView
        style={styles.bottomSheetContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          <Text style={styles.titleText}>
            WINSPIRE: LIFE HACKS FOR WINNERS
          </Text>

          <Text style={styles.infoText}>
            This app is designed to give you a daily boost of inspiration and motivation. Each day, you'll receive curated content to help you reflect, learn, and grow.
          </Text>
          <Text style={styles.infoText}>
            Use it to start your day on a positive note, find new perspectives, or simply take a moment for yourself. The more consistently you engage, the more you'll discover its benefits.
          </Text>
          <Text style={styles.infoText}>
            Unlock your full potential and make every day a step towards a better you. Ready to get started?
          </Text>
        </ScrollView>

        <View style={styles.buttonRowContainer}>
          <Pressable
            onPress={() => closeBottomSheet()}
            style={[styles.button, styles.gotItButton]}
          >
            <Text style={[styles.gotItButtonText]}>
              Got It!
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setGoAnnualModalVisible(true)}
            style={[styles.button, styles.goAnnualButton]}
          >
            <Text style={[styles.goAnnualButtonText]}>
              Go Annual & Save
            </Text>
          </Pressable>
        </View>

        {goAnnualModalVisible && (
          <GoAnnualModal
            goAnnualModalVisible={goAnnualModalVisible}
            close={handleCloseGoAnnualModal}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: Colors.darkGray,
    paddingHorizontal: horizontalScale(20),
    paddingTop: verticalScale(20),
    paddingBottom: Platform.OS === "ios" ? verticalScale(40) : verticalScale(20), // Adjust padding for buttons
  },
  scrollContentContainer: {
    alignItems: "center",
    gap: verticalScale(15),
    paddingBottom: verticalScale(20), // Space before buttons
  },
  titleText: {
    color: "white",
    fontFamily: "SFProBold",
    fontSize: moderateScale(18),
    textAlign: "center",
  },
  infoText: {
    color: "white",
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
    textAlign: "center",
    width: "95%",
  },
  buttonRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(10), // Space above buttons
    marginBottom: verticalScale(Platform.OS === 'ios' ? 20 : 10), // Ensure buttons are visible above notch/gestures
  },
  button: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(50),
    borderRadius: moderateScale(25),
  },
  gotItButton: {
    backgroundColor: Colors.gray, // Changed to a less prominent color
  },
  gotItButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(16),
  },
  goAnnualButton: {
    backgroundColor: Colors.white,
  },
  goAnnualButtonText: {
    color: Colors.black,
    fontFamily: "SFProBold",
    fontSize: moderateScale(16),
  },
});
