import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.id, id),
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  return NextResponse.json({ contract });
}
