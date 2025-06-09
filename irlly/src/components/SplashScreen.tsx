import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const FloatingIcon: React.FC<{ emoji: string; style: any; delay: number }> = ({ emoji, style, delay }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.05, 0.1],
  });

  return (
    <Animated.Text
      style={[
        style,
        {
          transform: [{ translateY }, { rotate }],
          opacity,
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
};

const LoadingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => animateDots());
    };

    const timer = setTimeout(animateDots, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.loadingDots}>
      <Animated.View style={[styles.dot, { transform: [{ scale: dot1 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ scale: dot2 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ scale: dot3 }] }]} />
    </View>
  );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoFloatAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating logo animation
    const logoFloat = () => {
      Animated.sequence([
        Animated.timing(logoFloatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(logoFloatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => logoFloat());
    };
    logoFloat();

    // Shimmer effect
    const shimmer = () => {
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        shimmerAnim.setValue(0);
        shimmer();
      });
    };
    shimmer();

    // Staggered text animations
    setTimeout(() => {
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 500);

    setTimeout(() => {
      Animated.timing(dotsAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Auto-finish after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoTranslateY = logoFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFF8F0', '#FED7AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Floating Background Icons */}
      <FloatingIcon emoji="📍" style={[styles.floatingIcon, styles.icon1]} delay={0} />
      <FloatingIcon emoji="☕" style={[styles.floatingIcon, styles.icon2]} delay={2000} />
      <FloatingIcon emoji="🎵" style={[styles.floatingIcon, styles.icon3]} delay={4000} />
      <FloatingIcon emoji="🍕" style={[styles.floatingIcon, styles.icon4]} delay={1000} />
      <FloatingIcon emoji="👥" style={[styles.floatingIcon, styles.icon5]} delay={3000} />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.splashContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }) }
            ],
          },
        ]}
      >
        {/* Logo Container */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { transform: [{ translateY: logoTranslateY }] }
          ]}
        >
          <View style={styles.logoBox}>
            {/* Shimmer Effect */}
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslateX }] }
              ]}
            />
            <Image
              source={require('../../assets/linkuplogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>Linkup</Text>

        {/* Tagline */}
        <Animated.Text 
          style={[styles.tagline, { opacity: taglineAnim }]}
        >
          Break free from endless scrolling
        </Animated.Text>

        {/* Loading Dots */}
        <Animated.View style={[{ opacity: dotsAnim }]}>
          <LoadingDots />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    color: '#FDB366',
  },
  icon1: { top: '20%', left: '15%' },
  icon2: { top: '30%', right: '20%' },
  icon3: { bottom: '25%', left: '20%' },
  icon4: { bottom: '35%', right: '15%' },
  icon5: { top: '60%', left: '50%' },
  splashContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: '#FDB366',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ED8936',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: 'white',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 48,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FDB366',
  },
});