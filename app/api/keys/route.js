import { NextResponse } from "next/server"
import { apiKeyService } from "../../../lib/apikeys"

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, userId = "demo-user", features, rateLimit } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    const keyData = await apiKeyService.createAPIKey({
      name: name.trim(),
      description: description?.trim() || "",
      userId,
      features: features || ["scraping", "embeddings", "ai_explanations"],
      rateLimit: rateLimit || 1000,
    })

    return NextResponse.json({
      success: true,
      data: keyData,
    })
  } catch (error) {
    console.error("Create API key error:", error)
    return NextResponse.json(
      {
        error: "Failed to create API key",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const keys = await apiKeyService.listAPIKeys(userId)

    return NextResponse.json({
      success: true,
      data: keys,
    })
  } catch (error) {
    console.error("List API keys error:", error)
    return NextResponse.json(
      {
        error: "Failed to list API keys",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
