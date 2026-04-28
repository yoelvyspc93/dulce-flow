import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

export type AvatarOption = {
  id: string;
  label: string;
  backgroundColor: string;
  accentColor: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "chef", label: "👩‍🍳", backgroundColor: "#FFD27A", accentColor: "#FFF3D1" },
  { id: "cake", label: "🧁", backgroundColor: "#FF9FB2", accentColor: "#FFE1E7" },
  { id: "star", label: "✨", backgroundColor: "#7FDBFF", accentColor: "#D8F6FF" },
  { id: "flower", label: "🌸", backgroundColor: "#C9A7FF", accentColor: "#EFE3FF" },
  { id: "coffee", label: "☕", backgroundColor: "#D8A067", accentColor: "#F7DEC4" },
  { id: "heart", label: "💛", backgroundColor: "#7DE2A6", accentColor: "#DAF9E6" },
];

const FALLBACK_AVATAR = AVATAR_OPTIONS[0];

type AvatarButtonProps = {
  accessibilityLabel?: string;
  avatarId?: string;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
};

export function getAvatarOption(avatarId?: string): AvatarOption {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === avatarId) ?? FALLBACK_AVATAR;
}

export function AvatarButton({
  accessibilityLabel = "Abrir datos del negocio",
  avatarId,
  selected = false,
  size = "md",
  onPress = () => router.push("/onboarding"),
}: AvatarButtonProps) {
  const avatar = getAvatarOption(avatarId);
  const sizeStyle = size === "lg" ? styles.large : size === "sm" ? styles.small : styles.medium;
  const textStyle = size === "lg" ? styles.largeLabel : size === "sm" ? styles.smallLabel : styles.mediumLabel;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyle,
        {
          backgroundColor: avatar.backgroundColor,
          borderColor: selected ? colors.accent : avatar.accentColor,
        },
        selected ? styles.selected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.innerGlow} />
      <Text style={[styles.label, textStyle]}>{avatar.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    overflow: "hidden",
  },
  small: {
    width: 44,
    height: 44,
  },
  medium: {
    width: 52,
    height: 52,
  },
  large: {
    width: 68,
    height: 68,
  },
  selected: {
    borderWidth: 3,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 5,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  innerGlow: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: "42%",
    height: "42%",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.38)",
  },
  label: {
    color: colors.background,
    ...typography.section,
  },
  smallLabel: {
    fontSize: 22,
    lineHeight: 28,
  },
  mediumLabel: {
    fontSize: 27,
    lineHeight: 32,
  },
  largeLabel: {
    fontSize: 34,
    lineHeight: 40,
  },
});
