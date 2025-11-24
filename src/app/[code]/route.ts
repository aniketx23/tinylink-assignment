import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ code: string }>;
}

// GET /:code  → redirect & increment click count
export async function GET(_req: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  const link = await prisma.link.findUnique({
    where: { code },
  });

  if (!link) {
    // Spec: /{code} must return 404 if not found or deleted
    return new NextResponse("Not found", { status: 404 });
  }

  // Update click count & last clicked time
  await prisma.link.update({
    where: { code },
    data: {
      clickCount: { increment: 1 },
      lastClickedAt: new Date(),
    },
  });

  return NextResponse.redirect(link.targetUrl, { status: 302 });
}
