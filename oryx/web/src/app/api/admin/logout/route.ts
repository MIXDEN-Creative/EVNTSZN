import { NextResponse } from "next/server";
import { getAppOrigin } from "@/lib/domains";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/account/logout", getAppOrigin(new URL(request.url).host)));
}
