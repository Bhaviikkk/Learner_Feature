import { NextResponse } from "next/server"
import { apiKeyService } from "../../../../lib/apikeys"

export async function GET(request, { params }) {
  try {
    const { keyId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const keyDetails = await apiKeyService.getAPIKeyDetails(keyId, userId)

    if (!keyDetails) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: keyDetails,
    })
  } catch (error) {
    console.error("Get API key details error:", error)
    return NextResponse.json(
      {
        error: "Failed to get API key details",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { keyId } = params
    const body = await request.json()
    const { userId = "demo-user", ...updates } = body

    const updatedKey = await apiKeyService.updateAPIKey(keyId, userId, updates)

    if (!updatedKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedKey,
    })
  } catch (error) {
    console.error("Update API key error:", error)
    return NextResponse.json(
      {
        error: "Failed to update API key",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { keyId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "demo-user"

    const deleted = await apiKeyService.deleteAPIKey(keyId, userId)

    if (!deleted) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    })
  } catch (error) {
    console.error("Delete API key error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete API key",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
