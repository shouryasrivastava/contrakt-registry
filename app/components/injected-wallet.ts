export type EthereumRequest = {
  method: string;
  params?: unknown[];
};

export type InjectedProvider = {
  request(args: EthereumRequest): Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: InjectedProvider[];
};

export type AnnouncedProvider = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: InjectedProvider;
};

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }

  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<AnnouncedProvider>;
  }
}

export function providerCandidates(
  announced: AnnouncedProvider[],
  legacy?: InjectedProvider,
): InjectedProvider[] {
  const providers = [
    ...announced.map((entry) => entry.provider),
    ...(legacy?.providers ?? []),
    ...(legacy ? [legacy] : []),
  ];
  return providers.filter((provider, index) => providers.indexOf(provider) === index);
}

export function selectMetaMaskProvider(
  announced: AnnouncedProvider[],
  legacy?: InjectedProvider,
): InjectedProvider | null {
  const candidates = providerCandidates(announced, legacy);
  const announcedMetaMask = announced.find(
    ({ info }) =>
      info.rdns.toLowerCase() === "io.metamask" ||
      info.name.toLowerCase().includes("metamask"),
  )?.provider;

  return (
    announcedMetaMask ??
    candidates.find((provider) => provider.isMetaMask && !provider.isCoinbaseWallet) ??
    candidates.find((provider) => provider.isMetaMask) ??
    null
  );
}

export function walletErrorMessage(error: unknown): string {
  const value = error as { code?: number; message?: string } | null;
  if (value?.code === 4001) return "Connection cancelled in MetaMask.";
  if (value?.code === -32002) return "MetaMask already has a connection request open. Open the extension to continue.";
  if (value?.code === -32603) return "MetaMask could not complete the request. Unlock it and try again.";

  const message = value?.message?.trim();
  if (message?.toLowerCase().includes("user rejected")) return "Connection cancelled in MetaMask.";
  if (message?.toLowerCase().includes("already pending")) {
    return "MetaMask already has a connection request open. Open the extension to continue.";
  }
  return message || "MetaMask connection failed. Unlock the extension and try again.";
}
