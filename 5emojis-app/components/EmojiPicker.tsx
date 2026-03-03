import { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { STATIC_POOLS, type StarterPackPool } from "../lib/starter-packs";
import { CATEGORIES, searchEmojis, getEmojiDisplayName } from "../lib/emoji-data";
import { fonts } from "../lib/fonts";
import { COLORS } from "../lib/constants";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 12;
const EMOJI_SIZE = 44;
const NUM_COLUMNS = 7;

// ─── AI suggestions (curated pairings) ──────────────────────
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
  "🧠": ["💡", "📚", "🤓", "💻"], "🦋": ["🌸", "✨", "🌈", "💜"],
};

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  selected: string[];
  onToggle: (emoji: string) => void;
  onSetAll?: (emojis: string[]) => void;
  maxSelection?: number;
  hideQuickStart?: boolean;
};

export default function EmojiPicker({ selected, onToggle, onSetAll, maxSelection = 5, hideQuickStart = false }: Props) {
  // ─── Starter packs (shuffled fresh every mount) ─────────
  const [starterPacks] = useState(() =>
    shuffle(STATIC_POOLS).map((pack) => ({
      label: pack.label,
      icon: pack.icon,
      emojis: shuffle(pack.pool).slice(0, 5),
    }))
  );

  // ─── State ─────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<{ emoji: string; name: string } | null>(null);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const showTooltip = useCallback((emoji: string) => {
    const name = getEmojiDisplayName(emoji);
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

  // ─── Search (uses emoji-mart keywords — amazing coverage) ──
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    return searchEmojis(search);
  }, [search]);

  const isSearching = searchResults !== null;

  // ─── Suggestions ───────────────────────────────────────────
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

  // ─── Current grid data ─────────────────────────────────────
  const gridData = useMemo(() => {
    if (isSearching) return searchResults!;
    return CATEGORIES[activeCategory]?.emojis ?? [];
  }, [isSearching, searchResults, activeCategory]);

  // ─── Handlers ──────────────────────────────────────────────
  const handleToggle = useCallback((emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showTooltip(emoji);
    onToggle(emoji);
  }, [onToggle, showTooltip]);

  const handleCategoryPress = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(index);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  // ─── Render functions ──────────────────────────────────────
  const renderEmoji = useCallback(({ item: emoji }: { item: string }) => {
    const sel = selected.includes(emoji);
    const full = !sel && selected.length >= maxSelection;

    return (
      <TouchableOpacity
        onPress={() => handleToggle(emoji)}
        disabled={full}
        style={{
          width: EMOJI_SIZE,
          height: EMOJI_SIZE,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: sel ? COLORS.primary : "transparent",
          opacity: full ? 0.25 : 1,
        }}
      >
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
      </TouchableOpacity>
    );
  }, [selected, maxSelection, handleToggle]);

  const renderSuggestionEmoji = useCallback((emoji: string, idx: number) => {
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
          backgroundColor: sel ? COLORS.primary : "transparent",
          opacity: full ? 0.25 : 1,
        }}
      >
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
      </TouchableOpacity>
    );
  }, [selected, maxSelection, handleToggle]);

  const keyExtractor = useCallback((item: string, index: number) => `${item}-${index}`, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: EMOJI_SIZE,
    offset: EMOJI_SIZE * Math.floor(index / NUM_COLUMNS),
    index,
  }), []);

  // ─── Header component (starter packs + suggestions + search + tabs) ─
  const ListHeader = useMemo(() => (
    <View>
      {/* ═══ 1. QUICK START PACKS ═══ */}
      {!isSearching && !hideQuickStart && (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{
            fontSize: 13,
            fontFamily: fonts.heading,
            color: COLORS.primary,
            letterSpacing: 0.5,
            marginBottom: 10,
          }}>
            ⚡ QUICK START — TAP TO FILL ALL 5
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={starterPacks}
            keyExtractor={(item) => item.label}
            renderItem={({ item: pack }) => {
              const isActive = selected.length === 5 &&
                pack.emojis.every((e: string, i: number) => selected[i] === e);
              return (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (onSetAll) {
                      onSetAll(pack.emojis);
                    } else {
                      for (const e of pack.emojis) onToggle(e);
                    }
                  }}
                  style={{
                    backgroundColor: isActive ? COLORS.primarySurface : COLORS.surface,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginRight: 10,
                    borderWidth: 1.5,
                    borderColor: isActive ? COLORS.primary : COLORS.primaryBorder,
                    minWidth: 130,
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: fonts.bodyBold, color: COLORS.primary, marginBottom: 6 }}>
                    {pack.icon} {pack.label}{isActive ? " ✓" : ""}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {pack.emojis.map((e: string, i: number) => (
                      <Text key={i} style={{ fontSize: 22 }}>{e}</Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ═══ 2. SUGGESTIONS ═══ */}
      {suggestions.length > 0 && !isSearching && (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 4, paddingBottom: 8 }}>
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.bodyBold,
            color: COLORS.textMuted,
            letterSpacing: 1,
            marginBottom: 6,
          }}>
            ✨  PICKS FOR YOU
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {suggestions.map((e, i) => renderSuggestionEmoji(e, i))}
          </View>
        </View>
      )}

      {/* ═══ 3. SEARCH BAR ═══ */}
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
            placeholder="Search all emojis..."
            placeholderTextColor="#9CA3AF"
            style={{ flex: 1, fontSize: 15, fontFamily: fonts.body, color: COLORS.text, padding: 0 }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ fontSize: 16, color: COLORS.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ═══ 4. CATEGORY TABS ═══ */}
      {!isSearching && (
        <View style={{
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 4,
        }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 6 }}
          >
            {CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleCategoryPress(idx)}
                style={{
                  alignItems: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderBottomWidth: 2.5,
                  borderBottomColor: activeCategory === idx ? COLORS.primary : "transparent",
                }}
              >
                <Text style={{
                  fontSize: 20,
                  opacity: activeCategory === idx ? 1 : 0.45,
                }}>
                  {cat.icon}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search results header */}
      {isSearching && (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 4, paddingBottom: 6 }}>
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.bodyBold,
            color: COLORS.textMuted,
            letterSpacing: 1,
          }}>
            {searchResults!.length > 0 ? `${searchResults!.length} RESULTS` : "NO RESULTS"}
          </Text>
        </View>
      )}

      {/* Category label when browsing */}
      {!isSearching && (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: 6, paddingBottom: 4 }}>
          <Text style={{
            fontSize: 12,
            fontFamily: fonts.bodyBold,
            color: COLORS.textMuted,
            letterSpacing: 1,
          }}>
            {CATEGORIES[activeCategory]?.icon}  {CATEGORIES[activeCategory]?.name.toUpperCase()}
            {"  ·  "}{CATEGORIES[activeCategory]?.emojis.length}
          </Text>
        </View>
      )}
    </View>
  ), [isSearching, searchResults, starterPacks, selected, suggestions, activeCategory, onSetAll, onToggle, handleCategoryPress, renderSuggestionEmoji, search, hideQuickStart]);

  // ─── Empty state for search ────────────────────────────────
  const ListEmpty = useMemo(() => {
    if (!isSearching) return null;
    return (
      <Text style={{ textAlign: "center", color: COLORS.textMuted, marginTop: 40, fontSize: 14, fontFamily: fonts.body }}>
        Try a different search term
      </Text>
    );
  }, [isSearching]);

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
            backgroundColor: COLORS.text,
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

      <FlatList
        ref={flatListRef}
        data={gridData}
        renderItem={renderEmoji}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: 20 }}
        columnWrapperStyle={{ justifyContent: "flex-start", gap: 2 }}
        initialNumToRender={42}
        maxToRenderPerBatch={42}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}
