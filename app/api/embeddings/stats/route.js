import { NextResponse } from "next/server"
import { VectorDatabase } from "../../../../lib/vectordb"

export async function GET() {
  try {
    const vectorDB = new VectorDatabase()
    const stats = await vectorDB.getIndexStats()

    return NextResponse.json({
      success: true,
      data: {
        indexName: vectorDB.indexName,
        totalVectors: stats.totalVectorCount || 0,
        dimension: stats.dimension || 768,
        indexFullness: stats.indexFullness || 0,
        namespaces: stats.namespaces || {},
      },
    })
  } catch (error) {
    console.error("Vector database stats error:", error)
    return NextResponse.json(
      {
        error: "Failed to get vector database stats",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
