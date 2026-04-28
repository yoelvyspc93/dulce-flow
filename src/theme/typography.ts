import type { TextStyle } from "react-native";

export const fontFamily = {
  regular: "System",
  medium: "System",
  bold: "System",
};

type TypographyToken = Pick<TextStyle, "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing">;

export const typography: Record<string, TypographyToken> = {
  hero: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: 0,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: 0,
  },
  section: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 0,
  },
};
