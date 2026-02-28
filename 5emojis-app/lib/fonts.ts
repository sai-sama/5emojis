// Font family constants — use these in all style declarations.
// Headings: Nunito (rounded, friendly, approachable)
// Body/UI: Inter (clean, modern, readable)

export const fonts = {
  // Headings
  heading: "Nunito-ExtraBold",     // fontWeight: "800"
  headingBold: "Nunito-Bold",      // fontWeight: "700"
  headingSemiBold: "Nunito-SemiBold", // fontWeight: "600"

  // Body / UI text
  body: "Inter-Regular",           // fontWeight: "400"
  bodyMedium: "Inter-Medium",      // fontWeight: "500"
  bodySemiBold: "Inter-SemiBold",  // fontWeight: "600"
  bodyBold: "Inter-Bold",          // fontWeight: "700"
} as const;
