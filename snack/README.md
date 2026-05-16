# BTCROCKET — Expo Snack build

A single-file React Native app that captures the Mission Control aesthetic. Zero local install — runs through Expo Snack and Expo Go on your phone.

## Get it on your phone in 3 steps

### 1. Install Expo Go on your phone
- **iPhone**: App Store → search "Expo Go" → install
- **Android**: Play Store → search "Expo Go" → install

### 2. Open Expo Snack and paste the code
1. Go to **https://snack.expo.dev**
2. (Optional but recommended) sign up / log in — keeps your work saved
3. Click "Create snack" or use the existing blank
4. **Replace the entire contents of `App.js`** with the contents of `snack/App.js` in this repo
5. In the dependencies panel (right side), Snack should auto-detect:
   - `react-native-svg`
   - `@expo-google-fonts/geist`
   - `@expo-google-fonts/geist-mono`
   - `expo-font`
   If any are missing, click "Add dependency" and add them.

### 3. Connect Expo Go and scan
1. In Snack, find the "My Device" tab on the right
2. Click "Run on my device" — Snack shows a QR code
3. Open Expo Go on your phone → tap "Scan QR code" → point at the QR
4. App loads on your phone in ~10 seconds

## Troubleshooting

- **Fonts don't load**: Snack sometimes takes a moment to resolve `@expo-google-fonts`. Wait 20s and reload. If still broken, the app falls back to the system font — the layout still works, it just looks less distinctive.
- **Particles look choppy on older phones**: drop `PARTICLE_LIMIT` values in `App.js` (search for that constant) — halve them.
- **"Unable to resolve" errors**: Snack's dependency panel is the source of truth. Make sure each `@expo-google-fonts/*` and `react-native-svg` shows version-resolved (no red warning).
- **iPhone bezel covers content**: this build uses `SafeAreaView`, which should handle it. If your phone has a notch and content is cut off, restart Expo Go.

## What's in this build

- Live network ticker (block height, fees, mempool, hashrate)
- Side telemetry gauges (THR/FUEL/PSI/TEMP) with animated bars
- BTC amount in Geist Black, slot-machine pulse on change
- 7 flame states (DEAD → MAXIMUM BURN) with SVG rocket + particle pool
- BUY BTC ↔ SELL BTC toggle with brutalist button styling
- Leaderboard sheet, 32 mock peers + YOU row, tier-bucketed ranking
- Rank pill top-right opens the leaderboard

## Known differences from the HTML preview

- Particles are `<View>` elements not canvas circles → 30fps target, slightly less fluid
- Digit-roll on the number is replaced with a clean scale-pulse (simpler to do reliably in RN)
- Film grain overlay omitted (SVG noise on web → not worth the perf cost on RN)
- Some font weights map differently between Satoshi (web) and Geist (native)

Everything else is intentionally identical.
