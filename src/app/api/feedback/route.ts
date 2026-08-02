import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { z } from "zod";

const bodySchema = z.object({
  message: z.string().min(3).max(2000),
  page: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await requireUserId(); // null is fine — feedback allows anonymous
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email ?? null;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId,
      email: userEmail,
      page: parsed.data.page,
      message: parsed.data.message,
    },
  });

  const recipient = await getSetting("FEEDBACK_TO_EMAIL");
  let emailSent = false;
  if (recipient) {
    emailSent = await sendEmail(
      recipient,
      "New feedback — TagFalcon",
      [
        `From: ${userEmail || "anonymous"}`,
        `Page: ${parsed.data.page || "unknown"}`,
        "",
        parsed.data.message,
      ].join("\n")
    );
    if (emailSent) {
      await prisma.feedback.update({ where: { id: feedback.id }, data: { emailSent: true } });
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}
