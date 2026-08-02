import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { setSetting, clearSetting, SETTING_DEFS } from "@/lib/settings";
import { z } from "zod";

const bodySchema = z.object({ key: z.string(), value: z.string() });
const clearSchema = z.object({ key: z.string() });

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const rows = await prisma.systemSetting.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));

  const settings = SETTING_DEFS.map((def) => {
    const row = byKey.get(def.key);
    const dbOverride = !!row?.value?.trim();
    const envValue = process.env[def.key] || null;
    const effectiveValue = dbOverride ? row!.value!.trim() : envValue;
    const source = dbOverride ? "database" : envValue ? "env" : "none";

    return {
      key: def.key,
      label: def.label,
      category: def.category,
      isSecret: def.isSecret,
      description: def.description,
      hasValue: !!effectiveValue,
      // Secrets are never sent to the client in full — masked preview only.
      preview: effectiveValue ? (def.isSecret ? maskValue(effectiveValue) : effectiveValue) : null,
      source, // "database" | "env" | "none" — drives the "Clear override" button and source label
      updatedAt: row?.updatedAt ?? null,
    };
  });

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  if (!SETTING_DEFS.some((d) => d.key === parsed.data.key)) {
    return NextResponse.json({ error: "UNKNOWN_KEY" }, { status: 400 });
  }

  await setSetting(parsed.data.key, parsed.data.value, admin.adminId);
  await logAdminAction(admin.adminId, "update_setting", "system_setting", parsed.data.key, {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = clearSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }
  if (!SETTING_DEFS.some((d) => d.key === parsed.data.key)) {
    return NextResponse.json({ error: "UNKNOWN_KEY" }, { status: 400 });
  }

  await clearSetting(parsed.data.key, admin.adminId);
  await logAdminAction(admin.adminId, "clear_setting_override", "system_setting", parsed.data.key, {});

  return NextResponse.json({ ok: true });
}

function maskValue(value: string): string {
  if (value.length <= 4) return "••••";
  return `${value.slice(0, 3)}${"•".repeat(Math.min(10, value.length - 6))}${value.slice(-3)}`;
}
