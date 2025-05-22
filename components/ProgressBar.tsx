import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { horizontalScale, moderateScale, verticalScale } from '@/constants/Metrics';

const { width } = Dimensions.get('window');

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
}

export default function ProgressBar({ completedCount, totalCount }: ProgressBarProps) {
  // This component is now hidden since we're using the progress bar in the Header component
  // to avoid having duplicate progress bars
  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: horizontalScale(20),
    marginBottom: verticalScale(10),
    marginTop: verticalScale(5),
  },
  progressBarContainer: {
    width: '100%',
    height: verticalScale(5),
    backgroundColor: '#333333',
    borderRadius: moderateScale(2.5),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: moderateScale(2.5),
  }
});
