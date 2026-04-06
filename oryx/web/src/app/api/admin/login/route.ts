import { NextResponse } from "next/server";
import { getLoginUrl } from "@/lib/domains";

export async function POST(request: Request) {
  const formData = await request.formData();
  const next = String(formData.get("next") || "/epl/admin");
  return NextResponse.redirect(getLoginUrl(next, new URL(request.url).host));
}
