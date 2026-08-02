import nodemailer from "nodemailer";
import { getSetting } from "@/lib/settings";

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const [host, port, user, pass, from] = await Promise.all([
    getSetting("SMTP_HOST"),
    getSetting("SMTP_PORT"),
    getSetting("SMTP_USER"),
    getSetting("SMTP_PASS"),
    getSetting("SMTP_FROM"),
  ]);

  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured — skipping send. Set SMTP_* in /admin/config or .env.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: port === "465",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({ from: from || user, to, subject, text });
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}
