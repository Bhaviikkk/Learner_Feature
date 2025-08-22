import { apiKeyService } from "./apikeys"

export async function authenticateAPIKey(request) {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")

  if (!apiKey) {
    return {
      authenticated: false,
      error: "API key required",
      status: 401,
    }
  }

  const validation = await apiKeyService.validateAPIKey(apiKey)

  if (!validation.valid) {
    return {
      authenticated: false,
      error: validation.error,
      status: 403,
    }
  }

  return {
    authenticated: true,
    keyData: validation.keyData,
    apiKey,
  }
}

export async function requireFeature(keyData, feature) {
  if (!apiKeyService.hasFeatureAccess(keyData, feature)) {
    return {
      authorized: false,
      error: `Feature '${feature}' not available for this API key`,
      status: 403,
    }
  }

  return { authorized: true }
}

export function createAuthenticatedHandler(handler, requiredFeature = null) {
  return async (request) => {
    try {
      // Authenticate API key
      const auth = await authenticateAPIKey(request)
      if (!auth.authenticated) {
        return new Response(JSON.stringify({ error: auth.error }), {
          status: auth.status,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Check feature access if required
      if (requiredFeature) {
        const featureAuth = await requireFeature(auth.keyData, requiredFeature)
        if (!featureAuth.authorized) {
          return new Response(JSON.stringify({ error: featureAuth.error }), {
            status: featureAuth.status,
            headers: { "Content-Type": "application/json" },
          })
        }
      }

      // Record usage
      const url = new URL(request.url)
      await apiKeyService.recordUsage(auth.apiKey, url.pathname, {
        method: request.method,
        userAgent: request.headers.get("user-agent"),
      })

      // Call the actual handler with auth context
      return await handler(request, auth)
    } catch (error) {
      console.error("Authentication middleware error:", error)
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
