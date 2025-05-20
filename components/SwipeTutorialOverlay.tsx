import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing, Dimensions, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale, verticalScale, horizontalScale } from '@/constants/Metrics';
import { Colors } from '@/constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SwipeTutorialOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const SwipeTutorialOverlay: React.FC<SwipeTutorialOverlayProps> = ({ visible, onDismiss }) => {
  const cardPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const handPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const handOpacity = useRef(new Animated.Value(0)).current;
  const [tutorialStep, setTutorialStep] = useState(0);
  const [instructionText, setInstructionText] = useState('');

  const texts = [
    'Swipe LEFT to Dislike',
    'Swipe RIGHT to Like',
    'Swipe UP for Maybe',
  ];

  const animateHand = (toValue: {x: number, y: number}, gestureText: string) => {
    setInstructionText(gestureText);
    Animated.sequence([
      Animated.timing(handOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(handPosition, {
        toValue: { x: toValue.x / 2, y: toValue.y / 2 }, // Move hand halfway with card
        duration: 700,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardPosition, {
          toValue,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, { 
          toValue: 0, 
          duration: 700, 
          useNativeDriver: true 
        }),
      ]),
      Animated.timing(handOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(500),
    ]).start(() => {
      // Reset card
      cardPosition.setValue({ x: 0, y: 0 });
      cardOpacity.setValue(1);
      handPosition.setValue({x: 0, y: 0});
      setTutorialStep((prev) => prev + 1);
    });
  };

  useEffect(() => {
    if (visible) {
        setTutorialStep(0); // Reset steps when modal becomes visible
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    if (tutorialStep === 0) {
      animateHand({ x: -screenWidth / 2, y: 0 }, texts[0]);
    } else if (tutorialStep === 1) {
      animateHand({ x: screenWidth / 2, y: 0 }, texts[1]);
    } else if (tutorialStep === 2) {
      animateHand({ x: 0, y: -screenHeight / 4 }, texts[2]);
    } else if (tutorialStep > 2) {
      setInstructionText('You are all set!');
      // Optionally auto-dismiss or wait for button press
    }
  }, [tutorialStep, visible]);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlayContainer}>
        <View style={styles.tutorialContent}>
          <Text style={styles.instructionText}>{instructionText}</Text>

          <View style={styles.cardArea}>
            <Animated.View
              style={[
                styles.demoCard,
                {
                  opacity: cardOpacity,
                  transform: [{ translateX: cardPosition.x }, { translateY: cardPosition.y }],
                },
              ]}
            >
              <Text style={styles.cardText}>Swipe Me!</Text>
            </Animated.View>
            
            <Animated.View style={[
                styles.handIconContainer,
                {
                    opacity: handOpacity,
                    transform: [{translateX: handPosition.x}, {translateY: handPosition.y}]
                }
            ]}>
                 <Ionicons name="hand-left-outline" size={moderateScale(50)} color={Colors.white} />
            </Animated.View>

          </View>

          {tutorialStep > 2 && (
            <Pressable style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissButtonText}>Got it!</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialContent: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    backgroundColor: Colors.black,
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'space-around',
    borderColor: Colors.blue, // Using blue color for border
    borderWidth: 2,
  },
  instructionText: {
    color: Colors.white,
    fontSize: moderateScale(22),
    fontFamily: 'SFProBold',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  cardArea: {
    width: '80%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#555', // for debug
    position: 'relative', // for hand icon positioning
  },
  demoCard: {
    width: horizontalScale(150),
    height: verticalScale(200),
    backgroundColor: Colors.blue, // Was primary
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // for Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardText: {
    color: Colors.white,
    fontSize: moderateScale(18),
    fontFamily: 'SFProMedium',
  },
  handIconContainer: {
    position: 'absolute',
    // Centered initially, will be moved by animation
  },
  dismissButton: {
    backgroundColor: Colors.blue, // Was primary
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(30),
    borderRadius: moderateScale(25),
    marginTop: verticalScale(20),
  },
  dismissButtonText: {
    color: Colors.white,
    fontSize: moderateScale(18),
    fontFamily: 'SFProBold',
  },
});

export default SwipeTutorialOverlay;
