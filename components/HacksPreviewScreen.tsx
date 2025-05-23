import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  FlatList,
  Image,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Colors } from '@/constants/Colors';
import { horizontalScale, moderateScale, verticalScale } from '@/constants/Metrics';
import GoAnnualModal from './GoAnnualModal';

const { width } = Dimensions.get('window');

// Main titles data
const headerData = [
  {
    id: '1',
    title: 'GENIUS LIFE HACKS',
    subtitle: 'refreshed every 24 hours',
    image: require('@/assets/images/pages/page-1.png'),
  },
  {
    id: '2',
    title: 'PRO DATING HACKS',
    subtitle: 'proven to get more girls',
    image: require('@/assets/images/pages/page-2.png'),
  },
  {
    id: '3',
    title: 'TOP MONEY HACKS',
    subtitle: 'designed to make you rich',
    image: require('@/assets/images/pages/page-3.png'),
  }
];

export default function HacksPreviewScreen({
  visible,
  close,
  onPurchasePress
}: {
  visible: boolean;
  close: () => void;
  onPurchasePress: () => void;
}) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentHeaderIndex, setCurrentHeaderIndex] = useState(0);
  const cardsRef = useRef<FlatList>(null);
  
  // Card content renderer
  const renderCard = ({ item }: { item: any }) => {
      return (
        <View style={styles.cardContainer}>
        <Image
          style={styles.pageImage}
          resizeMode="cover"
          source={item.image}
        />
        </View>
      );
  };
  
  // Handle card swipe
  const handleCardScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / width);
    
    setCurrentCardIndex(index);
      setCurrentHeaderIndex(index);
  };

  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={close}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      {/* Fixed Header Area */}
      <View style={styles.headerArea}>
        <Text style={styles.title}>{headerData[currentHeaderIndex].title}</Text>
        <Text style={styles.subtitle}>{headerData[currentHeaderIndex].subtitle}</Text>
      </View>
      
      {/* Scrollable Card Area */}
      <FlatList
        ref={cardsRef}
        data={headerData}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleCardScroll}
        style={styles.cardsContainer}
      />
      
      {/* Dots Indicator */}
      <View style={styles.dotContainer}>
        {[0, 1, 2].map((i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              { backgroundColor: currentHeaderIndex === i ? Colors.white : 'rgba(255, 255, 255, 0.5)' }
            ]} 
          />
        ))}
      </View>
      
      {/* Footer Area */}
      <View style={styles.footerArea}>
          <Text style={styles.legalText}>
            By tapping "Try For Free" you agree to our{' '}
            <Text style={styles.link}>terms of use</Text> and{' '}
            <Text style={styles.link}>privacy policy</Text>
          </Text>
        
        <TouchableOpacity 
          style={styles.tryButton}
          onPress={onPurchasePress}
        >
          <Text style={styles.tryButtonText}>Try For Free</Text>
          <Text style={styles.tryButtonIcon}>›</Text>
        </TouchableOpacity>
        
        <Text style={styles.freeTrialText}>
          3 days free, then $6.49 per week
        </Text>
        
          <TouchableOpacity>
            <Text style={styles.restoreText}>Restore purchase</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111c61',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(40),
    left: horizontalScale(20),
    zIndex: 10,
    width: horizontalScale(40),
    height: horizontalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: moderateScale(28),
    fontWeight: 'bold',
  },
  headerArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: verticalScale(60),
    marginBottom: verticalScale(20),
  },
  title: {
    color: Colors.white,
    fontSize: moderateScale(32),
    fontFamily: 'SFProBold',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    marginBottom: verticalScale(10),
    width: width,
  },
  cardContainer: {
    width,
    paddingHorizontal: horizontalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: verticalScale(10),
  },
  dot: {
    width: horizontalScale(8),
    height: horizontalScale(8),
    borderRadius: horizontalScale(4),
    marginHorizontal: horizontalScale(4),
  },
  footerArea: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: verticalScale(30),
  },
  legalText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  tryButton: {
    width: '100%',
    height: verticalScale(56),
    backgroundColor: '#1a73e8',
    borderRadius: moderateScale(28),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
  },
  tryButtonText: {
    color: Colors.white,
    fontSize: moderateScale(18),
    fontFamily: 'SFProBold',
  },
  tryButtonIcon: {
    color: Colors.white,
    fontSize: moderateScale(24),
    marginLeft: horizontalScale(8),
  },
  freeTrialText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    marginBottom: verticalScale(10),
  },
  restoreText: {
    color: Colors.white,
    fontSize: moderateScale(14),
    textDecorationLine: 'underline',
  },
  pageImage: {
    width: width * 0.85,
    height: verticalScale(400),
    borderRadius: moderateScale(16),
  },
});
