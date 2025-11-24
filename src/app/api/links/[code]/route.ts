import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

interface RouteContext {
  params: Promise<{ code: string }>;
}

// GET /api/links/:code  → stats for one code
export async function GET(_req: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  const link = await prisma.link.findUnique({
    where: { code },
  });

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      code: link.code,
      targetUrl: link.targetUrl,
      clickCount: link.clickCount,
      lastClickedAt: link.lastClickedAt,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    },
    { status: 200 }
  );
}

// DELETE /api/links/:code  → delete a link
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  try {
    await prisma.link.delete({
      where: { code },
    });

    // 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.error("Error deleting link", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
