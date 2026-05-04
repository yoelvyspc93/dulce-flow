import type { TextStyle } from "react-native";

export const fontFamily = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};

type TypographyToken = Required<
  Pick<TextStyle, "fontFamily" | "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing">
>;

const lineHeight = 1.3;

export const typography: Record<string, TypographyToken> = {
  hero: {
    fontFamily: fontFamily.bold,
    fontSize: 34,
    lineHeight: 34 * lineHeight,
    fontWeight: "700",
    letterSpacing: 0,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 26 * lineHeight,
    fontWeight: "700",
    letterSpacing: 0,
  },
  section: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 16 * lineHeight,
    fontWeight: "500",
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 14 * lineHeight,
    fontWeight: "400",
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 14 * lineHeight,
    fontWeight: "500",
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 12 * lineHeight,
    fontWeight: "500",
    letterSpacing: 0,
  },
};

export function scaleTypographyToken(token: TypographyToken, scale: number): TypographyToken {
  return {
    ...token,
    fontSize: Math.round(token.fontSize * scale),
    lineHeight: Math.round(token.lineHeight * scale),
  };
}
