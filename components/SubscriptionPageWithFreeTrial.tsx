import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  PanResponder,
  Animated,
  ScrollView,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

// constants
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from "@/constants/Metrics";
import { Colors } from "@/constants/Colors";

const { width, height } = Dimensions.get("window");

export default function SubscriptionPageWithFreeTrial({
  purchase,
  pricePerWeek,
  restorePurchases,
}: {
  purchase: () => void;
  pricePerWeek: string;
  restorePurchases: () => void;
}) {
  const [page, setPage] = useState(0);
  const position = useRef(new Animated.Value(0)).current;
  
  // Create images array for easier rendering
  const images = [
    require("../assets/images/pages/page-1.png"),
    require("../assets/images/pages/page-2.png"),
    require("../assets/images/pages/page-3.png")
  ];

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow horizontal movement
        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          // Limit movement to prevent swiping past first or last image
          const newPosition = -page * width + gestureState.dx;
          if (newPosition <= 0 && newPosition >= -width * (images.length - 1)) {
            position.setValue(newPosition);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Determine if swipe was significant enough to change page
        if (Math.abs(gestureState.dx) > width / 3) {
          if (gestureState.dx > 0 && page > 0) {
            // Swipe right - go to previous page
            goToPage(page - 1);
          } else if (gestureState.dx < 0 && page < images.length - 1) {
            // Swipe left - go to next page
            goToPage(page + 1);
          } else {
            // Snap back to current page
            goToPage(page);
          }
        } else {
          // Not a significant swipe, snap back
          goToPage(page);
        }
      },
    })
  ).current;

  // Function to animate to a specific page
  const goToPage = (pageIndex: number) => {
    Animated.spring(position, {
      toValue: -pageIndex * width,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    setPage(pageIndex);
  };
  
  // Initialize the first page on component mount
  useEffect(() => {
    // Make sure the first image is visible
    position.setValue(0);
  }, []);

  const [privacyPolicySheetVisible, setPrivacyPolicySheetVisible] =
    useState(false);
  const [termsOfUseSheetVisible, setTermsOfUseSheetVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#111c61", Colors.black]}
        style={styles.modalBackground}
      />

      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>
            {page === 0
              ? "GENIUS LIFE HACKS"
              : page === 1
              ? "PRO DATING HACKS"
              : "TOP MONEY HACKS"}
          </Text>

          <Text style={styles.altTitle}>
            {page === 0
              ? "refreshed every 24 hours"
              : page === 1
              ? "proven to get more girls"
              : "designed to make you rich "}
          </Text>
        </View>

        <View style={styles.pagesContainer} {...panResponder.panHandlers}>
          <Animated.View 
            style={[
              styles.carouselContainer,
              { transform: [{ translateX: position }] }
            ]}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.pageContainer}>
                <Image
                  style={styles.pageImage}
                  resizeMode="cover"
                  source={image}
                />
              </View>
            ))}
          </Animated.View>
          
          {/* Manual navigation buttons (optional) */}
          <View style={styles.navButtonsContainer}>
            {page > 0 && (
              <TouchableOpacity 
                style={styles.navButton} 
                onPress={() => goToPage(page - 1)}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
            )}
            
            {page < images.length - 1 && (
              <TouchableOpacity 
                style={[styles.navButton, styles.navButtonRight]} 
                onPress={() => goToPage(page + 1)}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.dotContainer}>
          <View
            style={[
              styles.dot,
              { backgroundColor: page === 0 ? Colors.lightGray : Colors.gray },
            ]}
          />

          <View
            style={[
              styles.dot,
              { backgroundColor: page === 1 ? Colors.lightGray : Colors.gray },
            ]}
          />

          <View
            style={[
              styles.dot,
              { backgroundColor: page === 2 ? Colors.lightGray : Colors.gray },
            ]}
          />
        </View>

        <Text style={styles.infoText}>
          By tapping "Try For Free" you agree to{"\n"}our{" "}
          <Text
            onPress={() => {
              console.log("hey");

              setTermsOfUseSheetVisible(true);
            }}
            style={{ color: Colors.blue2 }}
          >
            terms of use
          </Text>{" "}
          and{" "}
          <Text
            onPress={() => setPrivacyPolicySheetVisible(true)}
            style={{ color: Colors.blue2 }}
          >
            privacy policy
          </Text>
        </Text>

        <TouchableOpacity onPress={purchase} style={styles.unlockButton}>
          <Text style={styles.unlockButtonText}>Try For Free 🚀</Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          3 days free, than {pricePerWeek} per week
        </Text>

        <View style={styles.footer}>
          <Text onPress={restorePurchases} style={styles.footerTexts}>
            Restore purchase
          </Text>
        </View>
      </View>

      {termsOfUseSheetVisible && (
        <BottomSheet
          snapPoints={["62%"]}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleStyle={styles.handleStyle}
          handleIndicatorStyle={styles.handleIndicatorStyle}
          onClose={() => setTermsOfUseSheetVisible(false)}
        >
          <View style={styles.bottomSheetView}>
            <BottomSheetView style={styles.bottomSheetView}>
              <Text style={styles.sheetTitle}>Winspire - Terms of Use</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.content}>
                  Last Updated: [01.04.2025]{"\n\n"}Welcome to Winspire! By
                  accessing or using our app, you agree to the following Terms
                  of Use. If you do not agree with these terms, please do not
                  use the app.{"\n\n"}1.⁠ ⁠General Information{"\n\n"}Winspire
                  is a mobile application that provides educational and
                  entertainment-oriented content including life hacks,
                  productivity tips, motivational quotes, and book insights. The
                  app is operated by [Sounday OÜ]. For questions, contact us at
                  contact@winspire.app.{"\n\n"}2.⁠ ⁠Eligibility{"\n\n"}You must
                  be at least 18 years old to use this app. If you are under 18,
                  you may only use Winspire under the supervision of a parent or
                  legal guardian.{"\n\n"}3.⁠ ⁠Subscription & Billing{"\n\n"}•
                  Winspire offers a 3-day free trial to new users.{"\n"}• After
                  the trial, you will be charged $6.49 weekly unless you cancel
                  before the trial ends.{"\n"}• Annual subscription options are
                  available:{"\n"}- Standard: $149.99/year{"\n"}- Limited Time
                  Offer: $99.99/year{"\n"}• All payments are processed via
                  RevenueCat.{"\n"}• Subscriptions automatically renew unless
                  cancelled at least 24 hours before the end of the current
                  period.{"\n"}• No refunds are provided for any subscription
                  fees once billed.{"\n\n"}4.⁠ ⁠Content Use Disclaimer{"\n\n"}•
                  All content is for educational and entertainment purposes
                  only.{"\n"}• Life hacks are not investment, financial, or
                  professional advice. Users act on the content at their own
                  discretion and risk.{"\n"}• Book excerpts fall under the "fair
                  use" doctrine and are provided for educational purposes.
                  {"\n\n"}5.⁠ ⁠User Data & Account{"\n\n"}• We do not collect
                  personal information like name or email.{"\n"}• We only store:
                  {"\n"}- Which content categories the user has completed{"\n"}•
                  The date the user finished all content{"\n"}• You are
                  responsible for maintaining the confidentiality of your
                  account on your device.{"\n\n"}6.⁠ ⁠Prohibited Use{"\n\n"}You
                  agree not to:{"\n"}- Reproduce, duplicate, copy or exploit any
                  part of the app for commercial purposes without our
                  permission.{"\n"}- Violate any applicable law while using the
                  app.{"\n\n"}7.⁠ ⁠Intellectual Property{"\n\n"}All content,
                  design, logos, and visuals in Winspire are the property of
                  Winspire or its licensors and protected by copyright laws.
                  {"\n\n"}8.⁠ ⁠Termination{"\n\n"}We reserve the right to
                  suspend or terminate your access to the app at any time for
                  violation of these terms.{"\n\n"}9.⁠ ⁠Contact{"\n\n"}For
                  support or legal questions, email: contact@winspire.app
                </Text>

                <View style={styles.seperator} />
              </ScrollView>
            </BottomSheetView>
          </View>
        </BottomSheet>
      )}

      {privacyPolicySheetVisible && (
        <BottomSheet
          snapPoints={["62%"]}
          enablePanDownToClose
          enableDynamicSizing={false}
          handleStyle={styles.handleStyle}
          handleIndicatorStyle={styles.handleIndicatorStyle}
          onClose={() => setPrivacyPolicySheetVisible(false)}
        >
          <View style={styles.bottomSheetView}>
            <BottomSheetView style={styles.bottomSheetView}>
              <Text style={styles.sheetTitle}>Winspire - Privacy Policy</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.content}>
                  Last Updated: [01.04.2025]{"\n\n"}Welcome to Winspire, a
                  mobile app designed to provide educational and entertaining
                  life hacks and curated content. This Privacy Policy explains
                  how we handle your data and protect your privacy.{"\n\n"}1.⁠
                  ⁠Who We Are{"\n\n"}Winspire is operated by [Sounday OÜ].
                  {"\n"}Contact: contact@winspire.app{"\n\n"}2.⁠ ⁠What We
                  Collect{"\n\n"}We respect your privacy and collect minimal
                  user data.{"\n\n"}Specifically, we only store:{"\n"}• The
                  categories you have fully completed in the app.{"\n"}• The
                  date you completed all categories.{"\n\n"}We do not collect
                  any personally identifiable information (PII), such as your
                  name, email, IP address, or device ID.{"\n\n"}3.⁠ ⁠Third-Party
                  Services{"\n\n"}We use the following services:{"\n\n"}•
                  Firebase – for anonymous data storage and app performance
                  analytics.{"\n"}• OpenAI API – to generate some content
                  dynamically.{"\n"}• RevenueCat – for managing subscriptions
                  and payments.{"\n\n"}These services may have their own privacy
                  policies, and we recommend reviewing them if you wish to
                  understand how they handle data.{"\n\n"}4.⁠ ⁠Data Usage
                  {"\n\n"}The data we collect is used only to:{"\n"}• Track your
                  in-app progress{"\n"}• Unlock content based on your completion
                  {"\n"}• Improve app experience{"\n\n"}We do not sell, share,
                  or transfer your data to any third party.{"\n\n"}5.⁠ ⁠Book
                  Quotes and Fair Use{"\n\n"}Quotes used in the "Tips" section
                  are sourced from publicly available books and used under the
                  "Fair Use" doctrine for educational and non-commercial
                  purposes. If you are a rights holder and believe your content
                  has been misused, please contact us at contact@winspire.app.
                  {"\n\n"}
                  6.⁠ ⁠Life Hacks Disclaimer{"\n\n"}All life hacks and
                  suggestions are meant to be entertaining and educational only.
                  They do not constitute professional, financial, legal, or
                  medical advice. Especially for "Money Hacks," Winspire does
                  not provide investment recommendations. Use of the hacks is
                  entirely at your own risk.{"\n\n"}7.⁠ ⁠Children's Privacy
                  {"\n\n"}Winspire is intended for users over the age of 18. If
                  under 18, you must use the app under parental or legal
                  guardian supervision.
                  {"\n\n"}8.⁠ ⁠Subscriptions and Payments{"\n\n"}• Subscriptions
                  are managed via RevenueCat.{"\n"}• Free 3-day trial is
                  available.{"\n"}• After the trial, users are charged $6.49 per
                  week, unless cancelled.{"\n"}• Annual plans are available:
                  {"\n"}- Standard: $149.99{"\n"}- Limited Time Offer: $99.99
                  {"\n"}• No refunds are provided once a subscription is billed.
                  {"\n"}• Subscriptions renew automatically unless cancelled.  
                  {"\n\n"}9.⁠ ⁠Your Rights{"\n\n"}You have the right to: {"\n"}•
                  Request deletion of your usage data (the limited data we
                  store){"\n"}• Ask questions about how your data is managed
                  {"\n\n"}To make a request, email us at contact@winspire.app
                  {"\n\n"}10.⁠ ⁠Changes to This Policy{"\n\n"}We may update this
                  Privacy Policy to reflect changes in our practices or for
                  legal reasons. You will be notified of significant updates
                  through the app.{"\n\n"}11.⁠ ⁠Contact{"\n\n"}For
                  privacy-related questions, reach out at: contact@winspire.app
                </Text>

                <View style={styles.seperator} />
              </ScrollView>
            </BottomSheetView>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: verticalScale(60),
  },

  modalBackground: {
    top: 0,
    left: 0,
    right: 0,
    width: width,
    height: height,
    position: "absolute",
  },

  closeIcon: {
    position: "absolute",
    top: verticalScale(68),
    right: horizontalScale(20),
  },

  header: { gap: verticalScale(12), alignItems: "center" },

  title: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(28),
  },

  altTitle: {
    color: Colors.lightGray,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
  },

  pagesContainer: { 
    height: height * 0.5, 
    marginTop: verticalScale(16),
    position: "relative",
    overflow: "hidden"
  },
  
  carouselContainer: {
    flexDirection: "row",
    width: width * 3, // Width of all pages combined
    height: "100%",
  },

  pageContainer: {
    width: width,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  pageImage: {
    width: width * 0.85,
    height: height * 0.5,
    borderRadius: moderateScale(10),
  },
  
  navButtonsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: horizontalScale(10),
    pointerEvents: "box-none",
  },
  
  navButton: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  
  navButtonRight: {
    alignSelf: "flex-end",
  },
  
  navButtonText: {
    color: Colors.white,
    fontSize: moderateScale(24),
    fontWeight: "bold",
  },

  dotContainer: {
    flexDirection: "row",
    gap: horizontalScale(8),
    marginTop: verticalScale(12),
  },

  dot: {
    width: horizontalScale(10),
    height: horizontalScale(10),
    borderRadius: moderateScale(5),
  },

  infoText: {
    textAlign: "center",
    color: Colors.lightGray,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(16),
    marginTop: verticalScale(20),
  },

  unlockButton: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(72),
    marginTop: verticalScale(12),
    backgroundColor: Colors.blue2,
    borderRadius: moderateScale(36),
  },

  unlockButtonText: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(24),
  },

  footer: {
    width: "80%",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(16),
  },

  footerTexts: {
    color: Colors.lightGray,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(18),
  },

  handleStyle: {
    backgroundColor: Colors.darkGray,
    borderTopLeftRadius: moderateScale(15),
    borderTopRightRadius: moderateScale(15),
  },

  handleIndicatorStyle: { backgroundColor: Colors.white },

  bottomSheetView: {
    flex: 1,
    backgroundColor: Colors.darkGray,
    paddingVertical: verticalScale(8),
  },

  sheetTitle: {
    color: Colors.white,
    fontFamily: "SFProBold",
    fontSize: moderateScale(26),
    marginLeft: horizontalScale(24),
  },

  content: {
    alignSelf: "center",
    color: Colors.white,
    fontFamily: "SFProMedium",
    fontSize: moderateScale(15),
    marginTop: verticalScale(12),
    paddingHorizontal: horizontalScale(24),
  },

  seperator: { height: verticalScale(32) },
  closeButton: {
    position: 'absolute',
    top: verticalScale(40), 
    right: horizontalScale(20),
    padding: moderateScale(10),
    zIndex: 10, 
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: moderateScale(24),
    fontFamily: 'SFProBold',
  }
});
