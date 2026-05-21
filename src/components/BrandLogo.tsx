import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

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
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.32)
          }
        ]}
      >
        <Image
          source={require('../../assets/images/logo.png')}
          style={[
            styles.logoImage,
            {
              width: Math.round(size * 0.72),
              height: Math.round(size * 0.72)
            }
          ]}
          resizeMode="contain"
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 6
  },
  logoImage: {
    borderRadius: 18
  },
  appName: {
    marginTop: 16,
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4
  }
});