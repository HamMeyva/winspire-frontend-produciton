import {
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
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

// context
import { userStore } from "@/context/store";

const { width } = Dimensions.get("window");

export default function InfoPage({
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
}) {
  const [goAnnualModalVisible, setGoAnnualModalVisible] = useState(false);
  const [infoBottomSheetPage, setInfoBottomSheetPage] = useState<number>(0);
  const [subscriptionType, setSubscriptionType] = useState<string>("weekly");
  
  // Access subscription status from userStore
  const { isSubscribed } = userStore;

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
      enableContentPanningGesture={false}
    >
      <BottomSheetView
        style={{
          flex: 1,
          backgroundColor: Colors.darkGray,
          paddingVertical: verticalScale(20),
        }}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: Colors.darkGray }}
          onMomentumScrollEnd={(event) => {
            const page = Math.round(event.nativeEvent.contentOffset.x / width);
            setInfoBottomSheetPage(page);
          }}
        >
          <View
            style={{
              width: width,
              alignItems: "center",
              gap: verticalScale(20),
            }}
          >
            <Text
              style={{
                color: "white",
                fontFamily: "SFProBold",
                fontSize: moderateScale(18),
              }}
            >
              WINSPIRE: LIFE HACKS FOR WINNERS
            </Text>

            <Text
              style={{
                width: "90%",
                color: "white",
                fontFamily: "SFProMedium",
                fontSize: moderateScale(16),
                textAlign: "center",
              }}
            >
              Winspire is designed to give you a daily boost of inspiration and motivation. Each day, you'll receive curated content to help you reflect, learn, and grow.
            </Text>
          </View>

          <View
            style={{
              width: width,
              alignItems: "center",
              gap: verticalScale(20),
            }}
          >
            <Text
              style={{
                width: "90%",
                color: "white",
                fontFamily: "SFProMedium",
                fontSize: moderateScale(16),
                textAlign: "center",
              }}
            >
              Use it to start your day on a positive note, find new perspectives, or simply take a moment for yourself. The more consistently you engage, the more you'll discover its benefits. Unlock your full potential and make every day a step towards a better you.
            </Text>
          </View>
        </ScrollView>

        {infoBottomSheetPage === 0 ? (
          <View
            style={{
              width: "100%",
              position: "absolute",
              alignItems: "center",
              bottom: Platform.OS === "ios" ? verticalScale(60) : verticalScale(40),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: horizontalScale(8),
              }}
            >
              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(10),
                }}
              />

              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.gray,
                  borderRadius: moderateScale(10),
                }}
              />
            </View>

            <Pressable
              onPress={() => closeBottomSheet()}
              style={{
                width: "85%",
                alignItems: "center",
                justifyContent: "center",
                height: verticalScale(50),
                marginTop: verticalScale(20),
                backgroundColor: Colors.white,
                borderRadius: moderateScale(25),
              }}
            >
              <Text
                style={{
                  color: Colors.black,
                  fontFamily: "SFProBold",
                  fontSize: moderateScale(16),
                }}
              >
                Got It!
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              position: "absolute",
              alignItems: "center",
              bottom: Platform.OS === "ios" ? verticalScale(60) : verticalScale(40),
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: horizontalScale(8),
              }}
            >
              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.gray,
                  borderRadius: moderateScale(10),
                }}
              />

              <View
                style={{
                  width: horizontalScale(10),
                  height: horizontalScale(10),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(10),
                }}
              />
            </View>

            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: horizontalScale(20),
              }}
            >
              <Pressable
                onPress={() => closeBottomSheet()}
                style={{
                  width: "48%",
                  alignItems: "center",
                  justifyContent: "center",
                  height: verticalScale(50),
                  marginTop: verticalScale(20),
                  backgroundColor: Colors.white,
                  borderRadius: moderateScale(25),
                }}
              >
                <Text
                  style={{
                    color: Colors.black,
                    fontFamily: "SFProBold",
                    fontSize: moderateScale(16),
                  }}
                >
                  Got It!
                </Text>
              </Pressable>

              {isSubscribed && subscriptionType === "weekly" && (
                <Pressable
                  onPress={() => setGoAnnualModalVisible(true)}
                  style={{
                    width: "48%",
                    alignItems: "center",
                    justifyContent: "center",
                    height: verticalScale(50),
                    marginTop: verticalScale(20),
                    backgroundColor: Colors.white,
                    borderRadius: moderateScale(25),
                  }}
                >
                  <Text
                    style={{
                      color: Colors.black,
                      fontFamily: "SFProBold",
                      fontSize: moderateScale(16),
                    }}
                  >
                    Go Annual & Save!
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {goAnnualModalVisible && purchaseRegularAnnual && purchaseWeekly && regularAnnualPrice && weeklyPrice && (
          <GoAnnualModal
            goAnnualModalVisible={goAnnualModalVisible}
            close={handleCloseGoAnnualModal}
            purchaseRegularAnnual={purchaseRegularAnnual}
            purchaseWeekly={purchaseWeekly}
            regularAnnualPrice={regularAnnualPrice}
            weeklyPrice={weeklyPrice}
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
