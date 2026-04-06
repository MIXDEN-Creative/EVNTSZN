import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-admin";

export async function GET() {
  const auth = await requireApiAdminPermission("admin.manage");
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  try {
    const res = await fetch("https://api.printful.com/store/products", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      },
    });

    const data = await res.json();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
