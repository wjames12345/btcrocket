export type LayerKey = 'site' | 'structure' | 'support' | 'atmosphere' | 'engines' | 'camera';

export type Tier = {
  index: number;
  name: string;
  threshold: number;
  milestone?: boolean;
  delta: string;
  layers: Partial<Record<LayerKey, number>>;
};

// Thresholds are in sats. Never re-denominate in fiat — see design principle #1.
// layers[k] is the intensity (0–10) of layer k at this tier. Higher = more dramatic.
// The Rocket renderer interpolates between consecutive tier states.
export const TIERS: readonly Tier[] = [
  { index: 0,  name: 'Dustpan',          threshold: 0,             delta: 'Empty desert, single dust devil',                       layers: { site: 1 } },
  { index: 1,  name: 'First Spark',      threshold: 1_000,         delta: 'Survey peg + orange flag planted',                      layers: { site: 1, support: 1 } },
  { index: 2,  name: 'Marked Plot',      threshold: 10_000,        delta: 'Survey grid, hard hat on a barrel',                     layers: { site: 2, support: 2 } },
  { index: 3,  name: 'Foundation Pour',  threshold: 50_000,        delta: 'Concrete pad, perimeter lights',                        layers: { site: 3, support: 3 } },
  { index: 4,  name: 'Steel Skeleton',   threshold: 100_000,       delta: 'Rebar grid, first steel frame',                         layers: { site: 3, structure: 1, support: 3 } },
  { index: 5,  name: 'Gantry Up',        threshold: 250_000,       delta: 'Full launch gantry tower',                              layers: { site: 4, structure: 1, support: 5 } },
  { index: 6,  name: 'Tank Arrival',     threshold: 500_000,       delta: 'First rocket tank delivered, horizontal',               layers: { site: 4, structure: 2, support: 5 } },
  { index: 7,  name: 'Stacked Stage',    threshold: 1_000_000,     milestone: true, delta: 'First stage hoisted vertical — it is a rocket', layers: { site: 5, structure: 4, support: 6 } },
  { index: 8,  name: 'Second Stage',     threshold: 2_500_000,     delta: 'Second stage stacked, taller silhouette',               layers: { site: 5, structure: 5, support: 6 } },
  { index: 9,  name: 'Capsule Mounted',  threshold: 5_000_000,     delta: 'Payload fairing on top, complete shape',                layers: { site: 5, structure: 6, support: 6 } },
  { index: 10, name: 'Fuel Hoses',       threshold: 10_000_000,    milestone: true, delta: 'Umbilicals connect, first vapour wisps',         layers: { site: 6, structure: 6, support: 7, atmosphere: 2 } },
  { index: 11, name: 'Cryo Steam',       threshold: 20_000_000,    delta: 'Heavy cryo steam cascading off tanks',                  layers: { site: 6, structure: 6, support: 7, atmosphere: 4 } },
  { index: 12, name: 'Floodlights',      threshold: 35_000_000,    delta: 'Night scene, floodlights blaze',                        layers: { site: 7, structure: 6, support: 8, atmosphere: 4, camera: 2 } },
  { index: 13, name: 'Engine Glow',      threshold: 50_000_000,    delta: 'Engine bells glow dull red',                            layers: { site: 7, structure: 6, support: 8, atmosphere: 5, engines: 2, camera: 2 } },
  { index: 14, name: 'Ignition Test',    threshold: 75_000_000,    delta: 'Short test-pulse of flame, smoke puff',                 layers: { site: 7, structure: 6, support: 8, atmosphere: 6, engines: 4, camera: 3 } },
  { index: 15, name: 'Engines Lit',      threshold: 100_000_000,   milestone: true, delta: 'Sustained flame, billowing smoke — wholecoiner', layers: { site: 8, structure: 7, support: 8, atmosphere: 7, engines: 6, camera: 4 } },
  { index: 16, name: 'Full Burn',        threshold: 150_000_000,   delta: 'Flames lengthen, smoke turns aggressive',               layers: { site: 8, structure: 7, support: 8, atmosphere: 8, engines: 7, camera: 5 } },
  { index: 17, name: 'Pad Vibration',    threshold: 250_000_000,   delta: 'Screen-shake, shockwave ripples in puddles',            layers: { site: 8, structure: 7, support: 8, atmosphere: 8, engines: 7, camera: 7 } },
  { index: 18, name: 'Boosters Strapped',threshold: 400_000_000,   delta: 'Side boosters appear flanking main stack',              layers: { site: 8, structure: 9, support: 8, atmosphere: 8, engines: 7, camera: 7 } },
  { index: 19, name: 'Boosters Lit',     threshold: 600_000_000,   delta: 'Triple flame plume, ground glow intensifies',           layers: { site: 9, structure: 9, support: 8, atmosphere: 9, engines: 9, camera: 8 } },
  { index: 20, name: 'T-minus 10',       threshold: 800_000_000,   delta: 'Countdown clock, hold-down clamps glow white',          layers: { site: 9, structure: 9, support: 9, atmosphere: 9, engines: 9, camera: 8 } },
  { index: 21, name: 'Launch Ready',     threshold: 1_000_000_000, milestone: true, delta: 'Full beast — sonic ripples, ready to launch',    layers: { site: 10, structure: 10, support: 10, atmosphere: 10, engines: 10, camera: 9 } },
  { index: 22, name: 'Liftoff',          threshold: 2_500_000_000, delta: 'Clamps release, slow majestic ascent begins',           layers: { site: 10, structure: 10, support: 8, atmosphere: 10, engines: 10, camera: 10 } },
  { index: 23, name: 'Mach 1',           threshold: 5_000_000_000, delta: 'Vapour cone forms around nose',                         layers: { site: 9, structure: 10, support: 0, atmosphere: 10, engines: 10, camera: 10 } },
  { index: 24, name: 'Stage Separation', threshold: 10_000_000_000, delta: 'First stage falls away, second ignites',               layers: { site: 7, structure: 10, support: 0, atmosphere: 10, engines: 10, camera: 10 } },
  { index: 25, name: 'Orbital',          threshold: 100_000_000_000, delta: 'Earth curves below, sunrise terminator visible',      layers: { site: 5, structure: 10, support: 0, atmosphere: 7, engines: 10, camera: 10 } },
];

export function tierForSats(sats: number): Tier {
  let current = TIERS[0]!;
  for (const tier of TIERS) {
    if (sats >= tier.threshold) current = tier;
    else break;
  }
  return current;
}

export function nextTier(current: Tier): Tier | null {
  return TIERS[current.index + 1] ?? null;
}

export function progressToNext(sats: number): number {
  const current = tierForSats(sats);
  const next = nextTier(current);
  if (!next) return 1;
  const span = next.threshold - current.threshold;
  if (span <= 0) return 1;
  return Math.min(1, (sats - current.threshold) / span);
}

// Soft demotion: only downgrade the displayed tier after the lower balance
// has held for the demotion window. Prevents flicker from a rogue API read
// and keeps spending sats emotionally safe (the rocket "powers down" gradually).
export const DEMOTION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type DisplayTierState = {
  displayedTierIndex: number;
  pendingTierIndex: number | null;
  pendingSince: number | null;
};

export function resolveDisplayTier(
  state: DisplayTierState,
  liveSats: number,
  now: number,
): DisplayTierState {
  const live = tierForSats(liveSats).index;

  if (live > state.displayedTierIndex) {
    return { displayedTierIndex: live, pendingTierIndex: null, pendingSince: null };
  }

  if (live === state.displayedTierIndex) {
    return { ...state, pendingTierIndex: null, pendingSince: null };
  }

  if (state.pendingTierIndex !== live || state.pendingSince === null) {
    return { ...state, pendingTierIndex: live, pendingSince: now };
  }

  if (now - state.pendingSince >= DEMOTION_WINDOW_MS) {
    return { displayedTierIndex: live, pendingTierIndex: null, pendingSince: null };
  }

  return state;
}
