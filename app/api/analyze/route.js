import { NextResponse } from "next/server"
import { geminiService } from "../../../lib/gemini"
import { createAuthenticatedHandler } from "../../../lib/middleware"
import { EmbeddingsService } from "../../../lib/embeddings"
import { VectorDBService } from "../../../lib/vectordb"

async function handleAnalyze(request, auth) {
  try {
    const { url, content, query, options = {} } = await request.json()

    let analysisContent = content
    let relevantContext = []

    // If URL is provided, try to get relevant content from project data
    if (url && !content) {
      try {
        const embeddingsService = new EmbeddingsService()
        const vectorDB = new VectorDBService()
        const projectId = auth.keyData.projectId

        // Generate query embedding for page analysis
        const queryText = query || "page analysis overview"
        const queryEmbedding = await embeddingsService.generateEmbedding(queryText)

        // Search project-specific content
        const matches = await vectorDB.queryVectors(queryEmbedding, {
          topK: 10,
          includeMetadata: true,
          namespace: `${projectId}_mainContent`,
          threshold: 0.4,
        })

        relevantContext = matches.map((match) => ({
          text: match.metadata?.originalContent || match.metadata?.text || "",
          type: match.metadata?.type || "content",
          score: match.score,
        }))

        // Use relevant content as analysis input
        analysisContent = relevantContext
          .slice(0, 5)
          .map((ctx) => ctx.text)
          .join("\n\n")
      } catch (embeddingError) {
        console.warn("Could not retrieve project content for analysis:", embeddingError.message)
        analysisContent = `Analysis for ${url} - ${query || "general page analysis"}`
      }
    }

    if (!analysisContent && !query) {
      return NextResponse.json({ error: "Content, URL, or query is required" }, { status: 400 })
    }

    // Generate detailed analysis with project context
    const analysis = await geminiService.generateDetailedAnalysis(
      analysisContent || `Page analysis for ${url}`,
      query || "Provide a comprehensive analysis of this page",
      {
        language: options.language || "en",
        includeCodeExamples: options.includeCodeExamples || false,
        analysisDepth: options.analysisDepth || "comprehensive",
        projectName: auth.keyData.projectName,
        websiteUrl: auth.keyData.projectUrl,
      },
    )

    return NextResponse.json({
      success: true,
      analysis: analysis.analysis,
      context: {
        projectName: auth.keyData.projectName,
        relevantContentFound: relevantContext.length,
        analysisType: content ? "content-based" : "url-based",
      },
      sources: relevantContext.slice(0, 3).map((ctx) => ({
        type: ctx.type,
        relevanceScore: ctx.score,
      })),
    })
  } catch (error) {
    console.error("Analyze API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate analysis",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export const POST = createAuthenticatedHandler(handleAnalyze, "analyze")
