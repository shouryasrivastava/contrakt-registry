import { redirect } from "next/navigation";

export default async function EarningsRedirect({
  params,
}: {
  params: Promise<{ user: string; app: string }>;
}) {
  const { user, app } = await params;
  redirect(`/u/${user}/${app}/dashboard/monetization`);
}
