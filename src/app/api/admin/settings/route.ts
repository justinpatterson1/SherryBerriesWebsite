import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { AUDIT_ACTIONS, auditIp, maybePurgeAuditLogs, writeAuditLog } from "@/lib/admin/audit";
import { prisma } from "@/lib/db";
import { getSiteSettings, SITE_SETTINGS_ID } from "@/lib/queries/site-settings";

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);
  return NextResponse.json(await getSiteSettings());
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Admins only.", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid JSON body.");
  }
  const enabled = (body as { seasonalEffects?: unknown } | null)?.seasonalEffects;
  if (typeof enabled !== "boolean") return bad("seasonalEffects must be true or false.");

  const before = await getSiteSettings();
  if (before.seasonalEffects === enabled) return NextResponse.json(before);

  await prisma.$transaction(async (tx) => {
    await tx.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: { id: SITE_SETTINGS_ID, seasonalEffects: enabled },
      update: { seasonalEffects: enabled },
    });
    await writeAuditLog(tx, {
      actor: admin,
      action: AUDIT_ACTIONS.settingsUpdate,
      entityType: "SiteSettings",
      entityId: SITE_SETTINGS_ID,
      summary: `Turned seasonal effects ${enabled ? "on" : "off"}`,
      changes: { seasonalEffects: { from: before.seasonalEffects, to: enabled } },
      ip: auditIp(request),
    });
  });
  maybePurgeAuditLogs();

  return NextResponse.json({ seasonalEffects: enabled });
}
