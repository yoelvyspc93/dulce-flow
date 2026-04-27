import type { PropsWithChildren, ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  scrollable?: boolean;
}>;

export function Screen({
  title,
  subtitle,
  action,
  scrollable = true,
  children,
}: ScreenProps) {
  const content = (
    <View style={styles.inner}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action ? <View>{action}</View> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.md,
  },
  headerText: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.hero,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.body,
  },
  body: {
    gap: spacing.lg,
  },
});
