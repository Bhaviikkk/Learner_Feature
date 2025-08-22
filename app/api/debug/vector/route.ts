// /app/api/debug/vector/route.ts

export const runtime = "nodejs"


import { NextResponse } from "next/server"
import { VectorDBService } from "@/lib/vectordb"

export async function GET() {
  try {
    const vdb = new VectorDBService()
    const stats = await vdb.getIndexStats()
    return NextResponse.json({
      pineconeApiKeyPresent: !!process.env.PINECONE_API_KEY,
      indexName: process.env.PINECONE_INDEX_NAME || "bhavik",
      fallbackMode: vdb.fallbackMode ?? "(init after first call)",
      stats,
    })
  } catch (e:any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
