import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePurchase } from '@/context/purchase';
import { useRouter } from 'expo-router';

interface PremiumFeatureProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
  style?: any;
}

/**
 * Premium feature bileşeni - Premium kullanıcılar için içerik gösterir
 * Premium olmayan kullanıcılar için fallback içeriği gösterir veya abonelik sayfasına yönlendirme butonunu gösterir
 */
export default function PremiumFeature({
  children,
  fallback,
  showUpgradeButton = true,
  style
}: PremiumFeatureProps) {
  const { isPremium } = usePurchase();
  const router = useRouter();

  // Kullanıcı premium ise direkt içeriği göster
  if (isPremium) {
    return <View style={style}>{children}</View>;
  }

  // Kullanıcı premium değilse ve bir fallback (alternatif içerik) belirtilmişse onu göster
  if (fallback) {
    return <View style={style}>{fallback}</View>;
  }

  // Kullanıcı premium değil ve yükseltme butonu istenmişse
  if (showUpgradeButton) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.title}>Premium Özellik</Text>
        <Text style={styles.description}>Bu özelliği kullanmak için premium aboneliğe geçin</Text>
        <TouchableOpacity 
          style={styles.upgradeButton} 
          onPress={() => router.push('/subscription')}
        >
          <Text style={styles.buttonText}>Premium'a Geç</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hiçbir şey gösterme (düzenleyicinin isteğine bağlı)
  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
