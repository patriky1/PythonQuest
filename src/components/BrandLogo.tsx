import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '@/theme/colors';

type BrandLogoProps = {
  size?: number;
  showText?: boolean;
};

export function BrandLogo({ size = 76, showText = true }: BrandLogoProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoBox,
          { width: size, height: size, borderRadius: Math.round(size * 0.3) }
        ]}
      >
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: Math.round(size * 0.78), height: Math.round(size * 0.78) }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      {showText ? <Text style={styles.appName}>PythonQuest</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  logoBox: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.raised
  },
  appName: {
    marginTop: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4
  }
});
