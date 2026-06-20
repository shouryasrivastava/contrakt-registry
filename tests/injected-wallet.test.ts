import { describe, expect, it, vi } from "vitest";
import {
  providerCandidates,
  selectMetaMaskProvider,
  walletErrorMessage,
  type AnnouncedProvider,
  type InjectedProvider,
} from "../app/components/injected-wallet";

function provider(flags: Partial<InjectedProvider> = {}): InjectedProvider {
  return { request: vi.fn(), ...flags };
}

describe("injected wallet selection", () => {
  it("prefers announced MetaMask over Coinbase window.ethereum", () => {
    const metamask = provider({ isMetaMask: true });
    const coinbase = provider({ isCoinbaseWallet: true });
    const announced: AnnouncedProvider[] = [{
      info: { uuid: "mm", name: "MetaMask", icon: "", rdns: "io.metamask" },
      provider: metamask,
    }];
    expect(selectMetaMaskProvider(announced, coinbase)).toBe(metamask);
  });

  it("finds MetaMask inside the legacy providers array", () => {
    const metamask = provider({ isMetaMask: true });
    const coinbase = provider({ isCoinbaseWallet: true, providers: [provider(), metamask] });
    expect(selectMetaMaskProvider([], coinbase)).toBe(metamask);
  });

  it("deduplicates provider candidates", () => {
    const metamask = provider({ isMetaMask: true });
    expect(providerCandidates([], { request: vi.fn(), providers: [metamask, metamask] })).toHaveLength(2);
  });
});

describe("wallet errors", () => {
  it("explains rejected and pending requests", () => {
    expect(walletErrorMessage({ code: 4001 })).toContain("cancelled");
    expect(walletErrorMessage({ code: -32002 })).toContain("already has");
  });
});
