import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function GET() {
  const clientId = await getSetting("NEXT_PUBLIC_ADSENSE_CLIENT_ID");
  return NextResponse.json({ clientId });
}
