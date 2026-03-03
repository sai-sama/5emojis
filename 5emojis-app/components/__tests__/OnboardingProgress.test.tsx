import React from "react";
import { render } from "@testing-library/react-native";
import OnboardingProgress from "../OnboardingProgress";
import { COLORS } from "../../lib/constants";

// ─── Mock expo-router ────────────────────────────────────────
let mockPathname = "/onboarding/basics";

jest.mock("expo-router", () => ({
  usePathname: () => mockPathname,
}));

describe("OnboardingProgress", () => {
  beforeEach(() => {
    mockPathname = "/onboarding/basics";
  });

  it("renders 5 dots for 5 onboarding steps", () => {
    const { toJSON } = render(<OnboardingProgress />);
    const tree = toJSON();

    // The root View contains child Views (dots)
    expect(tree).not.toBeNull();
    if (tree && !Array.isArray(tree) && tree.children) {
      expect(tree.children).toHaveLength(5);
    }
  });

  it("marks first dot as active on basics step", () => {
    mockPathname = "/onboarding/basics";
    const { toJSON } = render(<OnboardingProgress />);
    const tree = toJSON();

    if (tree && !Array.isArray(tree) && tree.children) {
      const dots = tree.children as any[];

      // First dot should be active (wider, purple)
      const firstDotStyle = dots[0].props.style;
      const flatFirstStyle = Array.isArray(firstDotStyle)
        ? Object.assign({}, ...firstDotStyle)
        : firstDotStyle;

      expect(flatFirstStyle.backgroundColor).toBe(COLORS.primary);
      expect(flatFirstStyle.width).toBe(18);

      // Second dot should be inactive
      const secondDotStyle = dots[1].props.style;
      const flatSecondStyle = Array.isArray(secondDotStyle)
        ? Object.assign({}, ...secondDotStyle)
        : secondDotStyle;

      expect(flatSecondStyle.width).toBe(6);
    }
  });

  it("marks first two dots as active on photos step", () => {
    mockPathname = "/onboarding/photos";
    const { toJSON } = render(<OnboardingProgress />);
    const tree = toJSON();

    if (tree && !Array.isArray(tree) && tree.children) {
      const dots = tree.children as any[];

      // First two dots (basics=0, photos=1) should be active
      for (let i = 0; i <= 1; i++) {
        const dotStyle = dots[i].props.style;
        const flatStyle = Array.isArray(dotStyle)
          ? Object.assign({}, ...dotStyle)
          : dotStyle;
        expect(flatStyle.backgroundColor).toBe(COLORS.primary);
        expect(flatStyle.width).toBe(18);
      }

      // Third dot should be inactive
      const thirdDotStyle = dots[2].props.style;
      const flatThirdStyle = Array.isArray(thirdDotStyle)
        ? Object.assign({}, ...thirdDotStyle)
        : thirdDotStyle;
      expect(flatThirdStyle.width).toBe(6);
    }
  });

  it("marks all dots as active on last step (location)", () => {
    mockPathname = "/onboarding/location";
    const { toJSON } = render(<OnboardingProgress />);
    const tree = toJSON();

    if (tree && !Array.isArray(tree) && tree.children) {
      const dots = tree.children as any[];

      for (const dot of dots) {
        const dotStyle = dot.props.style;
        const flatStyle = Array.isArray(dotStyle)
          ? Object.assign({}, ...dotStyle)
          : dotStyle;
        expect(flatStyle.backgroundColor).toBe(COLORS.primary);
        expect(flatStyle.width).toBe(18);
      }
    }
  });

  it("marks all dots as inactive when on unknown route", () => {
    mockPathname = "/onboarding/unknown-step";
    const { toJSON } = render(<OnboardingProgress />);
    const tree = toJSON();

    if (tree && !Array.isArray(tree) && tree.children) {
      const dots = tree.children as any[];

      // currentIndex will be -1, so i <= -1 is never true => all inactive
      for (const dot of dots) {
        const dotStyle = dot.props.style;
        const flatStyle = Array.isArray(dotStyle)
          ? Object.assign({}, ...dotStyle)
          : dotStyle;
        expect(flatStyle.width).toBe(6);
      }
    }
  });

  it("correctly identifies the emojis step (index 2)", () => {
    mockPathname = "/onboarding/emojis";
    const { toJSON } = render(<OnboardingProgress />);
    const tree = toJSON();

    if (tree && !Array.isArray(tree) && tree.children) {
      const dots = tree.children as any[];

      // Steps 0 (basics), 1 (photos), 2 (emojis) should be active
      for (let i = 0; i <= 2; i++) {
        const dotStyle = dots[i].props.style;
        const flatStyle = Array.isArray(dotStyle)
          ? Object.assign({}, ...dotStyle)
          : dotStyle;
        expect(flatStyle.backgroundColor).toBe(COLORS.primary);
      }

      // Step 3 (details) should be inactive
      const dot3Style = dots[3].props.style;
      const flatDot3Style = Array.isArray(dot3Style)
        ? Object.assign({}, ...dot3Style)
        : dot3Style;
      expect(flatDot3Style.width).toBe(6);
    }
  });
});
