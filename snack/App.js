// BTCROCKET · Mission Control · Expo Snack build
// Paste into https://snack.expo.dev (or import the GitHub repo via "Import from Git").
// Target: Expo SDK 51.
//
// This build reads REAL wallet balances from mempool.space (no API key needed,
// public endpoint, generous rate limits). Paste an xpub/ypub/zpub or a BTC
// address — the rocket auto-derives its state from your live stack.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useFonts, Geist_500Medium, Geist_700Bold, Geist_900Black } from '@expo-google-fonts/geist';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_700Bold } from '@expo-google-fonts/ibm-plex-mono';

// ──────────────────────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────────────────────
const C = {
  bg: '#000000', bg1: '#0a0a0a', bg2: '#141414', bg3: '#1f1f1f',
  rule: '#333333',
  ink: '#ffffff', ink2: '#c8c8c8', ink3: '#7a7a7a', ink4: '#404040',
  btc: '#f7931a', btcHot: '#ffb13f', btcDeep: '#c77100',
  danger: '#ff4d4d',
};

// 7 visible flame states the LIVE wallet balance maps into.
const STATES = [
  { name: 'DEAD',         label: 'DEAD ROCKET',          threshold: 0,             fx: { smoke: 0,  sparks: 0,  flame: 0,  embers: 0 } },
  { name: 'IGNITION',     label: 'IGNITION SEQUENCE',    threshold: 100_000,       fx: { smoke: 1,  sparks: 1,  flame: 0,  embers: 0 } },
  { name: 'SMOKING',      label: 'SMOKING',              threshold: 1_000_000,     fx: { smoke: 4,  sparks: 0,  flame: 0,  embers: 0 } },
  { name: 'SPARKING',     label: 'SPARKING',             threshold: 10_000_000,    fx: { smoke: 3,  sparks: 6,  flame: 1,  embers: 2 } },
  { name: 'BLASTING',     label: 'BLASTING FLAMES',      threshold: 100_000_000,   fx: { smoke: 5,  sparks: 3,  flame: 6,  embers: 4 } },
  { name: 'ROARING',      label: 'ROARING FLAMES',       threshold: 1_000_000_000, fx: { smoke: 7,  sparks: 5,  flame: 8,  embers: 7 } },
  { name: 'MAXIMUM BURN', label: 'ROARING EVERYTHING',   threshold: 10_000_000_000,fx: { smoke: 10, sparks: 10, flame: 10, embers: 10 } },
];

const PEERS = [
  { name: 'HODLForever2140', sats: 210_000_000_000 }, { name: '21MillionMax',    sats: 168_000_000_000 },
  { name: 'CitadelMaximus',  sats:  98_400_000_000 }, { name: 'diamond_hands',   sats:  64_200_000_000 },
  { name: 'SatoshisHeir',    sats:  41_800_000_000 }, { name: 'OrangePilled',    sats:  18_900_000_000 },
  { name: 'low_time_pref',   sats:  12_400_000_000 }, { name: 'NeverSellBottom', sats:   7_300_000_000 },
  { name: 'stack_til_dead',  sats:   4_900_000_000 }, { name: 'csw_skeptic',     sats:   3_100_000_000 },
  { name: 'mempool_warrior', sats:   2_400_000_000 }, { name: 'plebs_unite',     sats:   1_750_000_000 },
  { name: 'OPRETURN42',      sats:     920_000_000 }, { name: 'cold_storage',    sats:     610_000_000 },
  { name: 'NodeRunner_UK',   sats:     410_000_000 }, { name: 'multisig_or_die', sats:     290_000_000 },
  { name: 'KeyPair_94',      sats:     180_000_000 }, { name: 'sat_stacker',     sats:     120_000_000 },
  { name: 'first_7M_sats',   sats:      72_400_000 }, { name: 'taproot_enjoyer', sats:      48_200_000 },
  { name: 'sound_money_max', sats:      31_100_000 }, { name: 'fiat_refugee',    sats:      19_800_000 },
  { name: 'BlockSpace4Life', sats:      12_400_000 }, { name: 'satoshi_nak',     sats:       7_900_000 },
  { name: 'hashing_away',    sats:       4_700_000 }, { name: 'orange_coin',     sats:       2_900_000 },
  { name: 'pleb_node_22',    sats:       1_650_000 }, { name: 'first_M_sats',    sats:       1_050_000 },
  { name: 'just_a_few',      sats:         470_000 }, { name: 'starting_my',     sats:         110_000 },
  { name: 'sat_curious',     sats:          42_000 },
];

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
const fmtBtc = (sats) => (sats / 1e8).toFixed(3);
const fmtSats = (sats) => sats.toLocaleString('en-GB');
const fmtShortSats = (sats) => {
  if (sats >= 1e11) return (sats / 1e8).toFixed(0) + ' BTC';
  if (sats >= 1e9)  return (sats / 1e8).toFixed(1) + ' BTC';
  if (sats >= 1e8)  return (sats / 1e8).toFixed(3) + ' BTC';
  if (sats >= 1e6)  return (sats / 1e6).toFixed(2) + 'M SATS';
  if (sats >= 1e3)  return (sats / 1e3).toFixed(1) + 'k SATS';
  return sats.toLocaleString('en-GB') + ' SATS';
};
const bucketForSats = (sats) => {
  for (let i = STATES.length - 1; i >= 0; i--) if (sats >= STATES[i].threshold) return i;
  return 0;
};

// xpub/address detection — light validation, server confirms by accepting/rejecting
const detectKind = (input) => {
  const t = (input || '').trim();
  if (/^(xpub|ypub|zpub|tpub|upub|vpub)/.test(t) && t.length >= 100) return 'xpub';
  if (/^(bc1[a-z0-9]{8,87}|[13][a-zA-HJ-NP-Z0-9]{25,39})$/.test(t)) return 'address';
  return null;
};

// mempool.space REST — no API key needed
async function fetchBalanceSats(source) {
  const path = source.kind === 'address' ? `address/${source.value}` : `xpub/${source.value}`;
  const res = await fetch(`https://mempool.space/api/${path}`);
  if (!res.ok) throw new Error(`mempool.space ${res.status}`);
  const json = await res.json();
  const cs = json.chain_stats || { funded_txo_sum: 0, spent_txo_sum: 0 };
  const ms = json.mempool_stats || { funded_txo_sum: 0, spent_txo_sum: 0 };
  return (cs.funded_txo_sum - cs.spent_txo_sum) + (ms.funded_txo_sum - ms.spent_txo_sum);
}

// ──────────────────────────────────────────────────────────────
// PARTICLES
// ──────────────────────────────────────────────────────────────
const LIMITS = { smoke: 18, sparks: 28, flame: 14, embers: 36 };
function useParticles(stateIdx, anchorY) {
  const [, setTick] = useState(0);
  const pools = useRef({ smoke: [], sparks: [], flame: [], embers: [] });
  useEffect(() => {
    const id = setInterval(() => {
      const fx = STATES[stateIdx].fx;
      const p = pools.current;
      const emit = (kind, intensity, factory) => {
        if (intensity <= 0) return;
        const n = Math.min(2, Math.ceil(intensity * 0.18));
        for (let i = 0; i < n; i++) {
          if (p[kind].length >= LIMITS[kind]) break;
          p[kind].push(factory(intensity));
        }
      };
      emit('smoke', fx.smoke, (i) => ({ x: (Math.random()-0.5)*80, y: anchorY, vx: (Math.random()-0.5)*0.5, vy: -0.25-Math.random()*0.5-i*0.04, r: 14+Math.random()*12, life: 0, max: 100+Math.random()*60 }));
      emit('sparks', fx.sparks, (i) => { const a = -Math.PI/2 + (Math.random()-0.5)*Math.PI; const s = 2+Math.random()*4+i*0.3; return { x: (Math.random()-0.5)*14, y: anchorY, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0, max: 26+Math.random()*18 }; });
      emit('flame', fx.flame, (i) => ({ x: (Math.random()-0.5)*18, y: anchorY, vy: -1.4-Math.random()*1.4-i*0.12, r: 12+Math.random()*8+i*1.2, life: 0, max: 22+Math.random()*12 }));
      emit('embers', fx.embers, () => ({ x: (Math.random()-0.5)*50, y: anchorY+6, vx: (Math.random()-0.5)*1.2, vy: 0.6+Math.random()*2, r: 1+Math.random()*1.6, life: 0, max: 28+Math.random()*30 }));
      const stepArr = (arr, g) => {
        for (let i = arr.length-1; i >= 0; i--) {
          const it = arr[i];
          it.x += it.vx || 0; it.y += it.vy;
          if (g) it.vy += g;
          if (it.r !== undefined && !g) it.r += 0.25;
          it.life++;
          if (it.life > it.max) arr.splice(i, 1);
        }
      };
      stepArr(p.smoke); stepArr(p.sparks, 0.18); stepArr(p.flame); stepArr(p.embers);
      setTick(t => (t+1) % 1_000_000);
    }, 1000/30);
    return () => clearInterval(id);
  }, [stateIdx, anchorY]);
  return pools.current;
}

// ──────────────────────────────────────────────────────────────
// ROCKET (SVG)
// ──────────────────────────────────────────────────────────────
function Rocket({ stateIdx, width, height }) {
  const cx = width / 2;
  const engineY = height * 0.74;
  const bodyTop = height * 0.22;
  const bodyH = engineY - 4 - bodyTop;
  const bodyW = 26 + stateIdx * 4;
  const ascend = stateIdx >= 6 ? -10 : 0;

  if (stateIdx === 0) {
    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect x={cx - bodyW/2} y={bodyTop} width={bodyW} height={bodyH} stroke={C.btc} strokeOpacity={0.22} strokeWidth={1} strokeDasharray="3 3" fill="transparent" />
        <Path d={`M ${cx - bodyW/2} ${bodyTop} L ${cx} ${bodyTop - 24} L ${cx + bodyW/2} ${bodyTop}`} stroke={C.btc} strokeOpacity={0.22} strokeWidth={1} strokeDasharray="3 3" fill="transparent" />
      </Svg>
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgRadialGradient id="engineGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="#fffaa0" stopOpacity={Math.min(1, (stateIdx-2)*0.3)} />
          <Stop offset="40%"  stopColor="#ff8c28" stopOpacity={Math.min(1, (stateIdx-2)*0.18)} />
          <Stop offset="100%" stopColor="#7a1e0a" stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>
      {stateIdx >= 3 && <Circle cx={cx} cy={engineY-2} r={28 + stateIdx*3} fill="url(#engineGlow)" />}
      <G transform={`translate(0, ${ascend})`}>
        <Path d={`M ${cx - bodyW/2} ${bodyTop} Q ${cx} ${bodyTop-34} ${cx + bodyW/2} ${bodyTop} Z`} fill="#dcdce0" />
        <Circle cx={cx} cy={bodyTop-30} r={1.6} fill={C.btc} />
        <Rect x={cx - bodyW/2} y={bodyTop} width={bodyW} height={bodyH} fill="#e8e8ec" />
        <Rect x={cx + bodyW/2 - 3} y={bodyTop+4} width={3} height={bodyH-8} fill="#000" opacity={0.18} />
        <Rect x={cx - bodyW/2 + 2} y={bodyTop+4} width={2} height={bodyH-8} fill="#fff" opacity={0.4} />
        {stateIdx >= 2 && <>
          <Rect x={cx - bodyW/2} y={bodyTop + bodyH*0.18} width={bodyW} height={5} fill={C.btc} />
          <SvgText x={cx} y={bodyTop + bodyH*0.18 + 4} fill="#000" fontSize={16} fontWeight="900" textAnchor="middle" alignmentBaseline="middle">₿</SvgText>
        </>}
        {stateIdx >= 3 && <Path d={`M ${cx} ${bodyTop} L ${cx} ${bodyTop + bodyH}`} stroke="#000" strokeOpacity={0.16} strokeWidth={1} />}
        {stateIdx >= 3 && <>
          <Path d={`M ${cx - bodyW/2} ${bodyTop + bodyH - 22} L ${cx - bodyW/2 - 14} ${bodyTop + bodyH + 4} L ${cx - bodyW/2} ${bodyTop + bodyH + 4} Z`} fill="#b8b8c0" />
          <Path d={`M ${cx + bodyW/2} ${bodyTop + bodyH - 22} L ${cx + bodyW/2 + 14} ${bodyTop + bodyH + 4} L ${cx + bodyW/2} ${bodyTop + bodyH + 4} Z`} fill="#b8b8c0" />
        </>}
        {stateIdx >= 5 && [-(bodyW/2 + 14), bodyW/2 + 14].map((dx, i) => {
          const bW = 12, bH = bodyH * 0.65, by = bodyTop + bodyH - bH;
          return (
            <G key={i}>
              <Rect x={cx + dx - bW/2} y={by} width={bW} height={bH} fill="#cfcfd4" />
              <Path d={`M ${cx + dx - bW/2} ${by + 5} Q ${cx + dx} ${by - 9} ${cx + dx + bW/2} ${by + 5} Z`} fill="#cfcfd4" />
              <Rect x={cx + dx - bW/2} y={by + bH*0.4} width={bW} height={2} fill={C.btc} />
            </G>
          );
        })}
      </G>
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────
// PARTICLE LAYER
// ──────────────────────────────────────────────────────────────
function ParticleLayer({ pools, width, anchorY }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pools.smoke.map((p, i) => {
        const a = (1 - p.life / p.max) * 0.5;
        return <View key={`s${i}`} style={{ position: 'absolute', left: width/2 + p.x - p.r, top: p.y - p.r, width: p.r*2, height: p.r*2, borderRadius: p.r, backgroundColor: `rgba(160,160,170,${a})` }} />;
      })}
      {pools.flame.map((p, i) => {
        const a = (1 - p.life / p.max) * 0.6;
        return <View key={`f${i}`} style={{ position: 'absolute', left: width/2 + p.x - p.r, top: p.y - p.r, width: p.r*2, height: p.r*2, borderRadius: p.r, backgroundColor: `rgba(255,160,60,${a})` }} />;
      })}
      {pools.sparks.map((p, i) => {
        const a = 1 - p.life / p.max;
        return <View key={`k${i}`} style={{ position: 'absolute', left: width/2 + p.x, top: p.y, width: 2, height: 2, backgroundColor: `rgba(255,200,80,${a})` }} />;
      })}
      {pools.embers.map((p, i) => {
        const a = 1 - p.life / p.max;
        return <View key={`e${i}`} style={{ position: 'absolute', left: width/2 + p.x - p.r, top: p.y - p.r, width: p.r*2, height: p.r*2, borderRadius: p.r, backgroundColor: `rgba(255,180,80,${a})` }} />;
      })}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// GAUGE
// ──────────────────────────────────────────────────────────────
function Gauge({ label, value, pct, hot }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(anim, { toValue: pct, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [pct]);
  return (
    <View style={s.gauge}>
      <Text style={s.gaugeLabel}>{label}</Text>
      <Text style={[s.gaugeValue, hot && { color: C.btc }]}>{value}</Text>
      <View style={s.gaugeBar}>
        <Animated.View style={[s.gaugeFill, { height: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// TICKER
// ──────────────────────────────────────────────────────────────
function Ticker() {
  const x = useRef(new Animated.Value(0)).current;
  const W = Dimensions.get('window').width;
  useEffect(() => {
    Animated.loop(Animated.timing(x, { toValue: -W*2, duration: 32000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [W]);
  const items = [['BLOCK','887,432'], ['FEE','4 SAT/VB'], ['MEMPOOL','1.18 GB'], ['HASHRATE','624 EH/S'], ['HALVING','1,247 BLOCKS'], ['SUPPLY','19.85M / 21M']];
  return (
    <View style={s.ticker}>
      <View style={s.tickerLed} />
      <View style={{ overflow: 'hidden', flex: 1 }}>
        <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
          {[...items, ...items, ...items].map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', marginRight: 28 }}>
              <Text style={s.tickerKey}>{it[0]}</Text>
              <Text style={s.tickerVal}>{it[1]}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// ADD WALLET MODAL
// ──────────────────────────────────────────────────────────────
function AddWalletModal({ visible, onClose, onAdd }) {
  const [input, setInput] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const kind = detectKind(input);

  const reset = () => { setInput(''); setLabel(''); setError(null); setSaving(false); };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await onAdd(input.trim(), label.trim() || 'Wallet');
      reset();
      onClose();
    } catch (e) {
      setError(e.message || 'Could not connect wallet');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={s.awSheet}>
            <View style={s.awHeader}>
              <View style={s.awHandle} />
              <View style={{ flex: 1 }}>
                <Text style={s.lbTitle}>CONNECT WALLET</Text>
                <Text style={s.lbSub}>Read-only · No keys leave your device</Text>
              </View>
              <Pressable onPress={handleClose} style={s.lbCloseBtn}><Text style={s.lbCloseTxt}>CANCEL</Text></Pressable>
            </View>

            <View style={{ padding: 18 }}>
              <Text style={s.fieldLabel}>LABEL</Text>
              <TextInput
                style={s.input}
                value={label}
                onChangeText={setLabel}
                placeholder="Cold storage"
                placeholderTextColor={C.ink4}
                autoCapitalize="words"
              />

              <Text style={[s.fieldLabel, { marginTop: 18 }]}>XPUB OR BTC ADDRESS</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                value={input}
                onChangeText={setInput}
                placeholder="xpub6... or bc1q..."
                placeholderTextColor={C.ink4}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              {kind && <Text style={s.detected}>DETECTED · {kind.toUpperCase()}</Text>}

              {error && <Text style={s.error}>{error}</Text>}

              <Text style={s.privacy}>
                BTCROCKET only reads public balance data. Never paste a seed phrase or private key here. xpubs reveal your wallet's transaction history — use a dedicated watch-only xpub if you have privacy concerns.
              </Text>

              <Pressable
                style={[s.connectBtn, (!kind || saving) && s.connectBtnDisabled]}
                disabled={!kind || saving}
                onPress={handleSave}
              >
                {saving ? <ActivityIndicator color="#000" /> : <Text style={s.connectTxt}>{kind ? 'CONNECT' : 'PASTE WALLET ABOVE'}</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// WALLETS LIST MODAL
// ──────────────────────────────────────────────────────────────
function WalletsModal({ visible, onClose, wallets, onRemove, onAdd, onRefresh, refreshing }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[s.lbSheet, { height: '78%', position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
          <View style={s.lbHeader}>
            <View style={s.lbHandle} />
            <View style={{ flex: 1 }}>
              <Text style={s.lbTitle}>YOUR WALLETS</Text>
              <Text style={s.lbSub}>{wallets.length} CONNECTED · Read-only</Text>
            </View>
            <Pressable onPress={onClose} style={s.lbCloseBtn}><Text style={s.lbCloseTxt}>CLOSE</Text></Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {wallets.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, letterSpacing: 2 }}>NO WALLETS CONNECTED</Text>
              </View>
            )}
            {wallets.map((w) => (
              <View key={w.id} style={s.walletRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.walletLabel}>{w.label}</Text>
                  <Text style={s.walletSource}>{w.source.kind.toUpperCase()} · {w.source.value.slice(0, 10)}…{w.source.value.slice(-6)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.walletSats}>{w.sats === null ? '—' : fmtShortSats(w.sats)}</Text>
                  <Pressable onPress={() => onRemove(w.id)}>
                    <Text style={s.removeTxt}>REMOVE</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={{ flexDirection: 'row', gap: 10, padding: 18 }}>
              <Pressable style={[s.connectBtn, { flex: 1 }]} onPress={onAdd}>
                <Text style={s.connectTxt}>+ ADD WALLET</Text>
              </Pressable>
              {wallets.length > 0 && (
                <Pressable style={[s.connectBtn, s.refreshBtn]} onPress={onRefresh} disabled={refreshing}>
                  {refreshing ? <ActivityIndicator color={C.btc} /> : <Text style={[s.connectTxt, { color: C.btc }]}>REFRESH ↻</Text>}
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────
// LEADERBOARD
// ──────────────────────────────────────────────────────────────
function Leaderboard({ visible, onClose, yourSats }) {
  const merged = useMemo(() => {
    const a = [...PEERS, { name: 'YOU', sats: yourSats, you: true }];
    a.sort((x, y) => y.sats - x.sats);
    return a;
  }, [yourSats]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[s.lbSheet, { height: '92%', position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
          <View style={s.lbHeader}>
            <View style={s.lbHandle} />
            <View style={{ flex: 1 }}>
              <Text style={s.lbTitle}>LEADERBOARD</Text>
              <Text style={s.lbSub}>Global · Tier ranked</Text>
            </View>
            <Pressable onPress={onClose} style={s.lbCloseBtn}><Text style={s.lbCloseTxt}>CLOSE</Text></Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {merged.map((entry, i) => {
              const rank = i + 1;
              const bucket = bucketForSats(entry.sats);
              return (
                <View key={entry.name + i} style={[s.lbRow, entry.you && s.lbRowYou]}>
                  <Text style={[s.lbRank, entry.you && { color: C.btc }]}>#{rank.toLocaleString('en-GB')}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.lbName, entry.you && { color: C.btcHot }]}>{entry.name}{entry.you ? '  · YOU' : ''}</Text>
                    <View style={s.lbTierRow}>
                      <View style={[s.lbBadge, BADGE_COLORS[bucket]]} />
                      <Text style={s.lbTierName}>{STATES[bucket].label}</Text>
                    </View>
                  </View>
                  <Text style={s.lbSats}>{fmtShortSats(entry.sats)}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const BADGE_COLORS = [
  { backgroundColor: C.ink4 }, { backgroundColor: C.ink3 }, { backgroundColor: '#999' },
  { backgroundColor: C.btcDeep }, { backgroundColor: C.btc }, { backgroundColor: C.btcHot },
  { backgroundColor: '#fff5a0' },
];

// ──────────────────────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_500Medium, Geist_700Bold, Geist_900Black,
    IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_700Bold,
  });
  // 2s timeout — render with system fonts if Google Fonts CDN is slow/blocked.
  const [bootTimeoutFired, setBootTimeoutFired] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setBootTimeoutFired(true), 2000);
    return () => clearTimeout(id);
  }, []);
  const canRender = fontsLoaded || fontError || bootTimeoutFired;

  const [wallets, setWallets] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [walletsOpen, setWalletsOpen] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Demo override — set by the − / + side steppers. When non-null, the hero
  // shows this sats value instead of the wallet sum. Cleared on wallet ops.
  const [demoSats, setDemoSats] = useState(null);

  const liveSats = wallets.reduce((sum, w) => sum + (w.sats || 0), 0);
  const totalSats = demoSats !== null ? demoSats : liveSats;
  const stateIdx = bucketForSats(totalSats);
  const stepDemo = (dir) => {
    const next = Math.max(0, Math.min(STATES.length - 1, stateIdx + dir));
    setDemoSats(STATES[next].threshold);
  };
  const cur = STATES[stateIdx];

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const prevTotalRef = useRef(totalSats);

  // pulse the number when total changes
  useEffect(() => {
    const prev = prevTotalRef.current;
    if (totalSats !== prev) {
      const up = totalSats > prev;
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: up ? 1.08 : 0.94, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      flashAnim.setValue(1);
      Animated.timing(flashAnim, { toValue: 0, duration: 360, useNativeDriver: true }).start();
      prevTotalRef.current = totalSats;
    }
  }, [totalSats]);

  const win = Dimensions.get('window');
  const heroH = Math.min(win.height * 0.58, 560);
  const rocketW = win.width - 120;
  const anchorY = heroH * 0.74;
  const pools = useParticles(stateIdx, anchorY);

  const addWallet = useCallback(async (input, label) => {
    const kind = detectKind(input);
    if (!kind) throw new Error('Not a recognised xpub or BTC address');
    const source = { kind, value: input };
    const sats = await fetchBalanceSats(source);
    setWallets(ws => [...ws, { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, label, source, sats, fetchedAt: Date.now() }]);
    setDemoSats(null); // wallet data takes over from any demo override
  }, []);

  const removeWallet = useCallback((id) => {
    setWallets(ws => ws.filter(w => w.id !== id));
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setDemoSats(null);
    const updated = await Promise.all(wallets.map(async (w) => {
      try {
        const sats = await fetchBalanceSats(w.source);
        return { ...w, sats, fetchedAt: Date.now() };
      } catch { return w; }
    }));
    setWallets(updated);
    setRefreshing(false);
  }, [wallets]);

  // auto refresh every 5 minutes when foregrounded
  useEffect(() => {
    if (wallets.length === 0) return;
    const id = setInterval(() => refreshAll(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [wallets.length, refreshAll]);

  const fx = cur.fx;
  const thrustPct = (fx.flame / 10) * 100;
  const fuelPct = Math.min(100, ((fx.smoke + fx.flame + fx.embers) / 30) * 100);
  const psiPct = Math.min(100, ((fx.flame + fx.sparks) / 20) * 100);
  const tempPct = Math.min(100, (fx.flame / 10) * 100);

  const youRank = PEERS.filter(p => p.sats > totalSats).length + 1;

  if (!canRender) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.btc, fontSize: 12, letterSpacing: 4 }}>BOOTING…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <Ticker />

      <View style={s.header}>
        <View>
          <Text style={s.brand}>BTC<Text style={{ color: C.btc }}>/</Text>ROCKET</Text>
          <Text style={s.brandSub}>MISSION CONTROL · V0.4</Text>
        </View>
        <Pressable style={s.rankPill} onPress={() => setLbOpen(true)}>
          <Text style={s.rankPillKey}>RANK</Text>
          <Text style={s.rankPillVal}>#{youRank.toLocaleString('en-GB')}</Text>
          <Text style={s.rankPillKey}>↗</Text>
        </Pressable>
      </View>

      <View style={[s.hero, { height: heroH }]}>
        <View style={s.gutterLeft}>
          <Pressable
            style={({ pressed }) => [s.stepperBtn, stateIdx === 0 && s.stepperBtnDim, pressed && s.stepperBtnPressed]}
            onPress={() => stepDemo(-1)}
            disabled={stateIdx === 0}
          >
            <Text style={s.stepperTxt}>−</Text>
          </Pressable>
          <Gauge label="THR" value={String(Math.round(thrustPct)).padStart(3,'0')} pct={thrustPct} hot={thrustPct > 50} />
          <Gauge label="FUEL" value={(fuelPct/10).toFixed(1)} pct={fuelPct} hot={fuelPct > 50} />
        </View>
        <View style={s.heroCenter}>
          <Rocket stateIdx={stateIdx} width={rocketW} height={heroH} />
          <ParticleLayer pools={pools} width={rocketW} anchorY={anchorY} />
          <View style={s.overlay} pointerEvents="none">
            <Text style={s.frameTop}>┌─ YOUR STACK ─┐</Text>
            <Text style={s.stackLabel}>{wallets.length > 0 ? 'LIVE · MEMPOOL.SPACE' : 'CONNECT TO BEGIN'}</Text>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Text style={s.btcAmount}>
                <Text style={s.btcSymbol}>₿</Text> {fmtBtc(totalSats)}
              </Text>
            </Animated.View>
            <Text style={s.satsSub}>{fmtSats(totalSats)} <Text style={s.satsUnit}>SATS</Text></Text>
            <View style={[s.statusPanel, stateIdx >= 4 && s.statusPanelHot]}>
              <View style={[s.statusDot, stateIdx >= 4 && s.statusDotHot]} />
              <Text style={[s.statusText, stateIdx >= 4 && { color: C.btc }]}>
                {cur.label} · STATE {String(stateIdx).padStart(2,'0')}
              </Text>
            </View>
            <View style={s.pips}>
              {STATES.map((_, i) => (
                <View key={i} style={[s.pip, i <= stateIdx && s.pipOn]} />
              ))}
            </View>
            <Text style={s.frameBot}>└─ {wallets.length} {wallets.length === 1 ? 'WALLET' : 'WALLETS'} ─┘</Text>
          </View>
        </View>
        <View style={s.gutterRight}>
          <Pressable
            style={({ pressed }) => [s.stepperBtn, stateIdx === STATES.length - 1 && s.stepperBtnDim, pressed && s.stepperBtnPressed]}
            onPress={() => stepDemo(+1)}
            disabled={stateIdx === STATES.length - 1}
          >
            <Text style={s.stepperTxt}>+</Text>
          </Pressable>
          <Gauge label="PSI" value={String(Math.round(psiPct * 4.7)).padStart(3,'0')} pct={psiPct} hot={psiPct > 50} />
          <Gauge label="TEMP" value={String(Math.round(72 + tempPct * 28)).padStart(3,'0')} pct={tempPct} hot={tempPct > 50} />
        </View>
      </View>

      <View style={s.actionWrap}>
        {wallets.length === 0 ? (
          <Pressable style={({ pressed }) => [s.action, pressed && s.actionPressed]} onPress={() => setAddOpen(true)}>
            <Text style={s.actionLabel}>+ CONNECT WALLET</Text>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={({ pressed }) => [s.action, { flex: 1 }, pressed && s.actionPressed]} onPress={refreshAll} disabled={refreshing}>
              {refreshing
                ? <ActivityIndicator color="#000" />
                : <Text style={s.actionLabel}>REFRESH ↻</Text>}
            </Pressable>
            <Pressable style={({ pressed }) => [s.action, s.actionSecondary, pressed && s.actionPressed]} onPress={() => setWalletsOpen(true)}>
              <Text style={[s.actionLabel, { color: C.btc }]}>{wallets.length}</Text>
            </Pressable>
          </View>
        )}
        <View style={s.actionMeta}>
          <Text style={s.actionHint}>{wallets.length === 0 ? 'PASTE XPUB OR BTC ADDRESS' : `${wallets.length} WALLET${wallets.length === 1 ? '' : 'S'} · AUTO-SYNC 5MIN`}</Text>
          <Text style={s.actionHint}>READ-ONLY</Text>
        </View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[s.flash, {
          opacity: flashAnim,
          backgroundColor: 'rgba(247,147,26,0.18)',
        }]}
      />

      <AddWalletModal visible={addOpen} onClose={() => setAddOpen(false)} onAdd={addWallet} />
      <WalletsModal
        visible={walletsOpen}
        onClose={() => setWalletsOpen(false)}
        wallets={wallets}
        onRemove={removeWallet}
        onAdd={() => { setWalletsOpen(false); setAddOpen(true); }}
        onRefresh={refreshAll}
        refreshing={refreshing}
      />
      <Leaderboard visible={lbOpen} onClose={() => setLbOpen(false)} yourSats={totalSats} />
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  ticker: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.rule, gap: 12 },
  tickerLed: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.btc, shadowColor: C.btc, shadowOpacity: 1, shadowRadius: 4 },
  tickerKey: { color: C.btc, fontFamily: 'IBMPlexMono_700Bold', fontSize: 10, letterSpacing: 1.4, marginRight: 4 },
  tickerVal: { color: C.ink2, fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, letterSpacing: 1.2 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.rule },
  brand: { color: C.ink, fontFamily: 'Geist_900Black', fontSize: 14, letterSpacing: -0.2 },
  brandSub: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 9, letterSpacing: 2.4, marginTop: 2 },
  rankPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.btc },
  rankPillKey: { color: C.btc, fontFamily: 'IBMPlexMono_700Bold', fontSize: 10, letterSpacing: 1.6 },
  rankPillVal: { color: C.btc, fontFamily: 'IBMPlexMono_700Bold', fontSize: 11, letterSpacing: 1 },

  hero: { flexDirection: 'row', position: 'relative' },
  heroCenter: { flex: 1, position: 'relative' },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },

  gutterLeft: { width: 60, borderRightWidth: 1, borderRightColor: C.rule, paddingVertical: 14, gap: 14, alignItems: 'center' },
  gutterRight: { width: 60, borderLeftWidth: 1, borderLeftColor: C.rule, paddingVertical: 14, gap: 14, alignItems: 'center' },
  stepperBtn: {
    width: 44, height: 44,
    backgroundColor: C.btc,
    alignItems: 'center', justifyContent: 'center',
    // brutalist: square corners, key-press shadow
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 0, shadowOffset: { width: 0, height: 3 },
  },
  stepperBtnDim: { backgroundColor: C.bg3 },
  stepperBtnPressed: { transform: [{ translateY: 2 }] },
  stepperTxt: { color: '#000', fontFamily: 'Geist_900Black', fontSize: 28, lineHeight: 28, includeFontPadding: false },
  gauge: { alignItems: 'center', gap: 4 },
  gaugeLabel: { color: C.ink4, fontFamily: 'IBMPlexMono_500Medium', fontSize: 8, letterSpacing: 1.6 },
  gaugeValue: { color: C.ink, fontFamily: 'IBMPlexMono_700Bold', fontSize: 11 },
  gaugeBar: { width: 4, height: 56, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.rule, overflow: 'hidden', justifyContent: 'flex-end' },
  gaugeFill: { width: '100%', backgroundColor: C.btc },

  frameTop: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 9, letterSpacing: 2.4, marginBottom: 4 },
  stackLabel: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, letterSpacing: 3.5, marginBottom: 6 },
  btcAmount: { color: C.btc, fontFamily: 'Geist_900Black', fontSize: 56, letterSpacing: -2.4, textShadowColor: 'rgba(247,147,26,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 },
  btcSymbol: { color: C.btcHot, fontFamily: 'Geist_900Black' },
  satsSub: { color: C.ink2, fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, letterSpacing: 2, marginTop: 14, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  satsUnit: { color: C.ink4 },
  statusPanel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.rule, marginTop: 14, backgroundColor: 'rgba(0,0,0,0.55)' },
  statusPanelHot: { borderColor: C.btc },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.ink3 },
  statusDotHot: { backgroundColor: C.btc },
  statusText: { color: C.ink2, fontFamily: 'IBMPlexMono_700Bold', fontSize: 10, letterSpacing: 2.6 },
  pips: { flexDirection: 'row', gap: 4, marginTop: 14 },
  pip: { width: 22, height: 3, backgroundColor: C.bg3 },
  pipOn: { backgroundColor: C.btc },
  frameBot: { color: C.btc, fontFamily: 'IBMPlexMono_500Medium', fontSize: 9, letterSpacing: 2.4, marginTop: 12 },

  actionWrap: { padding: 14, borderTopWidth: 1, borderTopColor: C.rule },
  action: { backgroundColor: C.btc, paddingVertical: 22, alignItems: 'center', justifyContent: 'center' },
  actionSecondary: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.btc, paddingHorizontal: 28 },
  actionPressed: { transform: [{ translateY: 3 }] },
  actionLabel: { color: '#000', fontFamily: 'Geist_900Black', fontSize: 16, letterSpacing: 3 },
  actionMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionHint: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 9, letterSpacing: 1.8 },
  flash: { ...StyleSheet.absoluteFillObject },

  awSheet: { backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.btc, maxHeight: '90%' },
  awHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.rule },
  awHandle: { width: 24, height: 3, backgroundColor: C.btc },

  fieldLabel: { color: C.ink3, fontFamily: 'IBMPlexMono_700Bold', fontSize: 10, letterSpacing: 2.4 },
  input: { color: C.ink, fontFamily: 'IBMPlexMono_500Medium', fontSize: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.rule, paddingHorizontal: 14, paddingVertical: 12, marginTop: 6 },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  detected: { color: C.btc, fontFamily: 'IBMPlexMono_700Bold', fontSize: 10, letterSpacing: 2, marginTop: 8 },
  error: { color: C.danger, fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, marginTop: 10, letterSpacing: 0.5 },
  privacy: { color: C.ink4, fontFamily: 'IBMPlexMono_400Regular', fontSize: 11, lineHeight: 18, marginTop: 18 },
  connectBtn: { marginTop: 18, backgroundColor: C.btc, paddingVertical: 18, alignItems: 'center' },
  connectBtnDisabled: { backgroundColor: C.bg3 },
  connectTxt: { color: '#000', fontFamily: 'Geist_900Black', fontSize: 14, letterSpacing: 2.5 },
  refreshBtn: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.btc },

  walletRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.bg3, gap: 12 },
  walletLabel: { color: C.ink, fontFamily: 'Geist_700Bold', fontSize: 14 },
  walletSource: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, letterSpacing: 1, marginTop: 3 },
  walletSats: { color: C.btc, fontFamily: 'IBMPlexMono_700Bold', fontSize: 13 },
  removeTxt: { color: C.danger, fontFamily: 'IBMPlexMono_700Bold', fontSize: 9, letterSpacing: 1.6, marginTop: 4 },

  lbSheet: { backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.btc },
  lbHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.rule },
  lbHandle: { width: 24, height: 3, backgroundColor: C.btc },
  lbTitle: { color: C.ink, fontFamily: 'Geist_900Black', fontSize: 14, letterSpacing: -0.2 },
  lbSub: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 9, letterSpacing: 2.4, marginTop: 2 },
  lbCloseBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.rule },
  lbCloseTxt: { color: C.ink2, fontFamily: 'IBMPlexMono_700Bold', fontSize: 10, letterSpacing: 1.4 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.bg3, gap: 14 },
  lbRowYou: { backgroundColor: 'rgba(247,147,26,0.1)', borderLeftWidth: 3, borderLeftColor: C.btc, paddingLeft: 15 },
  lbRank: { color: C.ink3, fontFamily: 'IBMPlexMono_700Bold', fontSize: 13, width: 48 },
  lbName: { color: C.ink, fontFamily: 'Geist_700Bold', fontSize: 14 },
  lbTierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  lbBadge: { width: 7, height: 7 },
  lbTierName: { color: C.ink3, fontFamily: 'IBMPlexMono_500Medium', fontSize: 9, letterSpacing: 1.6 },
  lbSats: { color: C.btc, fontFamily: 'IBMPlexMono_700Bold', fontSize: 13, letterSpacing: 0.4 },
});
