import { NextResponse } from "next/server"
import { APIKeyService } from "../../../../lib/apikeys"
import { DataProcessor } from "../../../../lib/dataProcessor"

export async function POST(request) {
  try {
    const { url, name, options = {} } = await request.json()

    if (!url || !name) {
      return NextResponse.json({ error: "URL and project name are required" }, { status: 400 })
    }

    const processor = new DataProcessor()
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const processingResult = await processor.processWebsiteForProject(url, {
      name,
      projectId,
      options,
    })

    // Generate API key after successful processing
    const apiKeyService = new APIKeyService()
    const apiKey = await apiKeyService.generateKey({
      projectId,
      name,
      url,
      features: ["explain", "chat", "analyze"],
    })

    // Cleanup resources
    await processor.cleanup()

    const project = {
      id: projectId,
      name,
      url,
      apiKey: apiKey.key,
      createdAt: new Date().toISOString(),
      status: "ready",
      stats: processingResult.stats,
      contentTypes: processingResult.contentTypes,
      embeddingsCount: processingResult.embeddingsCount,
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to process website",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
