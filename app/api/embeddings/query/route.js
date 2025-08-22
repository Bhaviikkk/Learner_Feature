import { NextResponse } from "next/server"
import { EmbeddingsService } from "../../../../lib/embeddings"
import { VectorDatabase } from "../../../../lib/vectordb"

export async function POST(request) {
  try {
    const { query, apiKey, options = {} } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    const embeddingsService = new EmbeddingsService()
    const vectorDB = new VectorDatabase()

    // Generate embedding for the query
    const queryEmbedding = await embeddingsService.generateEmbedding(query)

    // Set up query options
    const queryOptions = {
      topK: options.topK || 5,
      includeMetadata: true,
      includeValues: false,
      filter: {
        apiKey: { $eq: apiKey },
        ...options.filter,
      },
    }

    // Query the vector database
    const matches = await vectorDB.queryVectors(queryEmbedding, queryOptions)

    // Process and format results
    const results = matches.map((match) => ({
      id: match.id,
      score: match.score,
      text: match.metadata?.text || "",
      url: match.metadata?.url || "",
      title: match.metadata?.title || "",
      metadata: match.metadata || {},
    }))

    // Filter results by minimum similarity score
    const minScore = options.minScore || 0.7
    const filteredResults = results.filter((result) => result.score >= minScore)

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: filteredResults,
        totalMatches: matches.length,
        filteredMatches: filteredResults.length,
        queryOptions,
      },
    })
  } catch (error) {
    console.error("Query embeddings error:", error)
    return NextResponse.json(
      {
        error: "Failed to query embeddings",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
