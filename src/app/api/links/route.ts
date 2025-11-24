import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUrl, isValidCode, generateRandomCode } from "@/lib/links";
import { Prisma } from "@prisma/client";

type CreateLinkBody = {
  url?: string;
  code?: string;
};

// GET /api/links  → list all links
export async function GET() {
  const links = await prisma.link.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    links.map((l) => ({
      code: l.code,
      targetUrl: l.targetUrl,
      clickCount: l.clickCount,
      lastClickedAt: l.lastClickedAt,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
    { status: 200 }
  );
}

// POST /api/links  → create new link
export async function POST(req: Request) {
  let body: CreateLinkBody;

  try {
    body = (await req.json()) as CreateLinkBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const url = body.url?.trim();
  let code = body.code?.trim();

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // If custom code provided, validate it
  if (code) {
    if (!isValidCode(code)) {
      return NextResponse.json(
        { error: "Code must match [A-Za-z0-9]{6,8}" },
        { status: 400 }
      );
    }
  } else {
    // generate a random 6-char code and ensure uniqueness
    let unique = false;
    while (!unique) {
      const candidate = generateRandomCode(6);
      const existing = await prisma.link.findUnique({
        where: { code: candidate },
      });
      if (!existing) {
        code = candidate;
        unique = true;
      }
    }
  }

  try {
    const created = await prisma.link.create({
      data: {
        code: code!,
        targetUrl: url,
      },
    });

    return NextResponse.json(
      {
        code: created.code,
        targetUrl: created.targetUrl,
        clickCount: created.clickCount,
        lastClickedAt: created.lastClickedAt,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Unique constraint violation → 409
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 409 }
      );
    }

    console.error("Error creating link", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
