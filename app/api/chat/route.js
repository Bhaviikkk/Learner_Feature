import { NextResponse } from "next/server"
import { geminiService } from "../../../lib/gemini"
import { createAuthenticatedHandler } from "../../../lib/middleware"
import { EmbeddingsService } from "../../../lib/embeddings"
import { VectorDBService } from "../../../lib/vectordb"

async function handleChat(request, auth) {
  try {
    const { message, conversationHistory = [], context = {}, url } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const enhancedContext = {
      ...context,
      projectName: auth.keyData.projectName,
      projectUrl: auth.keyData.projectUrl,
      currentUrl: url,
    }

    // Try to get relevant content based on the user's message
    try {
      const embeddingsService = new EmbeddingsService()
      const vectorDB = new VectorDBService()
      const projectId = auth.keyData.projectId

      // Generate embedding for the user's message to find relevant content
      const messageEmbedding = await embeddingsService.generateEmbedding(message.trim())

      // Search across different content types
      const contentMatches = await vectorDB.queryVectors(messageEmbedding, {
        topK: 3,
        includeMetadata: true,
        namespace: `${projectId}_mainContent`,
        threshold: 0.6,
      })

      const interactiveMatches = await vectorDB.queryVectors(messageEmbedding, {
        topK: 2,
        includeMetadata: true,
        namespace: `${projectId}_interactive`,
        threshold: 0.5,
      })

      const relevantContent = [...contentMatches, ...interactiveMatches]
        .filter((match) => match.score > 0.5)
        .map((match) => ({
          text: match.metadata?.originalContent || match.metadata?.text || "",
          type: match.metadata?.type || "content",
          score: match.score,
        }))

      if (relevantContent.length > 0) {
        enhancedContext.relevantContent = relevantContent
        enhancedContext.hasProjectContext = true
      }
    } catch (embeddingError) {
      console.warn("Could not retrieve relevant content for chat:", embeddingError.message)
      enhancedContext.hasProjectContext = false
    }

    // Generate conversational response with enhanced context
    const response = await geminiService.generateConversationalResponse(
      message.trim(),
      conversationHistory,
      enhancedContext,
    )

    return NextResponse.json({
      success: true,
      message: response.message,
      timestamp: response.timestamp,
      context: {
        projectName: auth.keyData.projectName,
        hasProjectContext: enhancedContext.hasProjectContext,
        relevantContentUsed: enhancedContext.relevantContent?.length || 0,
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate response",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export const POST = createAuthenticatedHandler(handleChat, "chat")
