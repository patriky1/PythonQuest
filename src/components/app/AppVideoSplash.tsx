import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type AppVideoSplashProps = {
  onFinish: () => void;
};

const splashVideo = require('../../../assets/videos/splash.mp4');

export function AppVideoSplash({ onFinish }: AppVideoSplashProps) {
  const player = useVideoPlayer(splashVideo, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = true;
    playerInstance.play();
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => {
      clearTimeout(timer); 
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      <View style={styles.footer}>
        <Text style={styles.appName}>PythonQuest</Text>
        <Text style={styles.loadingText}>Carregando sua jornada...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
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
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700'
  }
});