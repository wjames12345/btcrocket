# BTCROCKET

A BTC stack visualiser: connect read-only wallets, watch a rocket grow as your stack grows.

This is a runnable v0 scaffold — the engine works end to end, but the rocket art is placeholder geometry and the tier-up cinematic / share card haven't been built yet.

## What's in v0

- **Tier engine** ([src/tiers.ts](src/tiers.ts)) — 26 tiers, sats-denominated, with 24-hour soft-demotion logic so spending sats doesn't trigger an instant tier downgrade.
- **Wallet ingestion** ([src/wallet.ts](src/wallet.ts)) — xpub/ypub/zpub or single address, balances from mempool.space, multi-wallet aggregation. No private keys, ever.
- **Persistent store** ([src/store.ts](src/store.ts)) — Zustand + AsyncStorage. Wallets and tier state survive restarts.
- **Skia rocket renderer** ([src/Rocket.tsx](src/Rocket.tsx)) — six layers (Site, Structure, Support, Atmosphere, Engines, Camera) driven by current tier intensity. Placeholder geometry; designer replaces.
- **Home + AddWallet screens** ([src/Home.tsx](src/Home.tsx), [src/AddWallet.tsx](src/AddWallet.tsx)) — tier readout, sats with blur toggle (default on), progress to next tier, add/remove wallets.

## What's NOT in v0

- Real rocket art (the placeholder shapes are stand-ins for a designer pass)
- Tier-up cinematic (3–5s celebration when you promote)
- Auto-generated share card (the virality engine)
- Output descriptor parsing (only raw xpub/address for now)
- Lightning, custodial APIs, wrapped BTC — deliberately deferred per design rules
- Background refresh (only foreground 5-min polling so far)
- Onboarding screens
- App icon, splash, store assets

## Prerequisites

You'll need installed locally:

- **Node 20+** — `brew install node` if you don't have it
- **Xcode** (for iOS sim) — from the Mac App Store
- **Expo CLI** comes bundled, no global install needed

## Run it

```bash
cd ~/btcrocket
npm install
npm run ios
```

First `npm install` will take a few minutes (Skia + bitcoinjs are chunky). First `npm run ios` builds the dev client — also slow the first time, fast after.

To test without a real wallet, paste a public sample address into the add-wallet screen, e.g. `bc1qhsfa8udq43e83vsj4mc99e3pnsfwwumwxw0cww` (a known mempool.space test address). Or use the genesis address `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` to see ~50 BTC trigger upper tiers.

## Design rules baked in

These are non-negotiable per the BTCROCKET design system — change them at your peril:

1. **Tiers are sats-denominated, not fiat.** Number-go-up must not reverse in bear markets.
2. **Logarithmic curve, 26 tiers.** Early DCA users hit a promotion every 1–4 weeks.
3. **Soft demotion, 24h delay.** Spending sats shouldn't trigger a destructive animation.
4. **One delta per tier.** Each promotion adds a single legible visual element.
5. **Blur balance by default on shareable views.** The rocket is the flex, not the number.
6. **Skia, not Lottie.** Lottie can't deliver particle aggression at 120fps.

## File map

```
btcrocket/
├── App.tsx              root, mounts Home
├── package.json
├── app.json             Expo config
├── tsconfig.json
├── babel.config.js
└── src/
    ├── tiers.ts         26-tier ladder + sats→tier + demotion delay
    ├── wallet.ts        xpub/address parsing + mempool.space fetch
    ├── store.ts         Zustand + AsyncStorage persistence
    ├── Rocket.tsx       Skia 6-layer renderer
    ├── Home.tsx         main screen
    └── AddWallet.tsx    add-wallet form
```

## Next steps (suggested order)

1. **Run it once**, paste an address, confirm the loop works end to end.
2. **Brief a designer** on the six-layer model (the matrix in `src/tiers.ts`). Hand them the placeholder Rocket.tsx as the layout reference.
3. **Build the tier-up cinematic** — 3–5s Skia animation that plays when `displayedTierIndex` increases.
4. **Build the share card** — render-to-PNG of the rocket + tier name + a clean watermark, exported via `Share` API.
5. **Add output descriptor support** so users with modern wallets (Sparrow, Bitcoin Core ≥0.21) can paste a `wpkh(...)` or `tr(...)` descriptor.
