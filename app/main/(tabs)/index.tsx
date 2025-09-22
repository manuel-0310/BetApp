// app/main/(tabs)/index.tsx
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewToken,
} from "react-native";

export default function HomeTab() {
  const router = useRouter();
  const soon = (txt: string) => Alert.alert("Próximamente", txt);

  const { width: winW } = useWindowDimensions();
  const CONTAINER_W = Math.min(winW, 420);
  const H_PADDING = 16;
  const CARD_W = CONTAINER_W - H_PADDING * 2;
  const MATCH_CARD_W = Math.round(CONTAINER_W * 0.82);

  // Mock data
  const promos = [
    { id: "p1", title: "Bono de Bienvenida 200%", subtitle: "Hasta $600.000", cta: "Reclamar" },
    { id: "p2", title: "Cashback Semanal", subtitle: "Hasta 10% de pérdidas", cta: "Participar" },
    { id: "p3", title: "Apuesta Gratis", subtitle: "Por tu primera recarga", cta: "Activar" },
  ];
  const news = [
    "⚽ Final Copa: Odds actualizados en vivo",
    "🎾 US Open: especiales de sets y tie-break",
    "🏀 NBA Preseason: boosts del 25% disponibles",
    "🎰 Jackpot diario en Slots Megaways",
  ];
  const featuredMatches = [
    { id: "m1", league: "Premier League", teams: "Arsenal vs. Chelsea", time: "Hoy 20:00", odds: { H: 1.95, D: 3.4, A: 3.9 } },
    { id: "m2", league: "LaLiga", teams: "Real Madrid vs. Betis", time: "Mañana 16:30", odds: { H: 1.55, D: 4.2, A: 6.0 } },
    { id: "m3", league: "Serie A", teams: "Milan vs. Inter", time: "Vie 19:45", odds: { H: 2.6, D: 3.1, A: 2.7 } },
  ];
  const favGames = [
    { id: "g1", label: "Deportes", icon: <Ionicons name="american-football" size={22} color="#0f172a" /> },
    { id: "g2", label: "En Vivo", icon: <Ionicons name="flash" size={22} color="#0f172a" /> },
    { id: "g3", label: "Casino", icon: <MaterialCommunityIcons name="slot-machine" size={22} color="#0f172a" /> },
    { id: "g4", label: "Ruleta", icon: <FontAwesome5 name="compact-disc" size={20} color="#0f172a" /> },
    { id: "g5", label: "Blackjack", icon: <MaterialCommunityIcons name="cards-playing-outline" size={22} color="#0f172a" /> },
    { id: "g6", label: "eSports", icon: <MaterialCommunityIcons name="gamepad-variant" size={22} color="#0f172a" /> },
  ];

  // Slider state
  const [activePromo, setActivePromo] = useState(0);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setActivePromo(viewableItems[0].index ?? 0);
  });
  const renderDot = useMemo(
    () => promos.map((_, i) => <View key={i} style={[styles.dot, i === activePromo && styles.dotActive]} />),
    [activePromo]
  );

  return (
    <ImageBackground
      source={require("../../../assets/images/fondo_login.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* TOP BAR centrado y transparente */}
        <View style={styles.topbar}>
          <Image
            source={require("../../../assets/images/black_icon.png")}
            style={{ width: 40, height: 40, tintColor: "#fff" }}
          />
          <Text style={styles.brand}>Lucka</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { width: CONTAINER_W, alignSelf: "center", paddingHorizontal: H_PADDING },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Balance */}
            <View style={styles.card}>
              <View>
                <Text style={styles.overline}>Saldo</Text>
                <Text style={styles.balance}>$1,250.00</Text>
                <Text style={styles.small}>Disponible</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.pillBtn} onPress={() => soon("Depositar")}>
                  <Ionicons name="arrow-down-circle" size={18} color="#0f172a" />
                  <Text style={styles.pillTxt}>Depositar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pillBtn} onPress={() => soon("Retirar")}>
                  <Ionicons name="arrow-up-circle" size={18} color="#0f172a" />
                  <Text style={styles.pillTxt}>Retirar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Slider de promos */}
            <View style={{ marginBottom: 12 }}>
              <FlatList
                data={promos}
                keyExtractor={(i) => i.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewConfig.current}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={CARD_W}
                getItemLayout={(_, index) => ({ length: CARD_W, offset: CARD_W * index, index })}
                renderItem={({ item }) => (
                  <View style={[styles.promo, { width: CARD_W }]}>
                    <View style={{ gap: 2 }}>
                      <Text style={styles.promoTitle}>{item.title}</Text>
                      <Text style={styles.small}>{item.subtitle}</Text>
                    </View>
                    <TouchableOpacity style={styles.cta} onPress={() => soon(item.title)}>
                      <Text style={styles.ctaTxt}>{item.cta}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#111827" />
                    </TouchableOpacity>
                  </View>
                )}
              />
              <View style={styles.dotsRow}>{renderDot}</View>
            </View>

            {/* Noticias */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerRow}>
              {news.map((n, i) => (
                <View key={i} style={styles.tickerChip}>
                  <Text style={styles.tickerTxt}>{n}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Partidos destacados */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Partidos destacados</Text>
                <TouchableOpacity onPress={() => soon("Ver todos")}>
                  <Text style={styles.link}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={featuredMatches}
                keyExtractor={(i) => i.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.match} onPress={() => soon(item.teams)}>
                    <Text style={styles.small}>{item.league}</Text>
                    <Text style={styles.matchTeams}>{item.teams}</Text>
                    <Text style={[styles.small, { marginBottom: 8 }]}>{item.time}</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[
                        { k: "H", v: item.odds.H },
                        { k: "X", v: item.odds.D },
                        { k: "A", v: item.odds.A },
                      ].map((o) => (
                        <View key={o.k} style={styles.oddBox}>
                          <Text style={styles.oddKey}>{o.k}</Text>
                          <Text style={styles.oddVal}>{o.v.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Favoritos */}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { marginBottom: 10 }]}>Tus favoritos</Text>
              <View style={styles.grid}>
                {favGames.map((g) => (
                  <TouchableOpacity key={g.id} style={styles.tile}>
                    <View style={styles.tileIcon}>{g.icon}</View>
                    <Text style={styles.tileTxt}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },

  // Topbar centrado y sin fondo
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  brand: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },

  scroll: { flexGrow: 1, paddingTop: 6, paddingBottom: 12 },

  // Card base
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  link: { fontWeight: "800", color: "#111827" },

  // Tipografía
  overline: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  balance: { fontSize: 28, fontWeight: "900", letterSpacing: 0.2, color: "#111827" },
  small: { fontSize: 13, fontWeight: "500", color: "#6b7280" },

  // Botones pill
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  pillTxt: { fontSize: 13, fontWeight: "800", color: "#111827" },

  // Promo slider
  promo: {
    borderRadius: 16,
    padding: 16,
    marginRight: 0,
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  promoTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  cta: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
  },
  ctaTxt: { fontSize: 13, fontWeight: "900", color: "#111827" },
  dotsRow: { flexDirection: "row", gap: 6, alignSelf: "center", marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.25)" },
  dotActive: { backgroundColor: "#111827", width: 16 },

  // Ticker
  tickerRow: { gap: 8, paddingVertical: 8, alignItems: "center" },
  tickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  tickerTxt: { fontSize: 15, fontWeight: "800", color: "#111827" },

  // Matches
  match: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#F6F7F9",
  },
  matchTeams: { fontSize: 15, fontWeight: "900", marginTop: 2, marginBottom: 2, color: "#111827" },
  oddsRow: { flexDirection: "row", gap: 8 },
  oddBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  oddKey: { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  oddVal: { fontSize: 15, fontWeight: "900", marginTop: 2, color: "#111827" },

  // Grid favoritos
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  tile: {
    width: "48%",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  tileTxt: { fontWeight: "800", color: "#111827" },
});
