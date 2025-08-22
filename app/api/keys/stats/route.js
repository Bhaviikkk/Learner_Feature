import { NextResponse } from "next/server"
import { apiKeyService } from "../../../../lib/apikeys"

export async function GET() {
  try {
    const stats = await apiKeyService.getGlobalStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get API key stats error:", error)
    return NextResponse.json(
      {
        error: "Failed to get API key statistics",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
