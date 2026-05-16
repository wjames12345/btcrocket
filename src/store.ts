import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  aggregateSats,
  fetchBalanceSats,
  parseSource,
  Wallet,
} from './wallet';
import {
  DisplayTierState,
  resolveDisplayTier,
  tierForSats,
  TIERS,
} from './tiers';

type AppState = {
  wallets: Wallet[];
  display: DisplayTierState;
  blurBalance: boolean;
  lastError: string | null;

  addWallet: (input: string, label: string) => Promise<void>;
  removeWallet: (id: string) => void;
  refreshAll: () => Promise<void>;
  toggleBlur: () => void;
};

const initialDisplay: DisplayTierState = {
  displayedTierIndex: 0,
  pendingTierIndex: null,
  pendingSince: null,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      wallets: [],
      display: initialDisplay,
      blurBalance: true,
      lastError: null,

      addWallet: async (input, label) => {
        const source = parseSource(input);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const wallet: Wallet = {
          id,
          label: label.trim() || 'Untitled',
          source,
          lastSats: null,
          lastFetchedAt: null,
        };
        set({ wallets: [...get().wallets, wallet], lastError: null });
        await get().refreshAll();
      },

      removeWallet: (id) => {
        set({ wallets: get().wallets.filter((w) => w.id !== id) });
      },

      refreshAll: async () => {
        const wallets = get().wallets;
        const now = Date.now();
        const updated: Wallet[] = await Promise.all(
          wallets.map(async (w) => {
            try {
              const sats = await fetchBalanceSats(w.source);
              return { ...w, lastSats: sats, lastFetchedAt: now };
            } catch (err) {
              return w;
            }
          }),
        );
        const live = aggregateSats(updated);
        const display = resolveDisplayTier(get().display, live, now);
        set({ wallets: updated, display });
      },

      toggleBlur: () => set({ blurBalance: !get().blurBalance }),
    }),
    {
      name: 'btcrocket-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        wallets: s.wallets,
        display: s.display,
        blurBalance: s.blurBalance,
      }),
    },
  ),
);

export function useLiveSats(): number {
  return useApp((s) => aggregateSats(s.wallets));
}

export function useDisplayTier() {
  const idx = useApp((s) => s.display.displayedTierIndex);
  return TIERS[idx] ?? TIERS[0]!;
}

export function useLiveTier() {
  const sats = useLiveSats();
  return tierForSats(sats);
}
