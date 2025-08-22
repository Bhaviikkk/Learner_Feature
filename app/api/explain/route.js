import { NextResponse } from "next/server"
import { geminiService } from "../../../lib/gemini"
import { createAuthenticatedHandler } from "../../../lib/middleware"
import { EmbeddingsService } from "../../../lib/embeddings"
import { VectorDBService } from "../../../lib/vectordb"

async function handleExplain(request, auth) {
  try {
    const { element, url, language = "en", options = {} } = await request.json()

    if (!element) {
      return NextResponse.json({ error: "Element is required" }, { status: 400 })
    }

    const elementContext = {
      tagName: element.tagName || "unknown",
      textContent: element.textContent || "",
      className: element.className || "",
      id: element.id || "",
      type: element.type || "",
      role: element.role || "",
      ariaLabel: element.ariaLabel || "",
      href: element.href || "",
      title: element.title || "",
      placeholder: element.placeholder || "",
      position: element.position || {},
    }

    const embeddingsService = new EmbeddingsService()
    const vectorDB = new VectorDBService()

    let relevantContent = []
    try {
      // Create search query from element context
      const queryParts = [
        elementContext.tagName,
        elementContext.textContent.substring(0, 100),
        elementContext.ariaLabel,
        elementContext.title,
        elementContext.type,
      ].filter(Boolean)

      const queryText = queryParts.join(" ")
      const queryEmbedding = await embeddingsService.generateEmbedding(queryText)

      // Search in project-specific namespace
      const projectId = auth.keyData.projectId
      const matches = await vectorDB.queryVectors(queryEmbedding, {
        topK: 5,
        includeMetadata: true,
        namespace: `${projectId}_mainContent`, // Search in main content first
        threshold: 0.6,
      })

      // Also search in interactive elements if no good matches
      if (matches.length < 2) {
        const interactiveMatches = await vectorDB.queryVectors(queryEmbedding, {
          topK: 3,
          includeMetadata: true,
          namespace: `${projectId}_interactive`,
          threshold: 0.5,
        })
        matches.push(...interactiveMatches)
      }

      relevantContent = matches
        .filter((match) => match.score > 0.5)
        .map((match) => ({
          text: match.metadata?.originalContent || match.metadata?.text || "",
          type: match.metadata?.type || "content",
          contentType: match.metadata?.contentType || "unknown",
          score: match.score,
        }))
    } catch (embeddingError) {
      console.warn("Could not retrieve relevant content:", embeddingError.message)
    }

    const explanation = await geminiService.generateElementExplanation(elementContext, {
      relevantContent,
      language,
      websiteUrl: url,
      projectName: auth.keyData.projectName,
      ...options,
    })

    return NextResponse.json({
      success: true,
      explanation: explanation.explanation,
      tips: explanation.tips,
      relatedElements: explanation.relatedElements,
      context: {
        elementType: elementContext.tagName,
        hasRelevantContent: relevantContent.length > 0,
        contentSources: relevantContent.length,
      },
    })
  } catch (error) {
    console.error("Explain API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate explanation",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export const POST = createAuthenticatedHandler(handleExplain, "explain")
