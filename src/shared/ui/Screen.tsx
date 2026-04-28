import { type Href, router, usePathname } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "@/store/app.store";
import { colors, radius, spacing, typography } from "@/theme";

import { AvatarButton } from "./AvatarButton";

type ScreenProps = PropsWithChildren<{
  title: string;
  scrollable?: boolean;
  backHref?: Href;
  onBackPress?: () => void;
}>;

export function Screen({
  title,
  scrollable = true,
  backHref,
  onBackPress,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const avatarId = useAppStore((state) => state.businessSettings?.avatarId);
  const isTabScreen = ["/home", "/orders", "/expenses", "/settings"].includes(pathname);

  function handleBack() {
    if (onBackPress) {
      onBackPress();
      return;
    }

    if (backHref) {
      router.replace(backHref);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (hasCompletedOnboarding) {
      router.replace("/(tabs)/settings");
    }
  }

  const content = (
    <View style={styles.inner}>
      <View style={styles.toolbar}>
        {!isTabScreen ? (
          <Pressable
            accessibilityLabel="Volver"
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <ArrowLeft color={colors.text} size={22} strokeWidth={2.4} />
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <AvatarButton
          avatarId={avatarId}
          onPress={() => {
            if (pathname !== "/onboarding") {
              router.push("/onboarding");
            }
          }}
          size="sm"
        />
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );

  return (
    <View
      style={[
        styles.safeArea,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  toolbar: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  title: {
    flex: 1,
    color: colors.text,
    ...typography.section,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.86,
  },
  body: {
    gap: spacing.lg,
  },
});
