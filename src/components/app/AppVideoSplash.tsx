import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { colors } from '@/theme/colors';

type AppVideoSplashProps = {
  onFinish: () => void;
};

const SPLASH_DURATION_MS = 2600;
const FADE_DURATION_MS = 350;

const splashVideo = require('../../../assets/videos/splash.mp4');

export function AppVideoSplash({ onFinish }: AppVideoSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(splashVideo, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = true;
    playerInstance.play();
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true
      }).start(() => onFinish());
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onFinish, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      <View style={styles.footer}>
        <Text style={styles.appName}>PythonQuest</Text>
        <Text style={styles.loadingText}>Carregando sua jornada...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  video: {
    width: 230,
    height: 230,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF'
  },
  footer: {
    position: 'absolute',
    bottom: 76,
    alignItems: 'center'
  },
  appName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6
  },
  loadingText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700'
  }
});
