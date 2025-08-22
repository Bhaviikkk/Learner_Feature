import { NextResponse } from "next/server"
import { createAuthenticatedHandler } from "../../../../lib/middleware"

async function handleWidgetStatus(request, auth) {
  try {
    const { url } = await request.json()

    // Return widget configuration and project status
    const widgetConfig = {
      projectId: auth.keyData.projectId,
      projectName: auth.keyData.projectName,
      projectUrl: auth.keyData.projectUrl,
      features: auth.keyData.features,
      language: "en", // Default, can be overridden by widget
      status: "active",
      usage: {
        totalRequests: auth.keyData.usage.totalRequests,
        explanationRequests: auth.keyData.usage.explanationRequests,
        chatRequests: auth.keyData.usage.chatRequests,
        rateLimit: auth.keyData.rateLimit,
        requestsThisHour: auth.keyData.usage.requestsThisHour,
      },
      allowedDomains: auth.keyData.metadata.allowedDomains,
    }

    // Check if current URL is allowed
    let domainAllowed = true
    if (url && auth.keyData.metadata.allowedDomains.length > 0) {
      try {
        const requestDomain = new URL(url).hostname
        domainAllowed = auth.keyData.metadata.allowedDomains.some(
          (domain) => requestDomain === domain || requestDomain.endsWith(`.${domain}`),
        )
      } catch (urlError) {
        domainAllowed = false
      }
    }

    return NextResponse.json({
      success: true,
      config: widgetConfig,
      domainAllowed,
      rateLimitStatus: {
        remaining: Math.max(0, auth.keyData.rateLimit - auth.keyData.usage.requestsThisHour),
        resetTime: auth.keyData.usage.lastHourReset,
      },
    })
  } catch (error) {
    console.error("Widget status API error:", error)
    return NextResponse.json(
      {
        error: "Failed to get widget status",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export const POST = createAuthenticatedHandler(handleWidgetStatus, "explain")
