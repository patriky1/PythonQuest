import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_UPDATED_AT,
  PRIVACY_POLICY_URL
} from '@/constants/privacyPolicy';
import { colors, radius, spacing } from '@/theme/colors';

export default function PrivacyPolicyScreen() {
  return (
    <Screen>
      <Text style={styles.updated}>Última atualização: {PRIVACY_POLICY_UPDATED_AT}</Text>
      <Text style={styles.paragraph}>{PRIVACY_POLICY_INTRO}</Text>

      {PRIVACY_POLICY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            {section.title}
          </Text>

          {section.blocks.map((block, index) =>
            block.type === 'paragraph' ? (
              <Text key={index} style={styles.paragraph}>
                {block.text}
              </Text>
            ) : (
              <View key={index} style={styles.list}>
                {block.items.map((item) => (
                  <View key={item} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={[styles.paragraph, styles.listText]}>{item}</Text>
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      ))}

      <View style={styles.links}>
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => Linking.openURL(`mailto:${PRIVACY_CONTACT_EMAIL}`).catch(() => undefined)}
        >
          Falar sobre privacidade: {PRIVACY_CONTACT_EMAIL}
        </Text>
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => undefined)}
        >
          Abrir esta política no navegador
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.xs
  },
  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900'
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23
  },
  list: {
    gap: spacing.xs
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  bullet: {
    color: colors.primaryDark,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '900'
  },
  listText: {
    flex: 1
  },
  links: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  link: {
    color: colors.secondaryDark,
    fontSize: 15,
    fontWeight: '800'
  }
});
