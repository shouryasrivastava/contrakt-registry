import { permanentRedirect } from "next/navigation";

// The contract detail page moved from /c/[username]/[name] to /u/[username]/[app].
// Permanently redirect old links (published registryUrls, shared tweets, etc.).
export default async function LegacyContractRedirect({
  params,
}: {
  params: Promise<{ username: string; name: string }>;
}) {
  const { username, name } = await params;
  permanentRedirect(`/u/${username}/${name}`);
}
