import { prisma } from "@/lib/prisma";

export async function notifyUser(userId: string, title: string, body: string) {
  await prisma.notification.create({ data: { userId, title, body } });
}
