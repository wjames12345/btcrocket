import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, useDisplayTier, useLiveSats, useLiveTier } from './store';
import { formatBtc, formatSats } from './wallet';
import { progressToNext, nextTier } from './tiers';
import { Rocket } from './Rocket';
import { AddWallet } from './AddWallet';

const { width } = Dimensions.get('window');
const ROCKET_HEIGHT = Math.round(width * 1.2);

export function Home() {
  const wallets = useApp((s) => s.wallets);
  const refreshAll = useApp((s) => s.refreshAll);
  const blur = useApp((s) => s.blurBalance);
  const toggleBlur = useApp((s) => s.toggleBlur);
  const sats = useLiveSats();
  const tier = useDisplayTier();
  const liveTier = useLiveTier();
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (wallets.length > 0) {
      void refreshAll();
    }
  }, [wallets.length, refreshAll]);

  // Foreground poll: every 5 minutes per the design rules.
  useEffect(() => {
    if (wallets.length === 0) return;
    const id = setInterval(() => {
      void refreshAll();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [wallets.length, refreshAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

  const progress = progressToNext(sats);
  const next = nextTier(liveTier);

  if (showAdd) {
    return <AddWallet onClose={() => setShowAdd(false)} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <Rocket tier={tier} width={width} height={ROCKET_HEIGHT} />

        <View style={styles.tierBlock}>
          <Text style={styles.tierLabel}>TIER {tier.index} · {tier.name.toUpperCase()}</Text>
          {tier.milestone && <Text style={styles.milestone}>★ MILESTONE</Text>}
          <Text style={styles.delta}>{tier.delta}</Text>
        </View>

        <Pressable onPress={toggleBlur} style={styles.satsBlock}>
          <Text style={styles.satsLabel}>YOUR STACK</Text>
          <Text style={styles.satsValue}>
            {blur ? '••••••••' : `${formatSats(sats)} sats`}
          </Text>
          <Text style={styles.btcValue}>
            {blur ? '' : `${formatBtc(sats)} BTC`}
          </Text>
          <Text style={styles.blurHint}>{blur ? 'tap to reveal' : 'tap to hide'}</Text>
        </Pressable>

        {next && (
          <View style={styles.progressBlock}>
            <Text style={styles.nextLabel}>NEXT · {next.name}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.nextDelta}>{next.delta}</Text>
          </View>
        )}

        <View style={styles.walletsBlock}>
          <Text style={styles.sectionLabel}>WALLETS</Text>
          {wallets.length === 0 ? (
            <Text style={styles.emptyHint}>No wallets connected yet.</Text>
          ) : (
            wallets.map((w) => (
              <View key={w.id} style={styles.walletRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletLabel}>{w.label}</Text>
                  <Text style={styles.walletSource}>
                    {w.source.kind}: {w.source.value.slice(0, 8)}…{w.source.value.slice(-4)}
                  </Text>
                </View>
                <Text style={styles.walletSats}>
                  {w.lastSats === null ? <ActivityIndicator color="#888" /> : `${formatSats(w.lastSats)}`}
                </Text>
              </View>
            ))
          )}
          <Pressable style={styles.addButton} onPress={() => setShowAdd(true)}>
            <Text style={styles.addButtonText}>+ Add wallet</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06070d' },
  scroll: { paddingBottom: 60 },
  tierBlock: { paddingHorizontal: 24, paddingTop: 16 },
  tierLabel: { color: '#ff6b35', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  milestone: { color: '#ffd86b', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  delta: { color: '#e8e8ec', fontSize: 18, fontWeight: '600', marginTop: 6, lineHeight: 24 },
  satsBlock: { paddingHorizontal: 24, paddingTop: 24 },
  satsLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  satsValue: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  btcValue: { color: '#666', fontSize: 14, marginTop: 2, fontVariant: ['tabular-nums'] },
  blurHint: { color: '#444', fontSize: 11, marginTop: 6 },
  progressBlock: { paddingHorizontal: 24, paddingTop: 24 },
  nextLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  progressTrack: { height: 6, backgroundColor: '#1a1a22', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#ff6b35', borderRadius: 3 },
  nextDelta: { color: '#888', fontSize: 13, marginTop: 8 },
  walletsBlock: { paddingHorizontal: 24, paddingTop: 32 },
  sectionLabel: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  emptyHint: { color: '#555', fontSize: 14 },
  walletRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a22' },
  walletLabel: { color: '#e8e8ec', fontSize: 15, fontWeight: '600' },
  walletSource: { color: '#666', fontSize: 12, marginTop: 2 },
  walletSats: { color: '#fff', fontSize: 14, fontVariant: ['tabular-nums'] },
  addButton: { marginTop: 16, paddingVertical: 14, backgroundColor: '#1a1a22', borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#ff6b35', fontSize: 15, fontWeight: '700' },
});
