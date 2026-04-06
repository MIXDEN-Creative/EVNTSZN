import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLoginUrl } from "@/lib/domains";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const host = (await headers()).get("host") || undefined;
  redirect(getLoginUrl(params?.next || "/epl/admin", host));
}
