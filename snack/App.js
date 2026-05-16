// BTCROCKET · Mission Control · Expo Snack build
// Paste into https://snack.expo.dev — Snack auto-detects deps from imports.
// Tested target: Expo SDK 51.
//
// Aesthetic lock:
//   - Geist + Geist Mono via @expo-google-fonts (free, distinctive, not Inter/Roboto)
//   - Palette: #000 black + #f7931a Bitcoin orange + #fff. Nothing else.
//   - SVG rocket (vector, not Skia — guaranteed Snack compatibility)
//   - Animated.View particle pool for smoke/sparks/embers/flame
//   - Brutalist, mission-control vibe throughout

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient as SvgRadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useFonts, Geist_500Medium, Geist_700Bold, Geist_900Black } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_700Bold } from '@expo-google-fonts/geist-mono';

// ──────────────────────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────────────────────
const C = {
  bg: '#000000',
  bg1: '#0a0a0a',
  bg2: '#141414',
  bg3: '#1f1f1f',
  rule: '#333333',
  ink: '#ffffff',
  ink2: '#c8c8c8',
  ink3: '#7a7a7a',
  ink4: '#404040',
  btc: '#f7931a',
  btcHot: '#ffb13f',
  btcDeep: '#c77100',
};

// ──────────────────────────────────────────────────────────────
// DATA — 7 flame states. The 50-tier ladder lives in the RN
// scaffold; this prototype uses 7 visible jumps for clarity.
// ──────────────────────────────────────────────────────────────
const STATES = [
  { name: 'DEAD',         label: 'DEAD ROCKET',          sats: 0,             fx: { smoke: 0,  sparks: 0,  flame: 0,  embers: 0 } },
  { name: 'IGNITION',     label: 'IGNITION SEQUENCE',    sats: 100_000,       fx: { smoke: 1,  sparks: 1,  flame: 0,  embers: 0 } },
  { name: 'SMOKING',      label: 'SMOKING',              sats: 1_000_000,     fx: { smoke: 4,  sparks: 0,  flame: 0,  embers: 0 } },
  { name: 'SPARKING',     label: 'SPARKING',             sats: 10_000_000,    fx: { smoke: 3,  sparks: 6,  flame: 1,  embers: 2 } },
  { name: 'BLASTING',     label: 'BLASTING FLAMES',      sats: 100_000_000,   fx: { smoke: 5,  sparks: 3,  flame: 6,  embers: 4 } },
  { name: 'ROARING',      label: 'ROARING FLAMES',       sats: 1_000_000_000, fx: { smoke: 7,  sparks: 5,  flame: 8,  embers: 7 } },
  { name: 'MAXIMUM BURN', label: 'ROARING EVERYTHING',   sats: 10_000_000_000,fx: { smoke: 10, sparks: 10, flame: 10, embers: 10 } },
];

const PEERS = [
  { name: 'HODLForever2140', sats: 210_000_000_000 },
  { name: '21MillionMax',    sats: 168_000_000_000 },
  { name: 'CitadelMaximus',  sats:  98_400_000_000 },
  { name: 'diamond_hands',   sats:  64_200_000_000 },
  { name: 'SatoshisHeir',    sats:  41_800_000_000 },
  { name: 'OrangePilled',    sats:  18_900_000_000 },
  { name: 'low_time_pref',   sats:  12_400_000_000 },
  { name: 'NeverSellBottom', sats:   7_300_000_000 },
  { name: 'stack_til_dead',  sats:   4_900_000_000 },
  { name: 'csw_skeptic',     sats:   3_100_000_000 },
  { name: 'mempool_warrior', sats:   2_400_000_000 },
  { name: 'plebs_unite',     sats:   1_750_000_000 },
  { name: 'OPRETURN42',      sats:     920_000_000 },
  { name: 'cold_storage',    sats:     610_000_000 },
  { name: 'NodeRunner_UK',   sats:     410_000_000 },
  { name: 'multisig_or_die', sats:     290_000_000 },
  { name: 'KeyPair_94',      sats:     180_000_000 },
  { name: 'sat_stacker',     sats:     120_000_000 },
  { name: 'first_7M_sats',   sats:      72_400_000 },
  { name: 'taproot_enjoyer', sats:      48_200_000 },
  { name: 'sound_money_max', sats:      31_100_000 },
  { name: 'fiat_refugee',    sats:      19_800_000 },
  { name: 'BlockSpace4Life', sats:      12_400_000 },
  { name: 'satoshi_nak',     sats:       7_900_000 },
  { name: 'hashing_away',    sats:       4_700_000 },
  { name: 'orange_coin',     sats:       2_900_000 },
  { name: 'pleb_node_22',    sats:       1_650_000 },
  { name: 'first_M_sats',    sats:       1_050_000 },
  { name: 'just_a_few',      sats:         470_000 },
  { name: 'starting_my',     sats:         110_000 },
  { name: 'sat_curious',     sats:          42_000 },
];

// ──────────────────────────────────────────────────────────────
// FORMATTERS
// ──────────────────────────────────────────────────────────────
const fmtBtc = (sats) => (sats / 1e8).toFixed(8);
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
  for (let i = STATES.length - 1; i >= 0; i--) if (sats >= STATES[i].sats) return i;
  return 0;
};

// ──────────────────────────────────────────────────────────────
// PARTICLE POOL — capped count, recycled per frame
// ──────────────────────────────────────────────────────────────
const PARTICLE_LIMIT = { smoke: 18, sparks: 28, flame: 14, embers: 36 };

function useParticles(stateIdx, anchorY) {
  const [tick, setTick] = useState(0);
  const pools = useRef({ smoke: [], sparks: [], flame: [], embers: [] });

  useEffect(() => {
    const id = setInterval(() => {
      const fx = STATES[stateIdx].fx;
      const p = pools.current;

      // emit new
      const emit = (kind, intensity, factory) => {
        if (intensity <= 0) return;
        if (p[kind].length >= PARTICLE_LIMIT[kind]) return;
        const n = Math.min(2, Math.ceil(intensity * 0.18));
        for (let i = 0; i < n; i++) {
          if (p[kind].length >= PARTICLE_LIMIT[kind]) break;
          p[kind].push(factory(intensity));
        }
      };
      emit('smoke', fx.smoke, (intensity) => ({
        x: (Math.random() - 0.5) * 80,
        y: anchorY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.25 - Math.random() * 0.5 - intensity * 0.04,
        r: 14 + Math.random() * 12,
        life: 0, max: 100 + Math.random() * 60,
      }));
      emit('sparks', fx.sparks, (intensity) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = 2 + Math.random() * 4 + intensity * 0.3;
        return {
          x: (Math.random() - 0.5) * 14,
          y: anchorY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0, max: 26 + Math.random() * 18,
        };
      });
      emit('flame', fx.flame, (intensity) => ({
        x: (Math.random() - 0.5) * 18,
        y: anchorY,
        vy: -1.4 - Math.random() * 1.4 - intensity * 0.12,
        r: 12 + Math.random() * 8 + intensity * 1.2,
        life: 0, max: 22 + Math.random() * 12,
      }));
      emit('embers', fx.embers, () => ({
        x: (Math.random() - 0.5) * 50,
        y: anchorY + 6,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.6 + Math.random() * 2,
        r: 1 + Math.random() * 1.6,
        life: 0, max: 28 + Math.random() * 30,
      }));

      // step
      const stepArr = (arr, gravity) => {
        for (let i = arr.length - 1; i >= 0; i--) {
          const it = arr[i];
          it.x += it.vx || 0;
          it.y += it.vy;
          if (gravity) it.vy += gravity;
          if (it.r !== undefined && gravity === undefined) it.r += 0.25;
          it.life++;
          if (it.life > it.max) arr.splice(i, 1);
        }
      };
      stepArr(p.smoke);
      stepArr(p.sparks, 0.18);
      stepArr(p.flame);
      stepArr(p.embers);

      setTick((t) => (t + 1) % 1_000_000);
    }, 1000 / 30);
    return () => clearInterval(id);
  }, [stateIdx, anchorY]);

  return pools.current;
}

// ──────────────────────────────────────────────────────────────
// SVG ROCKET
// ──────────────────────────────────────────────────────────────
function Rocket({ stateIdx, width, height }) {
  const cx = width / 2;
  const engineY = height * 0.74;
  const bodyTop = height * 0.22;
  const bodyBot = engineY - 4;
  const bodyH = bodyBot - bodyTop;
  const bodyW = 26 + stateIdx * 4;
  const ascend = stateIdx >= 6 ? -10 : 0;

  if (stateIdx === 0) {
    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Rect
          x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH}
          stroke={C.btc} strokeOpacity={0.22} strokeWidth={1}
          strokeDasharray="3 3" fill="transparent"
        />
        <Path
          d={`M ${cx - bodyW / 2} ${bodyTop} L ${cx} ${bodyTop - 24} L ${cx + bodyW / 2} ${bodyTop}`}
          stroke={C.btc} strokeOpacity={0.22} strokeWidth={1}
          strokeDasharray="3 3" fill="transparent"
        />
      </Svg>
    );
  }

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgRadialGradient id="engineGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#fffaa0" stopOpacity={Math.min(1, (stateIdx - 2) * 0.3)} />
          <Stop offset="40%" stopColor="#ff8c28" stopOpacity={Math.min(1, (stateIdx - 2) * 0.18)} />
          <Stop offset="100%" stopColor="#7a1e0a" stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>

      {/* engine glow behind */}
      {stateIdx >= 3 && (
        <Circle cx={cx} cy={engineY - 2} r={28 + stateIdx * 3} fill="url(#engineGlow)" />
      )}

      <G transform={`translate(0, ${ascend})`}>
        {/* nose */}
        <Path
          d={`M ${cx - bodyW / 2} ${bodyTop} Q ${cx} ${bodyTop - 34} ${cx + bodyW / 2} ${bodyTop} Z`}
          fill="#dcdce0"
        />
        <Circle cx={cx} cy={bodyTop - 30} r={1.6} fill={C.btc} />

        {/* body */}
        <Rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill="#e8e8ec" />
        {/* shading */}
        <Rect x={cx + bodyW / 2 - 3} y={bodyTop + 4} width={3} height={bodyH - 8} fill="#000" opacity={0.18} />
        <Rect x={cx - bodyW / 2 + 2} y={bodyTop + 4} width={2} height={bodyH - 8} fill="#fff" opacity={0.4} />

        {/* BTC stripe */}
        {stateIdx >= 2 && (
          <>
            <Rect x={cx - bodyW / 2} y={bodyTop + bodyH * 0.18} width={bodyW} height={5} fill={C.btc} />
            <SvgText
              x={cx} y={bodyTop + bodyH * 0.18 + 4}
              fill="#000" fontSize={16} fontWeight="900"
              textAnchor="middle" alignmentBaseline="middle"
              fontFamily="Geist-Black"
            >
              ₿
            </SvgText>
          </>
        )}

        {/* center seam */}
        {stateIdx >= 3 && (
          <Path d={`M ${cx} ${bodyTop} L ${cx} ${bodyTop + bodyH}`} stroke="#000" strokeOpacity={0.16} strokeWidth={1} />
        )}

        {/* fins */}
        {stateIdx >= 3 && (
          <>
            <Path
              d={`M ${cx - bodyW / 2} ${bodyTop + bodyH - 22} L ${cx - bodyW / 2 - 14} ${bodyTop + bodyH + 4} L ${cx - bodyW / 2} ${bodyTop + bodyH + 4} Z`}
              fill="#b8b8c0"
            />
            <Path
              d={`M ${cx + bodyW / 2} ${bodyTop + bodyH - 22} L ${cx + bodyW / 2 + 14} ${bodyTop + bodyH + 4} L ${cx + bodyW / 2} ${bodyTop + bodyH + 4} Z`}
              fill="#b8b8c0"
            />
          </>
        )}

        {/* boosters */}
        {stateIdx >= 5 && (
          <>
            {[-(bodyW / 2 + 14), bodyW / 2 + 14].map((dx, i) => {
              const bW = 12, bH = bodyH * 0.65;
              const by = bodyTop + bodyH - bH;
              return (
                <G key={i}>
                  <Rect x={cx + dx - bW / 2} y={by} width={bW} height={bH} fill="#cfcfd4" />
                  <Path
                    d={`M ${cx + dx - bW / 2} ${by + 5} Q ${cx + dx} ${by - 9} ${cx + dx + bW / 2} ${by + 5} Z`}
                    fill="#cfcfd4"
                  />
                  <Rect x={cx + dx - bW / 2} y={by + bH * 0.4} width={bW} height={2} fill={C.btc} />
                </G>
              );
            })}
          </>
        )}
      </G>
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────
// PARTICLE LAYER — Animated.View pool above the rocket
// ──────────────────────────────────────────────────────────────
function ParticleLayer({ pools, width, height, anchorY }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* smoke */}
      {pools.smoke.map((p, i) => {
        const a = (1 - p.life / p.max) * 0.5;
        return (
          <View
            key={`s${i}`}
            style={{
              position: 'absolute',
              left: width / 2 + p.x - p.r,
              top: anchorY + p.y - anchorY - p.r,
              width: p.r * 2, height: p.r * 2,
              borderRadius: p.r,
              backgroundColor: `rgba(160,160,170,${a})`,
            }}
          />
        );
      })}
      {/* flame */}
      {pools.flame.map((p, i) => {
        const a = (1 - p.life / p.max) * 0.6;
        return (
          <View
            key={`f${i}`}
            style={{
              position: 'absolute',
              left: width / 2 + p.x - p.r,
              top: anchorY + (p.y - anchorY) - p.r,
              width: p.r * 2, height: p.r * 2,
              borderRadius: p.r,
              backgroundColor: `rgba(255,160,60,${a})`,
            }}
          />
        );
      })}
      {/* sparks */}
      {pools.sparks.map((p, i) => {
        const a = 1 - p.life / p.max;
        return (
          <View
            key={`k${i}`}
            style={{
              position: 'absolute',
              left: width / 2 + p.x,
              top: anchorY + (p.y - anchorY),
              width: 2, height: 2,
              backgroundColor: `rgba(255,200,80,${a})`,
            }}
          />
        );
      })}
      {/* embers */}
      {pools.embers.map((p, i) => {
        const a = 1 - p.life / p.max;
        return (
          <View
            key={`e${i}`}
            style={{
              position: 'absolute',
              left: width / 2 + p.x - p.r,
              top: anchorY + (p.y - anchorY) - p.r,
              width: p.r * 2, height: p.r * 2,
              borderRadius: p.r,
              backgroundColor: `rgba(255,180,80,${a})`,
            }}
          />
        );
      })}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// VERTICAL GAUGE
// ──────────────────────────────────────────────────────────────
function Gauge({ label, value, pct, hot }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={s.gauge}>
      <Text style={s.gaugeLabel}>{label}</Text>
      <Text style={[s.gaugeValue, hot && { color: C.btc }]}>{value}</Text>
      <View style={s.gaugeBar}>
        <Animated.View
          style={[
            s.gaugeFill,
            { height: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// BTC AMOUNT (with digit roll on change)
// ──────────────────────────────────────────────────────────────
function BtcAmount({ sats, scaleAnim }) {
  const str = fmtBtc(sats);
  const prev = useRef(str);
  // we re-render the whole text — easier than per-digit Animated, and the
  // text-shadow + scale pulse on the wrapper handles the visual "snap"
  prev.current = str;
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Text style={s.btcAmount}>
        <Text style={s.btcSymbol}>₿</Text> {str}
      </Text>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────────────
// TICKER — scrolling feed at the top
// ──────────────────────────────────────────────────────────────
function Ticker() {
  const x = useRef(new Animated.Value(0)).current;
  const W = Dimensions.get('window').width;
  useEffect(() => {
    const a = Animated.loop(
      Animated.timing(x, { toValue: -W * 2, duration: 32000, easing: Easing.linear, useNativeDriver: true })
    );
    a.start();
    return () => a.stop();
  }, [W]);
  const items = [
    ['BLOCK', '887,432'],
    ['FEE', '4 SAT/VB'],
    ['MEMPOOL', '1.18 GB'],
    ['HASHRATE', '624 EH/S'],
    ['HALVING', '1,247 BLOCKS'],
    ['SUPPLY', '19.85M / 21M'],
  ];
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
// LEADERBOARD SHEET
// ──────────────────────────────────────────────────────────────
function Leaderboard({ visible, onClose, yourSats }) {
  const merged = useMemo(() => {
    const a = [...PEERS, { name: 'YOU', sats: yourSats, you: true }];
    a.sort((x, y) => y.sats - x.sats);
    return a;
  }, [yourSats]);

  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={s.lbBackdrop} onPress={onClose} />
      <Animated.View
        style={[
          s.lbSheet,
          {
            transform: [{
              translateY: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get('window').height, 0],
              })
            }],
          },
        ]}
      >
        <View style={s.lbHeader}>
          <View style={s.lbHandle} />
          <View style={{ flex: 1 }}>
            <Text style={s.lbTitle}>LEADERBOARD</Text>
            <Text style={s.lbSub}>Global · Tier ranked</Text>
          </View>
          <Pressable onPress={onClose} style={s.lbCloseBtn}>
            <Text style={s.lbCloseTxt}>CLOSE</Text>
          </Pressable>
        </View>

        <View style={s.lbTabs}>
          {['ALL TIME', '24H', '7D', 'FRIENDS'].map((t, i) => (
            <View key={t} style={[s.lbTab, i === 0 && s.lbTabActive]}>
              <Text style={[s.lbTabText, i === 0 && { color: C.btc }]}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={s.lbMeta}>
          <Text style={s.lbMetaText}>32 STACKERS · TIER-BUCKETED</Text>
          <Text style={s.lbMetaText}>LIVE</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {merged.map((entry, i) => {
            const rank = i + 1;
            const bucket = bucketForSats(entry.sats);
            const tierName = STATES[bucket].label;
            return (
              <View key={entry.name + i} style={[s.lbRow, entry.you && s.lbRowYou]}>
                <Text style={[s.lbRank, entry.you && { color: C.btc }]}>#{rank.toLocaleString('en-GB')}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.lbName, entry.you && { color: C.btcHot }]}>
                    {entry.name}{entry.you ? '  · YOU' : ''}
                  </Text>
                  <View style={s.lbTierRow}>
                    <View style={[s.lbBadge, BADGE_COLORS[bucket]]} />
                    <Text style={s.lbTierName}>{tierName}</Text>
                  </View>
                </View>
                <Text style={s.lbSats}>{fmtShortSats(entry.sats)}</Text>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const BADGE_COLORS = [
  { backgroundColor: C.ink4 },
  { backgroundColor: C.ink3 },
  { backgroundColor: '#999' },
  { backgroundColor: C.btcDeep },
  { backgroundColor: C.btc },
  { backgroundColor: C.btcHot },
  { backgroundColor: '#fff5a0' },
];

// ──────────────────────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Geist_500Medium,
    Geist_700Bold,
    Geist_900Black,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_700Bold,
  });

  const [stateIdx, setStateIdx] = useState(0);
  const [mode, setMode] = useState('buy'); // 'buy' | 'sell'
  const [lbOpen, setLbOpen] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Hero dimensions — driven by window size
  const win = Dimensions.get('window');
  const heroH = Math.min(win.height * 0.58, 560);
  const rocketW = win.width - 120; // leave room for gutters
  const anchorY = heroH * 0.74;

  const pools = useParticles(stateIdx, anchorY);

  const onTap = () => {
    const dir = mode === 'buy' ? +1 : -1;
    const next = Math.max(0, Math.min(STATES.length - 1, stateIdx + dir));
    const moved = next !== stateIdx;
    setStateIdx(next);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: dir > 0 ? 1.06 : 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    if (moved) {
      flashAnim.setValue(1);
      Animated.timing(flashAnim, { toValue: 0, duration: 320, useNativeDriver: true }).start();
    }

    setMode((m) => (m === 'buy' ? 'sell' : 'buy'));
  };

  const cur = STATES[stateIdx];
  const fx = cur.fx;
  const thrustPct = (fx.flame / 10) * 100;
  const fuelPct = Math.min(100, ((fx.smoke + fx.flame + fx.embers) / 30) * 100);
  const psiPct = Math.min(100, ((fx.flame + fx.sparks) / 20) * 100);
  const tempPct = Math.min(100, (fx.flame / 10) * 100);

  const youRank = PEERS.filter((p) => p.sats > cur.sats).length + 1;
  const next = STATES[stateIdx + (mode === 'buy' ? 1 : -1)];

  if (!fontsLoaded) {
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

      {/* header */}
      <View style={s.header}>
        <View>
          <Text style={s.brand}>BTC<Text style={{ color: C.btc }}>/</Text>ROCKET</Text>
          <Text style={s.brandSub}>MISSION CONTROL · V0.3</Text>
        </View>
        <Pressable style={s.rankPill} onPress={() => setLbOpen(true)}>
          <Text style={s.rankPillKey}>RANK</Text>
          <Text style={s.rankPillVal}>#{youRank.toLocaleString('en-GB')}</Text>
          <Text style={s.rankPillKey}>↗</Text>
        </Pressable>
      </View>

      {/* hero */}
      <View style={[s.hero, { height: heroH }]}>
        <View style={s.gutterLeft}>
          <Gauge label="THR" value={String(Math.round(thrustPct)).padStart(3, '0')} pct={thrustPct} hot={thrustPct > 50} />
          <Gauge label="FUEL" value={(fuelPct / 10).toFixed(1)} pct={fuelPct} hot={fuelPct > 50} />
        </View>

        <View style={s.heroCenter}>
          <Rocket stateIdx={stateIdx} width={rocketW} height={heroH} />
          <ParticleLayer pools={pools} width={rocketW} height={heroH} anchorY={anchorY} />

          {/* overlay text */}
          <View style={s.overlay} pointerEvents="none">
            <Text style={s.frameTop}>{'┌─ YOUR STACK ─┐'}</Text>
            <Text style={s.stackLabel}>LIVE · SATS-DENOMINATED</Text>
            <BtcAmount sats={cur.sats} scaleAnim={scaleAnim} />
            <Text style={s.satsSub}>{fmtSats(cur.sats)} <Text style={s.satsUnit}>SATS</Text></Text>
            <View style={[s.statusPanel, stateIdx >= 4 && s.statusPanelHot]}>
              <View style={[s.statusDot, stateIdx >= 4 && s.statusDotHot]} />
              <Text style={[s.statusText, stateIdx >= 4 && { color: C.btc }]}>
                {cur.label} · STATE {String(stateIdx).padStart(2, '0')}
              </Text>
            </View>
            <View style={s.pips}>
              {STATES.map((_, i) => (
                <View key={i} style={[s.pip, i <= stateIdx && s.pipOn]} />
              ))}
            </View>
            <Text style={s.frameBot}>{`└─ STATE ${String(stateIdx).padStart(2,'0')} / 06 ─┘`}</Text>
          </View>
        </View>

        <View style={s.gutterRight}>
          <Gauge label="PSI" value={String(Math.round(psiPct * 4.7)).padStart(3, '0')} pct={psiPct} hot={psiPct > 50} />
          <Gauge label="TEMP" value={String(Math.round(72 + tempPct * 28)).padStart(3, '0')} pct={tempPct} hot={tempPct > 50} />
        </View>
      </View>

      {/* action */}
      <View style={s.actionWrap}>
        <Pressable
          style={({ pressed }) => [
            s.action,
            mode === 'sell' && s.actionSell,
            pressed && s.actionPressed,
          ]}
          onPress={onTap}
        >
          <Text style={[s.actionLabel, mode === 'sell' && { color: '#000' }]}>
            {mode === 'buy' ? 'BUY BTC' : 'SELL BTC'} {mode === 'buy' ? '↑' : '↓'}
          </Text>
        </Pressable>
        <View style={s.actionMeta}>
          <Text style={s.actionHint}>{mode === 'buy' ? 'TAP TO STACK SATS' : 'TAP TO DUMP'}</Text>
          <Text style={s.actionHint}>
            {next ? `NEXT · ${next.label}` : 'AT LIMIT'}
          </Text>
        </View>
      </View>

      {/* flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.flash,
          {
            opacity: flashAnim,
            backgroundColor: mode === 'buy' ? 'rgba(247,147,26,0.18)' : 'rgba(255,255,255,0.14)',
          },
        ]}
      />

      <Leaderboard visible={lbOpen} onClose={() => setLbOpen(false)} yourSats={cur.sats} />
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ticker
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
    gap: 12,
  },
  tickerLed: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.btc,
    shadowColor: C.btc, shadowOpacity: 1, shadowRadius: 4,
  },
  tickerKey: {
    color: C.btc,
    fontFamily: 'GeistMono_700Bold',
    fontSize: 10,
    letterSpacing: 1.4,
    marginRight: 4,
  },
  tickerVal: {
    color: C.ink2,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 1.2,
  },

  // header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
  },
  brand: {
    color: C.ink,
    fontFamily: 'Geist_900Black',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  brandSub: {
    color: C.ink3,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.4,
    marginTop: 2,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.btc,
  },
  rankPillKey: { color: C.btc, fontFamily: 'GeistMono_700Bold', fontSize: 10, letterSpacing: 1.6 },
  rankPillVal: { color: C.btc, fontFamily: 'GeistMono_700Bold', fontSize: 11, letterSpacing: 1 },

  // hero
  hero: {
    flexDirection: 'row',
    position: 'relative',
  },
  heroCenter: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  // gutters
  gutterLeft: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: C.rule,
    paddingVertical: 16,
    gap: 18,
    alignItems: 'center',
  },
  gutterRight: {
    width: 60,
    borderLeftWidth: 1,
    borderLeftColor: C.rule,
    paddingVertical: 16,
    gap: 18,
    alignItems: 'center',
  },
  gauge: { alignItems: 'center', gap: 4 },
  gaugeLabel: { color: C.ink4, fontFamily: 'GeistMono_500Medium', fontSize: 8, letterSpacing: 1.6 },
  gaugeValue: { color: C.ink, fontFamily: 'GeistMono_700Bold', fontSize: 11 },
  gaugeBar: {
    width: 4, height: 56,
    backgroundColor: C.bg3,
    borderWidth: 1, borderColor: C.rule,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  gaugeFill: { width: '100%', backgroundColor: C.btc },

  // overlay text
  frameTop: {
    color: C.ink3,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.4,
    marginBottom: 4,
  },
  stackLabel: {
    color: C.ink3,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 10,
    letterSpacing: 3.5,
    marginBottom: 6,
  },
  btcAmount: {
    color: C.btc,
    fontFamily: 'Geist_900Black',
    fontSize: 60,
    letterSpacing: -2.4,
    textShadowColor: 'rgba(247,147,26,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  btcSymbol: { color: C.btcHot, fontFamily: 'Geist_900Black' },
  satsSub: {
    color: C.ink2,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 14,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  satsUnit: { color: C.ink4 },
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.rule,
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  statusPanelHot: { borderColor: C.btc },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.ink3 },
  statusDotHot: { backgroundColor: C.btc },
  statusText: {
    color: C.ink2,
    fontFamily: 'GeistMono_700Bold',
    fontSize: 10,
    letterSpacing: 2.6,
  },
  pips: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
  },
  pip: {
    width: 22, height: 3,
    backgroundColor: C.bg3,
  },
  pipOn: {
    backgroundColor: C.btc,
  },
  frameBot: {
    color: C.btc,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 2.4,
    marginTop: 12,
  },

  // action
  actionWrap: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: C.rule,
  },
  action: {
    backgroundColor: C.btc,
    paddingVertical: 22,
    alignItems: 'center',
    // brutalist: no border-radius
  },
  actionSell: {
    backgroundColor: C.ink,
  },
  actionPressed: {
    transform: [{ translateY: 3 }],
  },
  actionLabel: {
    color: '#000',
    fontFamily: 'Geist_900Black',
    fontSize: 18,
    letterSpacing: 3,
  },
  actionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionHint: {
    color: C.ink3,
    fontFamily: 'GeistMono_500Medium',
    fontSize: 9,
    letterSpacing: 1.8,
  },

  // flash
  flash: {
    ...StyleSheet.absoluteFillObject,
  },

  // leaderboard
  lbBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  lbSheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '92%',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.btc,
  },
  lbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
  },
  lbHandle: { width: 24, height: 3, backgroundColor: C.btc },
  lbTitle: { color: C.ink, fontFamily: 'Geist_900Black', fontSize: 14, letterSpacing: -0.2 },
  lbSub: { color: C.ink3, fontFamily: 'GeistMono_500Medium', fontSize: 9, letterSpacing: 2.4, marginTop: 2 },
  lbCloseBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.rule,
  },
  lbCloseTxt: { color: C.ink2, fontFamily: 'GeistMono_700Bold', fontSize: 10, letterSpacing: 1.4 },
  lbTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.rule,
    paddingHorizontal: 10,
  },
  lbTab: {
    paddingVertical: 14, paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  lbTabActive: { borderBottomColor: C.btc },
  lbTabText: { color: C.ink3, fontFamily: 'GeistMono_700Bold', fontSize: 10, letterSpacing: 2 },
  lbMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  lbMetaText: { color: C.ink4, fontFamily: 'GeistMono_500Medium', fontSize: 9, letterSpacing: 2 },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.bg3,
    gap: 14,
  },
  lbRowYou: {
    backgroundColor: 'rgba(247,147,26,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: C.btc,
    paddingLeft: 15,
  },
  lbRank: { color: C.ink3, fontFamily: 'GeistMono_700Bold', fontSize: 13, width: 48 },
  lbName: { color: C.ink, fontFamily: 'Geist_700Bold', fontSize: 14 },
  lbTierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  lbBadge: { width: 7, height: 7 },
  lbTierName: { color: C.ink3, fontFamily: 'GeistMono_500Medium', fontSize: 9, letterSpacing: 1.6 },
  lbSats: { color: C.btc, fontFamily: 'GeistMono_700Bold', fontSize: 13, letterSpacing: 0.4 },
});
