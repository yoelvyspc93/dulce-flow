import { useMemo } from "react";

import { useAppStore } from "@/store/app.store";
import { colors, highContrastColors, scaleTypographyToken, typography } from "@/theme";

export function useAccessibleTheme() {
  const accessibilitySettings = useAppStore((state) => state.accessibilitySettings);
  const palette = accessibilitySettings.highContrastEnabled ? highContrastColors : colors;
  const fontScale = accessibilitySettings.fontScale;

  return useMemo(
    () => ({
      colors: palette,
      typography: {
        hero: scaleTypographyToken(typography.hero, fontScale),
        title: scaleTypographyToken(typography.title, fontScale),
        section: scaleTypographyToken(typography.section, fontScale),
        body: scaleTypographyToken(typography.body, fontScale),
        bodyStrong: scaleTypographyToken(typography.bodyStrong, fontScale),
        caption: scaleTypographyToken(typography.caption, fontScale),
      },
    }),
    [fontScale, palette]
  );
}
