import { searchEtfs } from "@/lib/yahoo";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.trim().length < 1 || query.length > 24) return NextResponse.json([]);
  try {
    const items = await searchEtfs(query);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}
