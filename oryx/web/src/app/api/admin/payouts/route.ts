import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { toDatabaseUserId } from "@/lib/access-control";
import { createManualPayout, getPayoutWorkspace, updatePayoutStatus } from "@/lib/payouts";

export async function GET(request: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/payouts");

  try {
    const recipientKey = request.nextUrl.searchParams.get("recipientKey");
    const payload = await getPayoutWorkspace(recipientKey);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load payouts." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { user } = await requireAdminPermission("admin.manage", "/epl/admin/payouts");

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const payoutId = await createManualPayout({
      recipientType: String(body.recipientType || "") as "hq" | "city_office" | "host" | "city_leader" | "override",
      recipientId: body.recipientId ? String(body.recipientId) : null,
      recipientLabel: body.recipientLabel ? String(body.recipientLabel) : null,
      amount: Number(body.amount || 0),
      notes: body.notes ? String(body.notes) : null,
      ledgerIds: Array.isArray(body.ledgerIds) ? body.ledgerIds.map((value) => String(value)) : [],
      createdBy: toDatabaseUserId(user.id),
    });

    return NextResponse.json({ ok: true, payoutId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create payout." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/payouts");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    await updatePayoutStatus({
      payoutId: String(body.payoutId || ""),
      status: String(body.status || "") as "pending" | "sent" | "failed" | "void",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update payout." },
      { status: 400 },
    );
  }
}
