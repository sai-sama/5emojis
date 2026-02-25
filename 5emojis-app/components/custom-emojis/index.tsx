import React from "react";
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from "react-native-svg";

type CustomEmojiProps = {
  size?: number;
};

// Pickleball — the iconic wiffle ball, big and centered
export function Pickleball({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="pk_ball" cx="0.38" cy="0.32" r="0.65">
          <Stop offset="0" stopColor="#FFF9C4" />
          <Stop offset="0.35" stopColor="#FFF176" />
          <Stop offset="0.7" stopColor="#FFEE58" />
          <Stop offset="1" stopColor="#F9A825" />
        </RadialGradient>
        <RadialGradient id="pk_hole" cx="0.4" cy="0.35" r="0.6">
          <Stop offset="0" stopColor="#D4960F" />
          <Stop offset="1" stopColor="#BF8600" />
        </RadialGradient>
        <RadialGradient id="pk_shadow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#000" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Drop shadow */}
      <Ellipse cx="33" cy="58" rx="16" ry="3.5" fill="url(#pk_shadow)" />
      {/* Ball body */}
      <Circle cx="32" cy="30" r="27" fill="url(#pk_ball)" />
      {/* Holes — realistic scattered pattern, ~16 visible */}
      <Circle cx="20" cy="16" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="32" cy="12" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="44" cy="16" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="14" cy="28" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="26" cy="22" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="38" cy="22" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="50" cy="28" r="3" fill="url(#pk_hole)" opacity="0.5" />
      <Circle cx="20" cy="34" r="3" fill="url(#pk_hole)" opacity="0.45" />
      <Circle cx="32" cy="30" r="3" fill="url(#pk_hole)" opacity="0.45" />
      <Circle cx="44" cy="34" r="3" fill="url(#pk_hole)" opacity="0.45" />
      <Circle cx="14" cy="42" r="2.8" fill="url(#pk_hole)" opacity="0.4" />
      <Circle cx="26" cy="40" r="2.8" fill="url(#pk_hole)" opacity="0.4" />
      <Circle cx="38" cy="40" r="2.8" fill="url(#pk_hole)" opacity="0.4" />
      <Circle cx="50" cy="40" r="2.8" fill="url(#pk_hole)" opacity="0.4" />
      <Circle cx="22" cy="48" r="2.5" fill="url(#pk_hole)" opacity="0.35" />
      <Circle cx="34" cy="48" r="2.5" fill="url(#pk_hole)" opacity="0.35" />
      <Circle cx="44" cy="48" r="2.5" fill="url(#pk_hole)" opacity="0.35" />
      {/* Glossy highlight — top-left shine */}
      <Ellipse cx="23" cy="18" rx="11" ry="9" fill="white" opacity="0.3" />
      {/* Subtle rim light */}
      <Circle cx="32" cy="30" r="26.5" fill="none" stroke="white" strokeWidth="0.8" opacity="0.12" />
    </Svg>
  );
}

// Boba tea — polished cup with gradient tea and glossy pearls
export function BobaTea({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="bt_cup" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F0EDE8" />
        </LinearGradient>
        <LinearGradient id="bt_tea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D4A574" />
          <Stop offset="1" stopColor="#8B6140" />
        </LinearGradient>
        <LinearGradient id="bt_lid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5E6D3" />
          <Stop offset="1" stopColor="#D4B896" />
        </LinearGradient>
        <RadialGradient id="bt_pearl" cx="0.35" cy="0.3" r="0.65">
          <Stop offset="0" stopColor="#4A3228" />
          <Stop offset="1" stopColor="#1A0E08" />
        </RadialGradient>
      </Defs>
      {/* Cup body */}
      <Path d="M18 18 L22 56 L42 56 L46 18 Z" fill="url(#bt_cup)" />
      {/* Tea fill */}
      <Path d="M19.5 24 L22.5 53 L41.5 53 L44.5 24 Z" fill="url(#bt_tea)" />
      {/* Cup shine */}
      <Path d="M19 20 L20.5 50 L24 50 L22 20 Z" fill="white" opacity="0.25" />
      {/* Dome lid */}
      <Path d="M16 18 Q16 12 32 10 Q48 12 48 18 Z" fill="url(#bt_lid)" />
      {/* Lid rim */}
      <Ellipse cx="32" cy="18" rx="16" ry="2.5" fill="#C9A87C" />
      {/* Straw */}
      <Rect x="33" y="2" width="3.5" height="16" rx="1.75" fill="#E85D75" />
      <Rect x="33" y="2" width="1.5" height="16" rx="0.75" fill="#F28B9E" opacity="0.5" />
      {/* Boba pearls */}
      <Circle cx="27" cy="47" r="3.2" fill="url(#bt_pearl)" />
      <Circle cx="34" cy="49" r="3.2" fill="url(#bt_pearl)" />
      <Circle cx="30" cy="43" r="3.2" fill="url(#bt_pearl)" />
      <Circle cx="37" cy="45" r="3.2" fill="url(#bt_pearl)" />
      <Circle cx="25" cy="41" r="3.2" fill="url(#bt_pearl)" />
      {/* Pearl shines */}
      <Circle cx="25.5" cy="45.5" r="1" fill="white" opacity="0.3" />
      <Circle cx="32.5" cy="47.5" r="1" fill="white" opacity="0.3" />
      <Circle cx="28.5" cy="41.5" r="1" fill="white" opacity="0.3" />
      <Circle cx="35.5" cy="43.5" r="1" fill="white" opacity="0.3" />
    </Svg>
  );
}

// Vinyl record — glossy disc with gradient label and light arc
export function VinylRecord({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="vr_disc" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0.25" stopColor="#2D2D2D" />
          <Stop offset="0.5" stopColor="#1A1A1A" />
          <Stop offset="0.75" stopColor="#2A2A2A" />
          <Stop offset="1" stopColor="#111111" />
        </RadialGradient>
        <RadialGradient id="vr_label" cx="0.4" cy="0.35" r="0.6">
          <Stop offset="0" stopColor="#FF6B6B" />
          <Stop offset="1" stopColor="#C0392B" />
        </RadialGradient>
      </Defs>
      {/* Record body */}
      <Circle cx="32" cy="32" r="28" fill="url(#vr_disc)" />
      {/* Groove rings */}
      <Circle cx="32" cy="32" r="25" fill="none" stroke="#333" strokeWidth="0.4" />
      <Circle cx="32" cy="32" r="22" fill="none" stroke="#333" strokeWidth="0.4" />
      <Circle cx="32" cy="32" r="19" fill="none" stroke="#333" strokeWidth="0.4" />
      <Circle cx="32" cy="32" r="16" fill="none" stroke="#333" strokeWidth="0.4" />
      {/* Light reflection arc */}
      <Path d="M14 14 Q24 20 20 34" fill="none" stroke="white" strokeWidth="1.5" opacity="0.08" />
      <Path d="M44 14 Q50 24 46 34" fill="none" stroke="white" strokeWidth="1" opacity="0.06" />
      {/* Label */}
      <Circle cx="32" cy="32" r="10" fill="url(#vr_label)" />
      {/* Label text lines (decorative) */}
      <Rect x="27" y="28" width="10" height="1.2" rx="0.6" fill="white" opacity="0.25" />
      <Rect x="28.5" y="31" width="7" height="1" rx="0.5" fill="white" opacity="0.18" />
      <Rect x="29" y="34" width="6" height="0.8" rx="0.4" fill="white" opacity="0.12" />
      {/* Center hole */}
      <Circle cx="32" cy="32" r="2.5" fill="#111" />
      <Circle cx="32" cy="32" r="1.8" fill="#222" />
      {/* Glossy highlight */}
      <Ellipse cx="24" cy="20" rx="10" ry="8" fill="white" opacity="0.05" />
    </Svg>
  );
}

// Hiking boot — clean modern boot shape with leather gradient
export function HikingBoot({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="hb_body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A1887F" />
          <Stop offset="1" stopColor="#6D4C41" />
        </LinearGradient>
        <LinearGradient id="hb_sole" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5D4037" />
          <Stop offset="1" stopColor="#3E2723" />
        </LinearGradient>
        <LinearGradient id="hb_toe" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#795548" />
          <Stop offset="1" stopColor="#4E342E" />
        </LinearGradient>
      </Defs>
      {/* Sole */}
      <Path d="M6 50 Q6 46 10 46 L52 46 Q58 46 58 50 L58 54 Q58 56 56 56 L8 56 Q6 56 6 54 Z" fill="url(#hb_sole)" />
      {/* Sole tread lines */}
      <Path d="M10 52 L14 52" stroke="#2E1B10" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M18 52 L22 52" stroke="#2E1B10" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M26 52 L30 52" stroke="#2E1B10" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M34 52 L38 52" stroke="#2E1B10" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M42 52 L46 52" stroke="#2E1B10" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M50 52 L54 52" stroke="#2E1B10" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Boot body */}
      <Path d="M14 46 L14 18 Q14 12 22 10 L30 10 Q34 10 34 14 L34 46 Z" fill="url(#hb_body)" />
      {/* Toe box */}
      <Path d="M34 46 L56 46 Q56 36 48 34 L34 34 Z" fill="url(#hb_toe)" />
      {/* Toe cap */}
      <Path d="M42 46 L56 46 Q56 38 50 36 L42 36 Z" fill="#5D4037" opacity="0.3" />
      {/* Tongue */}
      <Path d="M18 14 L18 36 Q18 38 22 38 L28 38 Q30 38 30 36 L30 12 Z" fill="#BCAAA4" />
      {/* Lace eyelets + laces */}
      <Circle cx="19" cy="20" r="1.2" fill="#4E342E" />
      <Circle cx="29" cy="20" r="1.2" fill="#4E342E" />
      <Path d="M19 20 L29 20" stroke="white" strokeWidth="1.2" />
      <Circle cx="19" cy="26" r="1.2" fill="#4E342E" />
      <Circle cx="29" cy="26" r="1.2" fill="#4E342E" />
      <Path d="M19 26 L29 26" stroke="white" strokeWidth="1.2" />
      <Circle cx="19" cy="32" r="1.2" fill="#4E342E" />
      <Circle cx="29" cy="32" r="1.2" fill="#4E342E" />
      <Path d="M19 32 L29 32" stroke="white" strokeWidth="1.2" />
      {/* Boot highlight */}
      <Path d="M16 18 L16 44 L20 44 L20 14 Z" fill="white" opacity="0.1" />
      {/* Top collar */}
      <Path d="M14 16 Q14 10 22 8 L30 8 Q36 8 36 14" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// Paddleboard — clean board on water with paddle
export function Paddleboard({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="pb_water" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#74B9FF" />
          <Stop offset="1" stopColor="#0984E3" />
        </LinearGradient>
        <LinearGradient id="pb_board" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFEAA7" />
          <Stop offset="0.5" stopColor="#FDCB6E" />
          <Stop offset="1" stopColor="#F0B132" />
        </LinearGradient>
        <LinearGradient id="pb_paddle_shaft" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DFE6E9" />
          <Stop offset="1" stopColor="#B2BEC3" />
        </LinearGradient>
        <LinearGradient id="pb_blade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6C5CE7" />
          <Stop offset="1" stopColor="#4834D4" />
        </LinearGradient>
      </Defs>
      {/* Water background */}
      <Path d="M0 34 Q8 30 16 34 Q24 38 32 34 Q40 30 48 34 Q56 38 64 34 L64 64 L0 64 Z" fill="url(#pb_water)" opacity="0.4" />
      <Path d="M0 40 Q10 36 20 40 Q30 44 40 40 Q50 36 60 40 L64 40 L64 64 L0 64 Z" fill="url(#pb_water)" opacity="0.25" />
      {/* Board — top-down perspective, slight angle */}
      <G transform="rotate(-15, 32, 38)">
        <Ellipse cx="32" cy="38" rx="8" ry="24" fill="url(#pb_board)" />
        {/* Board deck pad */}
        <Ellipse cx="32" cy="42" rx="5" ry="8" fill="#E17055" opacity="0.4" />
        {/* Board center stripe */}
        <Path d="M32 16 L32 58" stroke="#E67E22" strokeWidth="1" opacity="0.4" />
        {/* Board shine */}
        <Ellipse cx="29" cy="30" rx="3" ry="10" fill="white" opacity="0.2" />
      </G>
      {/* Paddle */}
      <G transform="rotate(25, 46, 30)">
        {/* Shaft */}
        <Rect x="45" y="6" width="2.5" height="40" rx="1.25" fill="url(#pb_paddle_shaft)" />
        {/* Blade */}
        <Path d="M42 44 Q42 40 46.25 40 Q50.5 40 50.5 44 L50.5 54 Q50.5 58 46.25 58 Q42 58 42 54 Z" fill="url(#pb_blade)" />
        {/* Blade shine */}
        <Path d="M43.5 44 Q43.5 41 45.5 41 L45.5 55 Q43.5 55 43.5 52 Z" fill="white" opacity="0.15" />
        {/* T-handle */}
        <Rect x="42.5" y="4" width="8" height="3" rx="1.5" fill="#B2BEC3" />
      </G>
      {/* Water sparkles */}
      <Circle cx="12" cy="48" r="1" fill="white" opacity="0.5" />
      <Circle cx="52" cy="44" r="0.8" fill="white" opacity="0.4" />
      <Circle cx="28" cy="52" r="0.6" fill="white" opacity="0.3" />
    </Svg>
  );
}

// Matcha latte — ceramic mug with rich matcha + latte art
export function MatchaLatte({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="ml_cup" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FAFAFA" />
          <Stop offset="0.7" stopColor="#E8E8E8" />
          <Stop offset="1" stopColor="#D5D5D5" />
        </LinearGradient>
        <LinearGradient id="ml_matcha" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A8D86E" />
          <Stop offset="1" stopColor="#6B9B37" />
        </LinearGradient>
        <RadialGradient id="ml_foam" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFFEF5" />
          <Stop offset="1" stopColor="#F5EDDA" />
        </RadialGradient>
        <LinearGradient id="ml_handle" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E0E0E0" />
          <Stop offset="1" stopColor="#C0C0C0" />
        </LinearGradient>
      </Defs>
      {/* Steam wisps */}
      <Path d="M22 16 Q24 10 22 4" fill="none" stroke="#D5D5D5" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <Path d="M30 14 Q32 7 30 1" fill="none" stroke="#D5D5D5" strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
      <Path d="M38 16 Q40 10 38 4" fill="none" stroke="#D5D5D5" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      {/* Cup body */}
      <Path d="M12 22 L16 56 Q17 58 20 58 L42 58 Q45 58 46 56 L50 22 Z" fill="url(#ml_cup)" />
      {/* Cup left edge highlight */}
      <Path d="M13 24 L17 56 L20 56 L16 24 Z" fill="white" opacity="0.4" />
      {/* Matcha fill */}
      <Path d="M14 28 L17 54 L45 54 L48 28 Z" fill="url(#ml_matcha)" />
      {/* Foam top */}
      <Ellipse cx="31" cy="26" rx="17" ry="5" fill="url(#ml_foam)" />
      {/* Latte art — leaf/rosetta */}
      <Path d="M31 23 Q27 25 25 28" fill="none" stroke="#7FB840" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M31 23 Q35 25 37 28" fill="none" stroke="#7FB840" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M31 23 L31 29" stroke="#7FB840" strokeWidth="1" strokeLinecap="round" />
      <Path d="M31 24.5 Q28.5 26 27 27.5" fill="none" stroke="#7FB840" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M31 24.5 Q33.5 26 35 27.5" fill="none" stroke="#7FB840" strokeWidth="0.8" strokeLinecap="round" />
      {/* Handle */}
      <Path d="M50 28 Q58 28 58 38 Q58 48 50 48" fill="none" stroke="url(#ml_handle)" strokeWidth="4.5" strokeLinecap="round" />
      <Path d="M50 30 Q56 30 56 38 Q56 46 50 46" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Cup rim highlight */}
      <Ellipse cx="31" cy="22" rx="19" ry="2" fill="white" opacity="0.15" />
    </Svg>
  );
}

// Friendship bracelet — clean woven band with colorful beads
export function FriendshipBracelet({ size = 28 }: CustomEmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="fb_red" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF7675" />
          <Stop offset="1" stopColor="#D63031" />
        </LinearGradient>
        <LinearGradient id="fb_yellow" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFEAA7" />
          <Stop offset="1" stopColor="#FDCB6E" />
        </LinearGradient>
        <LinearGradient id="fb_blue" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#74B9FF" />
          <Stop offset="1" stopColor="#0984E3" />
        </LinearGradient>
        <LinearGradient id="fb_purple" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A29BFE" />
          <Stop offset="1" stopColor="#6C5CE7" />
        </LinearGradient>
        <LinearGradient id="fb_pink" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FD79A8" />
          <Stop offset="1" stopColor="#E84393" />
        </LinearGradient>
        <LinearGradient id="fb_green" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#55EFC4" />
          <Stop offset="1" stopColor="#00B894" />
        </LinearGradient>
      </Defs>
      {/* Bracelet band — woven chevron pattern */}
      {/* Outer ring shape */}
      <Path d="M10 32 Q10 14 32 12 Q54 14 54 32 Q54 50 32 52 Q10 50 10 32 Z" fill="none" stroke="url(#fb_red)" strokeWidth="5" />
      <Path d="M10 32 Q10 14 32 12 Q54 14 54 32 Q54 50 32 52 Q10 50 10 32 Z" fill="none" stroke="url(#fb_yellow)" strokeWidth="5" strokeDasharray="5 11" strokeDashoffset="0" />
      <Path d="M10 32 Q10 14 32 12 Q54 14 54 32 Q54 50 32 52 Q10 50 10 32 Z" fill="none" stroke="url(#fb_blue)" strokeWidth="5" strokeDasharray="5 11" strokeDashoffset="5.33" />
      <Path d="M10 32 Q10 14 32 12 Q54 14 54 32 Q54 50 32 52 Q10 50 10 32 Z" fill="none" stroke="url(#fb_green)" strokeWidth="5" strokeDasharray="5 11" strokeDashoffset="10.66" />
      {/* Beads on top */}
      <Circle cx="21" cy="13.5" r="4.5" fill="url(#fb_purple)" />
      <Ellipse cx="19.5" cy="12" rx="1.8" ry="1.3" fill="white" opacity="0.3" />
      <Circle cx="32" cy="11.5" r="4.5" fill="url(#fb_pink)" />
      <Ellipse cx="30.5" cy="10" rx="1.8" ry="1.3" fill="white" opacity="0.3" />
      <Circle cx="43" cy="13.5" r="4.5" fill="url(#fb_green)" />
      <Ellipse cx="41.5" cy="12" rx="1.8" ry="1.3" fill="white" opacity="0.3" />
      {/* Bottom beads */}
      <Circle cx="21" cy="50.5" r="4" fill="url(#fb_yellow)" />
      <Ellipse cx="19.5" cy="49" rx="1.5" ry="1.1" fill="white" opacity="0.3" />
      <Circle cx="32" cy="52" r="4" fill="url(#fb_blue)" />
      <Ellipse cx="30.5" cy="50.5" rx="1.5" ry="1.1" fill="white" opacity="0.3" />
      <Circle cx="43" cy="50.5" r="4" fill="url(#fb_red)" />
      <Ellipse cx="41.5" cy="49" rx="1.5" ry="1.1" fill="white" opacity="0.3" />
      {/* Bracelet inner shadow */}
      <Path d="M14 32 Q14 18 32 16 Q50 18 50 32 Q50 46 32 48 Q14 46 14 32 Z" fill="none" stroke="black" strokeWidth="0.5" opacity="0.05" />
    </Svg>
  );
}

// All custom emojis registry
export const CUSTOM_EMOJIS: {
  id: string;
  name: string;
  component: React.FC<CustomEmojiProps>;
  keywords: string[];
}[] = [
  { id: "custom:pickleball", name: "Pickleball", component: Pickleball, keywords: ["pickleball", "paddle", "sport", "ball"] },
  { id: "custom:boba", name: "Boba Tea", component: BobaTea, keywords: ["boba", "bubble tea", "milk tea", "drink"] },
  { id: "custom:vinyl", name: "Vinyl Record", component: VinylRecord, keywords: ["vinyl", "record", "music", "retro"] },
  { id: "custom:hiking-boot", name: "Hiking Boot", component: HikingBoot, keywords: ["hiking", "boot", "outdoors", "trail"] },
  { id: "custom:paddleboard", name: "Paddleboard", component: Paddleboard, keywords: ["paddleboard", "sup", "water", "ocean"] },
  { id: "custom:matcha", name: "Matcha Latte", component: MatchaLatte, keywords: ["matcha", "latte", "green tea", "coffee"] },
  { id: "custom:bracelet", name: "Friendship Bracelet", component: FriendshipBracelet, keywords: ["friendship", "bracelet", "friends", "bff"] },
];

export function getCustomEmojiComponent(id: string): React.FC<CustomEmojiProps> | null {
  const emoji = CUSTOM_EMOJIS.find((e) => e.id === id);
  return emoji?.component || null;
}

export function isCustomEmoji(id: string): boolean {
  return id.startsWith("custom:");
}
