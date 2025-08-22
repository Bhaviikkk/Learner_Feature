import { NextResponse } from "next/server"
import { EmbeddingsService } from "../../../../lib/embeddings"
import { VectorDatabase } from "../../../../lib/vectordb"

export async function POST(request) {
  try {
    const { content, apiKey, metadata = {} } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    const embeddingsService = new EmbeddingsService()
    const vectorDB = new VectorDatabase()

    // Handle different content types
    let textToProcess = ""
    let contentMetadata = {}

    if (typeof content === "string") {
      textToProcess = content
    } else if (content.textForEmbedding) {
      // Scraped content format
      textToProcess = content.textForEmbedding
      contentMetadata = {
        title: content.title,
        url: content.url,
        description: content.description,
        headingsCount: content.headings?.length || 0,
        paragraphsCount: content.paragraphs?.length || 0,
      }
    } else {
      return NextResponse.json({ error: "Invalid content format" }, { status: 400 })
    }

    // Chunk text if it's too large
    const chunks = embeddingsService.chunkText(textToProcess, 800, 100)

    if (chunks.length === 0) {
      return NextResponse.json({ error: "No valid text chunks found" }, { status: 400 })
    }

    // Generate embeddings for all chunks
    const { embeddings, errors } = await embeddingsService.generateBatchEmbeddings(chunks)

    if (embeddings.length === 0) {
      return NextResponse.json({ error: "Failed to generate any embeddings", details: errors }, { status: 500 })
    }

    // Prepare vectors for storage
    const vectors = embeddings.map((emb, index) => ({
      id: vectorDB.generateVectorId(contentMetadata.url || "content", index),
      embedding: emb.embedding,
      text: emb.text,
      url: contentMetadata.url,
      title: contentMetadata.title,
      apiKey,
      metadata: {
        ...contentMetadata,
        ...metadata,
        chunkIndex: index,
        totalChunks: embeddings.length,
      },
    }))

    // Store in vector database
    const upsertResult = await vectorDB.upsertVectors(vectors)

    return NextResponse.json({
      success: true,
      data: {
        vectorsStored: vectors.length,
        chunksProcessed: chunks.length,
        errors: errors.length,
        upsertResult,
        vectorIds: vectors.map((v) => v.id),
      },
    })
  } catch (error) {
    console.error("Store embeddings error:", error)
    return NextResponse.json(
      {
        error: "Failed to store embeddings",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
