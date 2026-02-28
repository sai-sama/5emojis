// Font family constants — use these in all style declarations.
// Headings: Young Serif (modern editorial serif, single weight — bold by nature)
// Body/UI: DM Sans (clean, friendly, contemporary)

export const fonts = {
  // Headings (Young Serif is naturally bold at 400 — no extra weights needed)
  heading: "YoungSerif-Regular",
  headingBold: "YoungSerif-Regular",
  headingSemiBold: "YoungSerif-Regular",

  // Body / UI text
  body: "DMSans-Regular",             // fontWeight: "400"
  bodyMedium: "DMSans-Medium",        // fontWeight: "500"
  bodySemiBold: "DMSans-SemiBold",    // fontWeight: "600"
  bodyBold: "DMSans-Bold",            // fontWeight: "700"
} as const;
