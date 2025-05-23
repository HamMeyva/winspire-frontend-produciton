// Renk paleti
export const COLORS = {
  // Ana renkler
  primary: '#12875F',      // Koyu yeşil (ana marka rengi)
  secondary: '#4ECBA5',    // Açık yeşil (ikincil marka rengi)
  accent: '#0A4B3E',       // Vurgu yeşili
  
  // Nötr renkler
  white: '#FFFFFF',
  black: '#000000',
  background: '#F9FBFA',   // Hafif yeşilimsi beyaz
  
  // Gri tonları
  gray100: '#F9FAFB',
  gray200: '#F2F3F5',
  gray300: '#E6E7E9',
  gray400: '#D1D3D8',
  gray500: '#9EA3AE',
  gray600: '#6B7280',
  gray700: '#4B5563',
  gray800: '#374151',
  gray900: '#1F2937',
  
  // Durum renkleri
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Gradient renkleri
  gradient: {
    primary: ['#12875F', '#4ECBA5'],
    dark: ['#0A4B3E', '#1A6B5A'],
    light: ['#4ECBA5', '#A5E1D1'],
  }
};

// Tipografi
export const FONTS = {
  // Font aileleri
  primary: 'System', // iOS için 'San Francisco' veya 'System'
  secondary: 'System',
  
  // Font stilleri
  h1: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body1: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  button: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  }
};

// Spacing (boşluk) sistemi
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const RADIUS = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  round: 9999,
};

// Shadows (gölgeler)
export const SHADOWS = {
  light: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dark: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
}; 