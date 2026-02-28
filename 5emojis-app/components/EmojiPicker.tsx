import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { getStarterPacks, STATIC_POOLS, type StarterPackPool } from "../lib/starter-packs";
import { getEmojiName } from "./emoji-names";
import { fonts } from "../lib/fonts";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 12;
const EMOJI_SIZE = 44;
const EMOJI_GAP = 2;

// ─── Categories (used for browsing) ──────────────────────────
const CATEGORIES: { id: string; name: string; icon: string; emojis: string[] }[] = [
  {
    id: "smileys",
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "🤣", "😂", "🙂", "😊", "😇",
      "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛",
      "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔",
      "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄",
      "😬", "🤥", "🫨", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
      "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳",
      "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯",
      "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢",
      "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
      "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹",
      "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼",
      "😽", "🙀", "😿", "😾", "🙈", "🙉", "🙊",
    ],
  },
  {
    id: "gestures",
    name: "Hands",
    icon: "👋",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷",
      "🫸", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊",
      "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏",
      "✍️", "💅", "🤳", "💪", "🦾", "🦿", "👀", "👁️", "👅", "👄",
    ],
  },
  {
    id: "people",
    name: "People",
    icon: "🧑",
    emojis: [
      "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩", "🧓",
      "🙍", "🙎", "🙅", "🙆", "💁", "🙋", "🤦", "🤷", "👮", "🕵️",
      "💂", "🥷", "👷", "🤴", "👸", "🤵", "👰", "🤰", "🤱", "👼",
      "🎅", "🤶", "🦸", "🦹", "🧙", "🧚", "🧛", "🧜", "🧝", "💃",
      "🕺", "🧖", "🧗", "🤸", "🏋️", "🚴", "🏄", "🏊", "🧘",
    ],
  },
  {
    id: "nature",
    name: "Nature",
    icon: "🌿",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅",
      "🦉", "🐺", "🐴", "🦄", "🐝", "🦋", "🐌", "🐞", "🐢", "🐍",
      "🐙", "🦑", "🐬", "🐳", "🦈", "🐊", "🐘", "🦒", "🐕", "🐈",
      "🦜", "🦢", "🦩", "🐇", "🦥",
      "🌵", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀", "🪴", "🍄",
      "💐", "🌷", "🌹", "🌺", "🌸", "🌼", "🌻",
      "🌙", "🌎", "🌍", "🌏", "💫", "⭐", "🌟", "✨", "⚡", "🔥",
      "🌈", "☀️", "☁️", "❄️", "💧", "🫧", "🌊",
    ],
  },
  {
    id: "food",
    name: "Food",
    icon: "🍕",
    emojis: [
      "🍇", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍑", "🍒",
      "🍓", "🫐", "🥝", "🥑", "🌽", "🌶️", "🥦", "🍄", "🍞", "🥐",
      "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🍔", "🍟", "🍕", "🌭",
      "🥪", "🌮", "🌯", "🥙", "🍳", "🥘", "🍲", "🥗", "🍿", "🍱",
      "🍜", "🍝", "🍣", "🍤", "🥟", "🍦", "🍩", "🍪", "🎂", "🍰",
      "🧁", "🍫", "🍬", "🍭", "☕", "🫖", "🍵", "🍾", "🍷", "🍸",
      "🍹", "🍺", "🍻", "🥂", "🥤", "🧋",
    ],
  },
  {
    id: "activities",
    name: "Activities",
    icon: "⚽",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎱", "🏓", "🏸", "🥊",
      "🥋", "🎽", "🛹", "⛸️", "🎿", "🏂", "🎯", "🎮", "🕹️", "🎲",
      "🧩", "🎭", "🎨", "🎼", "🎵", "🎶", "🎤", "🎧", "🎷", "🎸",
      "🎹", "🎻", "🥁", "🎬", "🏆", "🥇", "🏅",
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈️",
    emojis: [
      "🚗", "🚕", "🏎️", "🚲", "🛹", "✈️", "🛫", "🚀", "🛸",
      "🏠", "🏢", "🏛️", "⛪", "🏰", "🗼", "🗽", "🏔️", "⛰️", "🌋",
      "🏕️", "🏖️", "🏜️", "🏝️", "🎡", "🎢", "🗺️", "🧭", "🌐", "🗿",
    ],
  },
  {
    id: "objects",
    name: "Objects",
    icon: "💡",
    emojis: [
      "📱", "💻", "⌨️", "🖥️", "📷", "📸", "📺", "🎙️", "⏰", "💡",
      "🔦", "💸", "💰", "💳", "💎", "🔧", "🔨", "⚙️", "🔮", "🧿",
      "💊", "🧬", "🧸", "🎁", "🎈", "🎀", "🎉", "🎊", "✉️", "💌",
      "📦", "🔑", "🗝️",
    ],
  },
  {
    id: "symbols",
    name: "Hearts & Symbols",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
      "💯", "✅", "❌", "❗", "❓", "⭐", "🌟", "💫", "✨", "⚡",
      "🔥", "💥", "💤", "🌀",
      "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
    ],
  },
  {
    id: "flags",
    name: "Flags",
    icon: "🏳️",
    emojis: [
      "🏁", "🚩", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️",
      "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇪🇸", "🇮🇹",
      "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳", "🇧🇷", "🇲🇽", "🇿🇦",
      "🇳🇬", "🇰🇪", "🇸🇦", "🇦🇪", "🇮🇱", "🇹🇷", "🇵🇰",
      "🇮🇩", "🇵🇭", "🇻🇳", "🇹🇭", "🇸🇬", "🇳🇿", "🇦🇷",
      "🇨🇴", "🇵🇱", "🇺🇦", "🇳🇱", "🇸🇪", "🇳🇴", "🇩🇰",
      "🇫🇮", "🇮🇪", "🇵🇹", "🇬🇷", "🇨🇭", "🇷🇴", "🇭🇷",
    ],
  },
];

// Starter pack pools now live in lib/starter-packs.ts
// (STATIC_POOLS imported above as immediate fallback, LLM packs loaded async)

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── AI suggestions ──────────────────────────────────────────
const ASSOCIATIONS: Record<string, string[]> = {
  "🍕": ["🍝", "🧀", "🍷", "🇮🇹"], "🍣": ["🥢", "🍱", "🇯🇵", "🌊"],
  "🌮": ["🌶️", "🥑", "🍹", "💃"], "☕": ["📚", "🧘", "💻", "🎵"],
  "🍺": ["⚽", "🍔", "🤝", "🎶"], "🧋": ["✨", "💅", "🌸"],
  "⚽": ["🏃", "🏆", "💪", "🎉"], "🏀": ["🏆", "🔥", "💪", "🎯"],
  "🏋️": ["💪", "🥗", "🔥", "💯"], "🧘": ["🌿", "🌸", "✨"],
  "🏄": ["🌊", "☀️", "🏖️", "🤙"], "🎨": ["🌈", "✨", "🎭", "💡"],
  "🎮": ["🕹️", "🎧", "💻", "🤖"], "🎵": ["🎧", "🎸", "🎤", "💃"],
  "🎬": ["🍿", "🎭", "⭐", "📺"], "📚": ["🤓", "☕", "🧠", "💡"],
  "💻": ["🤖", "🚀", "☕", "💡"], "🚀": ["🌟", "💡", "🔥", "✨"],
  "🌊": ["🏄", "🐬", "🏖️", "☀️"], "🏔️": ["⛷️", "🌲", "❄️", "🏕️"],
  "✈️": ["🌍", "🏖️", "📸", "🌴"], "🌸": ["🦋", "✨", "🌿", "💕"],
  "🐶": ["🐾", "🏃", "❤️", "😊"], "🐱": ["🧶", "😺", "💤", "🌙"],
  "🔥": ["💯", "🏆", "💪", "⚡"], "✨": ["🌟", "💫", "🦋", "💜"],
  "💯": ["🔥", "💪", "🏆", "⚡"], "😎": ["🏖️", "🤙", "🔥", "☀️"],
  "💜": ["✨", "🌙", "💫", "🦋"], "🎉": ["🥳", "🎊", "🍾", "💃"],
  "😂": ["🤣", "😭", "💀", "✨"], "🎧": ["🎵", "🎶", "💻", "🌙"],
  "📸": ["✈️", "🌅", "🏖️", "🎨"], "🏖️": ["☀️", "🌊", "🏄", "😎"],
  "🌴": ["🏖️", "☀️", "🌊", "✈️"], "🏃": ["💪", "🏋️", "⚡", "☀️"],
  "💃": ["🕺", "🎵", "🎉", "✨"], "🌿": ["🧘", "🌸", "🌱"],
  "🎸": ["🎵", "🎤", "🤘", "🔥"], "🏕️": ["🏔️", "🌲", "🔥", "🌌"],
};

// ─── Searchable index ────────────────────────────────────────
const SEARCHABLE = (() => {
  const items: { emoji: string; terms: string }[] = [];
  for (const cat of CATEGORIES) {
    for (const emoji of cat.emojis) {
      const name = getEmojiName(emoji);
      items.push({ emoji, terms: name ? name.toLowerCase() : "" });
    }
  }
  return items;
})();

function getDisplayName(emoji: string): string | null {
  return getEmojiName(emoji);
}

type Props = {
  selected: string[];
  onToggle: (emoji: string) => void;
  onSetAll?: (emojis: string[]) => void;
  maxSelection?: number;
};

export default function EmojiPicker({ selected, onToggle, onSetAll, maxSelection = 5 }: Props) {
  // Shuffle pools → pick random 5 from each
  const buildPacks = (pools: StarterPackPool[]) =>
    shuffle(pools).map((pack) => ({
      label: pack.label,
      icon: pack.icon,
      emojis: shuffle(pack.pool).slice(0, 5),
    }));

  // Start with static pools (instant), then swap in LLM packs if available
  const [starterPacks, setStarterPacks] = useState(() => buildPacks(STATIC_POOLS));

  useEffect(() => {
    let cancelled = false;
    getStarterPacks().then((pools) => {
      if (!cancelled && pools !== STATIC_POOLS) {
        setStarterPacks(buildPacks(pools));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<{ emoji: string; name: string } | null>(null);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = useCallback((emoji: string) => {
    const name = getDisplayName(emoji);
    if (!name) return;
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltip({ emoji, name });
    Animated.timing(tooltipOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    tooltipTimer.current = setTimeout(() => {
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTooltip(null);
      });
    }, 1400);
  }, [tooltipOpacity]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    return SEARCHABLE.filter((item) => item.terms.includes(q)).map((item) => item.emoji);
  }, [search]);

  const suggestions = useMemo(() => {
    if (selected.length === 0) return [];
    const s = new Set<string>();
    for (const e of selected) {
      for (const r of ASSOCIATIONS[e] || []) {
        if (!selected.includes(r)) s.add(r);
      }
    }
    return Array.from(s).slice(0, 12);
  }, [selected]);

  const handleToggle = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showTooltip(emoji);
    onToggle(emoji);
  }, [onToggle, showTooltip]);

  const renderItem = useCallback((emoji: string, idx: number) => {
    const sel = selected.includes(emoji);
    const full = !sel && selected.length >= maxSelection;

    return (
      <TouchableOpacity
        key={`${emoji}-${idx}`}
        onPress={() => handleToggle(emoji)}
        disabled={full}
        style={{
          width: EMOJI_SIZE,
          height: EMOJI_SIZE,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: sel ? "#7C3AED" : "transparent",
          opacity: full ? 0.25 : 1,
          margin: EMOJI_GAP / 2,
        }}
      >
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
      </TouchableOpacity>
    );
  }, [selected, maxSelection, handleToggle]);

  return (
    <View style={{ flex: 1 }}>
      {/* Tooltip banner */}
      {tooltip && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 50,
            alignSelf: "center",
            zIndex: 100,
            opacity: tooltipOpacity,
            backgroundColor: "#2D3436",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 22 }}>{tooltip.emoji}</Text>
          <Text style={{ color: "#FFF", fontSize: 14, fontFamily: fonts.bodySemiBold, marginLeft: 8 }}>
            {tooltip.name}
          </Text>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ 1. QUICK START PACKS (always visible, tap to swap) ═══ */}
        {!searchResults && (
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 12 }}>
            <Text style={{
              fontSize: 13,
              fontFamily: fonts.heading,
              color: "#7C3AED",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}>
              ⚡ QUICK START — TAP TO FILL ALL 5
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {starterPacks.map((pack) => {
                const isActive = selected.length === 5 &&
                  pack.emojis.every((e, i) => selected[i] === e);
                return (
                  <TouchableOpacity
                    key={pack.label}
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      if (onSetAll) {
                        onSetAll(pack.emojis);
                      } else {
                        for (const e of pack.emojis) onToggle(e);
                      }
                    }}
                    style={{
                      backgroundColor: isActive ? "#F5F0FF" : "#FFF",
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      marginRight: 10,
                      borderWidth: 1.5,
                      borderColor: isActive ? "#7C3AED" : "#E4DAFF",
                      minWidth: 130,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: "#7C3AED", marginBottom: 6 }}>
                      {pack.icon} {pack.label}{isActive ? " ✓" : ""}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {pack.emojis.map((e, i) => (
                        <Text key={i} style={{ fontSize: 22 }}>{e}</Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ═══ 2. SUGGESTIONS (when user has picked some) ═══ */}
        {suggestions.length > 0 && !searchResults && (
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 4, paddingBottom: 8 }}>
            <Text style={{
              fontSize: 12,
              fontFamily: fonts.bodyBold,
              color: "#9CA3AF",
              letterSpacing: 1,
              marginBottom: 6,
            }}>
              ✨  PICKS FOR YOU
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {suggestions.map((e, i) => renderItem(e, i))}
            </View>
          </View>
        )}

        {/* ═══ 4. SEARCH BAR ═══ */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 4, paddingBottom: 8 }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F5F0EC",
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 40,
          }}>
            <Text style={{ fontSize: 16, marginRight: 6, opacity: 0.5 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search emojis..."
              placeholderTextColor="#9CA3AF"
              style={{ flex: 1, fontSize: 15, fontFamily: fonts.body, color: "#2D3436", padding: 0 }}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ fontSize: 16, color: "#9CA3AF" }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ═══ 5. SEARCH RESULTS or BROWSE SECTIONS ═══ */}
        {searchResults ? (
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            <Text style={{
              fontSize: 12,
              fontFamily: fonts.bodyBold,
              color: "#9CA3AF",
              letterSpacing: 1,
              paddingTop: 4,
              paddingBottom: 6,
            }}>
              {searchResults.length > 0 ? `${searchResults.length} RESULTS` : "NO RESULTS"}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {searchResults.map((e, i) => renderItem(e, i))}
            </View>
            {searchResults.length === 0 && (
              <Text style={{ textAlign: "center", color: "#9CA3AF", marginTop: 24, fontSize: 14, fontFamily: fonts.body }}>
                Try a different search term
              </Text>
            )}
          </View>
        ) : (
          <>
            {CATEGORIES.map((section) => (
              <View key={section.id}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.bodyBold,
                  color: "#9CA3AF",
                  letterSpacing: 1,
                  paddingHorizontal: GRID_PADDING,
                  paddingTop: 14,
                  paddingBottom: 6,
                }}>
                  {section.icon}  {section.name.toUpperCase()}
                </Text>
                <View style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  paddingHorizontal: GRID_PADDING - EMOJI_GAP / 2,
                }}>
                  {section.emojis.map((e, i) => renderItem(e, i))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
