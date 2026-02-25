import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  LayoutChangeEvent,
  Dimensions,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { CUSTOM_EMOJIS, isCustomEmoji, getCustomEmojiComponent } from "./custom-emojis";
import { getEmojiName } from "./emoji-names";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 12;
const EMOJI_SIZE = 44;
const EMOJI_GAP = 2;
const COLS = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / (EMOJI_SIZE + EMOJI_GAP));

// Categories
const CATEGORIES: { id: string; name: string; icon: string; emojis: string[] }[] = [
  {
    id: "exclusive",
    name: "Only on 5Emojis",
    icon: "⭐",
    emojis: CUSTOM_EMOJIS.map((e) => e.id),
  },
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
    name: "Hearts",
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

// AI associations for suggestions
const ASSOCIATIONS: Record<string, string[]> = {
  "🍕": ["🍝", "🧀", "🍷", "🇮🇹"], "🍣": ["🥢", "🍱", "🇯🇵", "🌊"],
  "🌮": ["🌶️", "🥑", "🍹", "💃"], "☕": ["📚", "🧘", "💻", "🎵"],
  "🍺": ["⚽", "🍔", "🤝", "🎶"], "🧋": ["✨", "💅", "🌸", "🛍️"],
  "⚽": ["🏃", "🏆", "💪", "🎉"], "🏀": ["🏆", "🔥", "💪", "🎯"],
  "🏋️": ["💪", "🥗", "🔥", "💯"], "🧘": ["🌿", "🌸", "✨", "🕯️"],
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
  "💃": ["🕺", "🎵", "🎉", "✨"], "🌿": ["🧘", "🌸", "🌱", "☮️"],
  "🎸": ["🎵", "🎤", "🤘", "🔥"], "🏕️": ["🏔️", "🌲", "🔥", "🌌"],
};

const STARTER_PACKS = [
  { label: "Foodie", icon: "🍕", emojis: ["🍕", "🍣", "☕", "🧁", "🌮"] },
  { label: "Adventurer", icon: "✈️", emojis: ["✈️", "🏔️", "🌊", "🏕️", "📸"] },
  { label: "Creative", icon: "🎨", emojis: ["🎨", "🎵", "📚", "✨", "🌸"] },
  { label: "Athlete", icon: "💪", emojis: ["💪", "🏃", "🏀", "🔥", "🏆"] },
  { label: "Techie", icon: "💻", emojis: ["💻", "🚀", "🤖", "🎮", "☕"] },
  { label: "Social", icon: "🎉", emojis: ["🎉", "💃", "🤝", "😂", "✨"] },
  { label: "Nature", icon: "🌿", emojis: ["🌿", "🐶", "🌊", "🌸", "☀️"] },
  { label: "Night Owl", icon: "🌙", emojis: ["🌙", "☕", "🎵", "💻", "🌌"] },
];

// Build a flat searchable list of all emojis with keywords
const SEARCHABLE = (() => {
  const items: { emoji: string; terms: string }[] = [];
  for (const cat of CATEGORIES) {
    for (const emoji of cat.emojis) {
      if (isCustomEmoji(emoji)) {
        const custom = CUSTOM_EMOJIS.find((c) => c.id === emoji);
        if (custom) items.push({ emoji, terms: custom.keywords.join(" ") + " " + custom.name.toLowerCase() });
      } else {
        const name = getEmojiName(emoji);
        items.push({ emoji, terms: name ? name.toLowerCase() : "" });
      }
    }
  }
  return items;
})();

function getDisplayName(emoji: string): string | null {
  if (isCustomEmoji(emoji)) {
    const custom = CUSTOM_EMOJIS.find((c) => c.id === emoji);
    return custom?.name || null;
  }
  return getEmojiName(emoji);
}

type Props = {
  selected: string[];
  onToggle: (emoji: string) => void;
  maxSelection?: number;
};

export default function EmojiPicker({ selected, onToggle, maxSelection = 5 }: Props) {
  const [activeTab, setActiveTab] = useState("exclusive");
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<{ emoji: string; name: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const tapping = useRef(false);
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
    const fallback = ["🔥", "✨", "💯", "🎉", "💜", "🌊", "🚀", "🎵", "🍕", "😎", "🧘", "🎮", "📚", "🏔️", "🐶", "🎨", "🌸", "💃", "🎧", "🏖️"];
    for (const p of fallback) {
      if (!selected.includes(p) && !s.has(p)) s.add(p);
      if (s.size >= COLS * 3) break;
    }
    return Array.from(s);
  }, [selected]);

  const allSections = useMemo(() => {
    const sections = [...CATEGORIES];
    if (suggestions.length > 0) {
      sections.splice(1, 0, { id: "suggested", name: "Suggested for You", icon: "✨", emojis: suggestions });
    }
    return sections;
  }, [suggestions]);

  const tabList = useMemo(() => {
    const tabs = CATEGORIES.map((c) => ({ id: c.id, icon: c.icon }));
    if (suggestions.length > 0) {
      tabs.splice(1, 0, { id: "suggested", icon: "✨" });
    }
    return tabs;
  }, [suggestions]);

  const handleToggle = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showTooltip(emoji);
    onToggle(emoji);
  }, [onToggle, showTooltip]);

  const scrollTo = useCallback((id: string) => {
    setActiveTab(id);
    setSearch("");
    const y = offsets.current[id];
    if (y !== undefined && scrollRef.current) {
      tapping.current = true;
      scrollRef.current.scrollTo({ y, animated: true });
      setTimeout(() => { tapping.current = false; }, 400);
    }
  }, []);

  const onScroll = useCallback((e: any) => {
    if (tapping.current) return;
    const y = e.nativeEvent.contentOffset.y + 20;
    const sorted = Object.entries(offsets.current).sort((a, b) => a[1] - b[1]);
    let current = sorted[0]?.[0] || "exclusive";
    for (const [id, offset] of sorted) {
      if (y >= offset) current = id;
      else break;
    }
    setActiveTab(current);
  }, []);

  const onLayout = useCallback((id: string, e: LayoutChangeEvent) => {
    offsets.current[id] = e.nativeEvent.layout.y;
  }, []);

  const renderItem = useCallback((emoji: string, idx: number) => {
    const sel = selected.includes(emoji);
    const full = !sel && selected.length >= maxSelection;
    const custom = isCustomEmoji(emoji);
    const Comp = custom ? getCustomEmojiComponent(emoji) : null;

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
          backgroundColor: sel ? "#6C5CE7" : "transparent",
          opacity: full ? 0.25 : 1,
          margin: EMOJI_GAP / 2,
        }}
      >
        {Comp ? <Comp size={28} /> : <Text style={{ fontSize: 28 }}>{emoji}</Text>}
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
          {isCustomEmoji(tooltip.emoji) ? (
            (() => {
              const Comp = getCustomEmojiComponent(tooltip.emoji);
              return Comp ? <Comp size={22} /> : null;
            })()
          ) : (
            <Text style={{ fontSize: 22 }}>{tooltip.emoji}</Text>
          )}
          <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "600", marginLeft: 8 }}>
            {tooltip.name}
          </Text>
        </Animated.View>
      )}

      {/* Search bar */}
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F3F4F6",
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 38,
        }}>
          <Text style={{ fontSize: 16, marginRight: 6, opacity: 0.5 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search emojis..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              fontSize: 15,
              color: "#2D3436",
              padding: 0,
            }}
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

      {/* Category tab bar — hidden during search */}
      {!searchResults && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 44, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}
          contentContainerStyle={{ paddingHorizontal: 8, alignItems: "center" }}
        >
          {tabList.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => scrollTo(tab.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 2,
                borderBottomWidth: 3,
                borderBottomColor: activeTab === tab.id ? "#6C5CE7" : "transparent",
              }}
            >
              <Text style={{ fontSize: 22, opacity: activeTab === tab.id ? 1 : 0.4 }}>
                {tab.icon}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Emoji grid */}
      <ScrollView
        ref={scrollRef}
        onScroll={searchResults ? undefined : onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Search results mode */}
        {searchResults ? (
          <View>
            <Text style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#9CA3AF",
              letterSpacing: 1,
              paddingHorizontal: GRID_PADDING,
              paddingTop: 12,
              paddingBottom: 6,
            }}>
              {searchResults.length > 0 ? `${searchResults.length} RESULTS` : "NO RESULTS"}
            </Text>
            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: GRID_PADDING - EMOJI_GAP / 2,
            }}>
              {searchResults.map((e, i) => renderItem(e, i))}
            </View>
            {searchResults.length === 0 && (
              <Text style={{ textAlign: "center", color: "#9CA3AF", marginTop: 24, fontSize: 14 }}>
                Try a different search term
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Starter packs — only when empty */}
            {selected.length === 0 && (
              <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 12, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#636E72", marginBottom: 8 }}>
                  QUICK START
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {STARTER_PACKS.map((pack) => (
                    <TouchableOpacity
                      key={pack.label}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        for (const e of pack.emojis) onToggle(e);
                      }}
                      style={{
                        backgroundColor: "#FFF",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: "#EEE",
                        minWidth: 110,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#6C5CE7", marginBottom: 4 }}>
                        {pack.icon} {pack.label}
                      </Text>
                      <Text style={{ fontSize: 20, letterSpacing: 2 }}>{pack.emojis.join(" ")}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Sections */}
            {allSections.map((section) => (
              <View key={section.id} onLayout={(e) => onLayout(section.id, e)}>
                {/* Section header */}
                {section.id === "exclusive" ? (
                  <View style={{
                    marginHorizontal: GRID_PADDING,
                    marginTop: 14,
                    marginBottom: 8,
                    backgroundColor: "#F3F0FF",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: "#E0D9FF",
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#6C5CE7" }}>
                      ⭐ ONLY ON 5EMOJIS
                    </Text>
                    <Text style={{ fontSize: 11, color: "#8B7FD4", marginTop: 2 }}>
                      Exclusive emojis you won't find anywhere else
                    </Text>
                  </View>
                ) : (
                  <Text style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#9CA3AF",
                    letterSpacing: 1,
                    paddingHorizontal: GRID_PADDING,
                    paddingTop: 16,
                    paddingBottom: 6,
                  }}>
                    {section.icon}  {section.name.toUpperCase()}
                  </Text>
                )}

                {/* Emoji grid */}
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
