export type StoredWallet = {
  address: string;
  chainId: number | null;
  source: "embedded" | "external";
};

export const WALLET_STORAGE_KEY = "contrakt.wallet";
export const WALLET_UPDATED_EVENT = "contrakt:wallet-updated";
export const EMBEDDED_SIGN_OUT_EVENT = "contrakt:embedded-sign-out";

export function readStoredWallet(): StoredWallet | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(WALLET_STORAGE_KEY);
  if (!stored) return null;

  try {
    const value = JSON.parse(stored) as Partial<StoredWallet>;
    if (typeof value.address !== "string") return null;
    return {
      address: value.address,
      chainId: typeof value.chainId === "number" ? value.chainId : null,
      source: value.source === "embedded" ? "embedded" : "external",
    };
  } catch {
    window.localStorage.removeItem(WALLET_STORAGE_KEY);
    return null;
  }
}

export function writeStoredWallet(wallet: StoredWallet) {
  window.localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
  window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT, { detail: wallet }));
}

export function clearStoredWallet() {
  window.localStorage.removeItem(WALLET_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(WALLET_UPDATED_EVENT, { detail: null }));
}
