import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  RoundedRect,
  vec,
  Blur,
  Paint,
  Skia,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Tier } from './tiers';

type Props = {
  tier: Tier;
  width: number;
  height: number;
};

// Placeholder geometry. Designer replaces these primitives with real layered art.
// Composition order = z-order: site → atmosphere(back) → support → structure → engines → atmosphere(front) → camera FX.
// Each layer reads its intensity (0–10) from tier.layers and scales visual aggression.
export function Rocket({ tier, width, height }: Props) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [t]);

  const flicker = useDerivedValue(() => 0.85 + t.value * 0.3, [t]);

  const site = tier.layers.site ?? 0;
  const structure = tier.layers.structure ?? 0;
  const support = tier.layers.support ?? 0;
  const atmosphere = tier.layers.atmosphere ?? 0;
  const engines = tier.layers.engines ?? 0;
  const camera = tier.layers.camera ?? 0;

  const groundY = height * 0.82;
  const padCenterX = width / 2;
  const skyTop = useMemo(() => (site >= 7 ? '#06070d' : '#0a1929'), [site]);
  const skyBottom = useMemo(() => (site >= 7 ? '#1a1130' : '#3b5a82'), [site]);

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Canvas style={{ width, height }}>
        {/* SITE: sky gradient + ground */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[skyTop, skyBottom]}
          />
        </Rect>
        <Rect x={0} y={groundY} width={width} height={height - groundY}>
          <LinearGradient
            start={vec(0, groundY)}
            end={vec(0, height)}
            colors={['#2a1810', '#0a0604']}
          />
        </Rect>

        {/* SITE: floodlights (>= tier 12) */}
        {site >= 7 && (
          <Group opacity={0.6}>
            <Circle cx={padCenterX - 100} cy={groundY - 20} r={50}>
              <Paint><Blur blur={30} /></Paint>
              <LinearGradient
                start={vec(padCenterX - 100, groundY - 70)}
                end={vec(padCenterX - 100, groundY)}
                colors={['#fffae0', 'transparent']}
              />
            </Circle>
            <Circle cx={padCenterX + 100} cy={groundY - 20} r={50}>
              <Paint><Blur blur={30} /></Paint>
              <LinearGradient
                start={vec(padCenterX + 100, groundY - 70)}
                end={vec(padCenterX + 100, groundY)}
                colors={['#fffae0', 'transparent']}
              />
            </Circle>
          </Group>
        )}

        {/* ATMOSPHERE (back): smoke cloud behind the pad */}
        {atmosphere >= 4 && (
          <Group opacity={Math.min(0.65, atmosphere * 0.08)}>
            <Circle cx={padCenterX - 60} cy={groundY - 10} r={70 + atmosphere * 6}>
              <Paint><Blur blur={40} /></Paint>
              <LinearGradient
                start={vec(0, groundY - 100)}
                end={vec(0, groundY + 20)}
                colors={['#d8d8d8', '#6a6a6a']}
              />
            </Circle>
            <Circle cx={padCenterX + 60} cy={groundY - 10} r={70 + atmosphere * 6}>
              <Paint><Blur blur={40} /></Paint>
              <LinearGradient
                start={vec(0, groundY - 100)}
                end={vec(0, groundY + 20)}
                colors={['#d8d8d8', '#6a6a6a']}
              />
            </Circle>
          </Group>
        )}

        {/* SUPPORT: concrete pad */}
        {support >= 3 && (
          <RoundedRect
            x={padCenterX - 90}
            y={groundY - 12}
            width={180}
            height={14}
            r={3}
            color="#8a8a8a"
          />
        )}

        {/* SUPPORT: gantry tower */}
        {support >= 5 && (
          <Group>
            <Rect x={padCenterX + 70} y={groundY - 220 - support * 8} width={6} height={220 + support * 8} color="#3a3a3a" />
            <Rect x={padCenterX + 70} y={groundY - 100} width={40} height={4} color="#3a3a3a" />
            <Rect x={padCenterX + 70} y={groundY - 160} width={40} height={4} color="#3a3a3a" />
            <Rect x={padCenterX + 70} y={groundY - 200} width={40} height={4} color="#3a3a3a" />
          </Group>
        )}

        {/* STRUCTURE: rocket body — height/segments scale with structure intensity */}
        {structure >= 1 && (
          <Group>
            {/* Main tank */}
            <RoundedRect
              x={padCenterX - 22}
              y={groundY - 12 - structure * 22}
              width={44}
              height={structure * 22}
              r={6}
              color="#e8e8ec"
            />
            {/* Mid-band stripe */}
            {structure >= 4 && (
              <Rect
                x={padCenterX - 22}
                y={groundY - 12 - structure * 14}
                width={44}
                height={4}
                color="#ff6b35"
              />
            )}
            {/* Second stage */}
            {structure >= 5 && (
              <RoundedRect
                x={padCenterX - 18}
                y={groundY - 12 - structure * 22 - 40}
                width={36}
                height={40}
                r={5}
                color="#dcdce0"
              />
            )}
            {/* Capsule / fairing */}
            {structure >= 6 && (
              <Group>
                <RoundedRect
                  x={padCenterX - 14}
                  y={groundY - 12 - structure * 22 - 70}
                  width={28}
                  height={30}
                  r={14}
                  color="#cfcfd4"
                />
              </Group>
            )}
            {/* Boosters */}
            {structure >= 9 && (
              <>
                <RoundedRect
                  x={padCenterX - 50}
                  y={groundY - 12 - structure * 18}
                  width={20}
                  height={structure * 18}
                  r={4}
                  color="#d0d0d4"
                />
                <RoundedRect
                  x={padCenterX + 30}
                  y={groundY - 12 - structure * 18}
                  width={20}
                  height={structure * 18}
                  r={4}
                  color="#d0d0d4"
                />
              </>
            )}
          </Group>
        )}

        {/* ENGINES: glow then flame */}
        {engines >= 2 && (
          <Group opacity={flicker}>
            <Circle cx={padCenterX} cy={groundY - 8} r={14 + engines * 2}>
              <Paint><Blur blur={12} /></Paint>
              <LinearGradient
                start={vec(0, groundY - 30)}
                end={vec(0, groundY + 10)}
                colors={engines >= 6 ? ['#fff5a0', '#ff8a3a', '#c92c2c'] : ['#ff6f2c', '#7a1010']}
              />
            </Circle>
          </Group>
        )}
        {engines >= 4 && (
          <Group opacity={flicker}>
            {/* Flame plume */}
            <RoundedRect
              x={padCenterX - 10}
              y={groundY - 6}
              width={20}
              height={engines * 14}
              r={10}
              color="#ffb84a"
            />
            <RoundedRect
              x={padCenterX - 6}
              y={groundY - 4}
              width={12}
              height={engines * 18}
              r={6}
              color="#ffe9a8"
            />
          </Group>
        )}
        {/* Booster engines */}
        {engines >= 9 && structure >= 9 && (
          <Group opacity={flicker}>
            <RoundedRect x={padCenterX - 46} y={groundY - 6} width={12} height={engines * 10} r={6} color="#ffb84a" />
            <RoundedRect x={padCenterX + 34} y={groundY - 6} width={12} height={engines * 10} r={6} color="#ffb84a" />
          </Group>
        )}

        {/* ATMOSPHERE (front): steam wisps */}
        {atmosphere >= 2 && (
          <Group opacity={Math.min(0.5, atmosphere * 0.06)}>
            <Circle cx={padCenterX - 30} cy={groundY - 80} r={20 + atmosphere * 3}>
              <Paint><Blur blur={18} /></Paint>
              <LinearGradient
                start={vec(0, groundY - 100)}
                end={vec(0, groundY - 60)}
                colors={['#ffffff', 'transparent']}
              />
            </Circle>
            <Circle cx={padCenterX + 30} cy={groundY - 120} r={20 + atmosphere * 3}>
              <Paint><Blur blur={18} /></Paint>
              <LinearGradient
                start={vec(0, groundY - 140)}
                end={vec(0, groundY - 100)}
                colors={['#ffffff', 'transparent']}
              />
            </Circle>
          </Group>
        )}

        {/* CAMERA: vignette + shake (shake is in the screen layer, not here) */}
        {camera >= 5 && (
          <Rect x={0} y={0} width={width} height={height}>
            <Paint><Blur blur={2} /></Paint>
            <LinearGradient
              start={vec(width / 2, height / 2)}
              end={vec(0, 0)}
              colors={['transparent', 'rgba(0,0,0,0.5)']}
            />
          </Rect>
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
