export type WalletSource =
  | { kind: 'xpub'; value: string }
  | { kind: 'address'; value: string };

export type Wallet = {
  id: string;
  label: string;
  source: WalletSource;
  lastSats: number | null;
  lastFetchedAt: number | null;
};

// Lightweight format detection. Full descriptor parsing (wpkh/tr) is a v2 problem.
// xpub/ypub/zpub: mainnet BIP32/49/84 extended public keys.
// tpub/upub/vpub: testnet — accept for dev, gate behind a setting before launch.
const XPUB_PREFIXES = ['xpub', 'ypub', 'zpub', 'tpub', 'upub', 'vpub'];

export function detectSourceKind(input: string): WalletSource['kind'] | null {
  const trimmed = input.trim();
  if (XPUB_PREFIXES.some((p) => trimmed.startsWith(p)) && trimmed.length >= 100) {
    return 'xpub';
  }
  if (isLikelyAddress(trimmed)) return 'address';
  return null;
}

function isLikelyAddress(input: string): boolean {
  // bc1... (bech32), 1... or 3... (legacy/p2sh). Loose check — real validation happens server-side.
  return /^(bc1[a-z0-9]{8,87}|[13][a-zA-HJ-NP-Z0-9]{25,39})$/.test(input);
}

export function parseSource(input: string): WalletSource {
  const kind = detectSourceKind(input);
  if (!kind) throw new Error('Not a recognised xpub/ypub/zpub or BTC address');
  return { kind, value: input.trim() };
}

// mempool.space REST. No API key, generous rate limits. Esplora is the API shape.
// xpub endpoint returns derived address activity rolled up to a single balance.
const MEMPOOL_BASE = 'https://mempool.space/api';

export async function fetchBalanceSats(source: WalletSource): Promise<number> {
  if (source.kind === 'address') {
    const res = await fetch(`${MEMPOOL_BASE}/address/${source.value}`);
    if (!res.ok) throw new Error(`mempool.space ${res.status}`);
    const json = (await res.json()) as {
      chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
      mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
    };
    const confirmed = json.chain_stats.funded_txo_sum - json.chain_stats.spent_txo_sum;
    const unconfirmed = json.mempool_stats.funded_txo_sum - json.mempool_stats.spent_txo_sum;
    return confirmed + unconfirmed;
  }

  // xpub balance endpoint: /xpub/:xpub returns derived stats.
  const res = await fetch(`${MEMPOOL_BASE}/xpub/${source.value}`);
  if (!res.ok) throw new Error(`mempool.space ${res.status}`);
  const json = (await res.json()) as {
    chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
    mempool_stats: { funded_txo_sum: number; spent_txo_sum: number };
  };
  const confirmed = json.chain_stats.funded_txo_sum - json.chain_stats.spent_txo_sum;
  const unconfirmed = json.mempool_stats.funded_txo_sum - json.mempool_stats.spent_txo_sum;
  return confirmed + unconfirmed;
}

export function aggregateSats(wallets: readonly Wallet[]): number {
  return wallets.reduce((sum, w) => sum + (w.lastSats ?? 0), 0);
}

export function formatSats(sats: number): string {
  return new Intl.NumberFormat('en-GB').format(sats);
}

export function formatBtc(sats: number): string {
  const btc = sats / 100_000_000;
  return btc.toLocaleString('en-GB', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
}
