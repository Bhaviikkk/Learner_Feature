import crypto from "crypto"

export class APIKeyService {
  constructor() {
    // In a real application, this would connect to a database
    // For demo purposes, we'll use in-memory storage
    this.keys = new Map()
    this.usage = new Map()
    this.projects = new Map() // Added project mapping for API keys
  }

  generateAPIKey(prefix = "ai_assist") {
    const randomBytes = crypto.randomBytes(32)
    const key = `${prefix}_${randomBytes.toString("hex")}`
    return key
  }

  async generateKey(projectConfig) {
    const {
      projectId,
      name,
      url,
      features = ["explain", "chat", "analyze"],
      rateLimit = 1000,
      userId = "anonymous",
    } = projectConfig

    const apiKey = this.generateAPIKey("learn")
    const keyData = {
      id: crypto.randomUUID(),
      key: apiKey,
      projectId,
      projectName: name,
      projectUrl: url,
      userId,
      features,
      rateLimit,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
      usage: {
        totalRequests: 0,
        requestsThisHour: 0,
        lastHourReset: new Date().toISOString(),
        explanationRequests: 0,
        chatRequests: 0,
        analyzeRequests: 0,
      },
      metadata: {
        allowedDomains: [new URL(url).hostname],
        maxRequestsPerDay: 5000,
        dataNamespace: `${projectId}_data`,
      },
    }

    this.keys.set(apiKey, keyData)
    this.usage.set(apiKey, [])
    this.projects.set(projectId, apiKey) // Map project to API key

    return keyData
  }

  async createAPIKey(options = {}) {
    const {
      name = "Untitled Project",
      description = "",
      userId = "anonymous",
      rateLimit = 1000, // requests per hour
      features = ["scraping", "embeddings", "ai_explanations"],
    } = options

    const apiKey = this.generateAPIKey()
    const keyData = {
      id: crypto.randomUUID(),
      key: apiKey,
      name,
      description,
      userId,
      features,
      rateLimit,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true,
      usage: {
        totalRequests: 0,
        requestsThisHour: 0,
        lastHourReset: new Date().toISOString(),
        explanationRequests: 0,
        chatRequests: 0,
        analyzeRequests: 0,
      },
      metadata: {
        allowedDomains: [],
        maxVectors: 10000,
        maxScrapedPages: 100,
      },
    }

    this.keys.set(apiKey, keyData)
    this.usage.set(apiKey, [])

    return keyData
  }

  async validateAPIKey(apiKey, requestOrigin = null) {
    const keyData = this.keys.get(apiKey)

    if (!keyData) {
      return { valid: false, error: "Invalid API key" }
    }

    if (!keyData.isActive) {
      return { valid: false, error: "API key is disabled" }
    }

    // Check domain restrictions if origin is provided
    if (requestOrigin && keyData.metadata.allowedDomains.length > 0) {
      const requestDomain = new URL(requestOrigin).hostname
      const isAllowed = keyData.metadata.allowedDomains.some(
        (domain) => requestDomain === domain || requestDomain.endsWith(`.${domain}`),
      )

      if (!isAllowed) {
        return { valid: false, error: "Domain not authorized for this API key" }
      }
    }

    // Check rate limiting
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Reset hourly counter if needed
    if (new Date(keyData.usage.lastHourReset) < hourAgo) {
      keyData.usage.requestsThisHour = 0
      keyData.usage.lastHourReset = now.toISOString()
    }

    if (keyData.usage.requestsThisHour >= keyData.rateLimit) {
      return { valid: false, error: "Rate limit exceeded" }
    }

    return { valid: true, keyData }
  }

  async recordUsage(apiKey, endpoint, metadata = {}) {
    const keyData = this.keys.get(apiKey)
    if (!keyData) return

    // Update usage counters
    keyData.usage.totalRequests++
    keyData.usage.requestsThisHour++
    keyData.lastUsed = new Date().toISOString()

    // Track feature-specific usage
    if (endpoint.includes("explain")) {
      keyData.usage.explanationRequests++
    } else if (endpoint.includes("chat")) {
      keyData.usage.chatRequests++
    } else if (endpoint.includes("analyze")) {
      keyData.usage.analyzeRequests++
    }

    // Record detailed usage
    const usageRecord = {
      timestamp: new Date().toISOString(),
      endpoint,
      metadata: {
        ...metadata,
        projectId: keyData.projectId,
        feature: this.extractFeatureFromEndpoint(endpoint),
      },
    }

    const usageHistory = this.usage.get(apiKey) || []
    usageHistory.push(usageRecord)

    // Keep only last 1000 usage records
    if (usageHistory.length > 1000) {
      usageHistory.splice(0, usageHistory.length - 1000)
    }

    this.usage.set(apiKey, usageHistory)
    this.keys.set(apiKey, keyData)
  }

  extractFeatureFromEndpoint(endpoint) {
    if (endpoint.includes("explain")) return "explanation"
    if (endpoint.includes("chat")) return "chat"
    if (endpoint.includes("analyze")) return "analysis"
    return "unknown"
  }

  async getAPIKeyDetails(apiKey, userId) {
    const keyData = this.keys.get(apiKey)
    if (!keyData || keyData.userId !== userId) {
      return null
    }

    const usageHistory = this.usage.get(apiKey) || []
    const recentUsage = usageHistory.slice(-100) // Last 100 requests

    return {
      ...keyData,
      recentUsage,
      usageStats: {
        totalRequests: keyData.usage.totalRequests,
        requestsThisHour: keyData.usage.requestsThisHour,
        averageRequestsPerDay: this.calculateAverageDaily(usageHistory),
      },
    }
  }

  async getProjectAPIKey(projectId) {
    const apiKey = this.projects.get(projectId)
    if (!apiKey) return null

    const keyData = this.keys.get(apiKey)
    return keyData
  }

  async getAPIKeyByProject(projectId, userId) {
    const apiKey = this.projects.get(projectId)
    if (!apiKey) return null

    const keyData = this.keys.get(apiKey)
    if (!keyData || keyData.userId !== userId) {
      return null
    }

    const usageHistory = this.usage.get(apiKey) || []
    const recentUsage = usageHistory.slice(-50) // Last 50 requests

    return {
      ...keyData,
      recentUsage,
      usageStats: {
        totalRequests: keyData.usage.totalRequests,
        explanationRequests: keyData.usage.explanationRequests,
        chatRequests: keyData.usage.chatRequests,
        analyzeRequests: keyData.usage.analyzeRequests,
        averageRequestsPerDay: this.calculateAverageDaily(usageHistory),
      },
    }
  }

  async listAPIKeys(userId) {
    const userKeys = []
    for (const [key, data] of this.keys.entries()) {
      if (data.userId === userId) {
        // Don't expose the full key in listings
        userKeys.push({
          ...data,
          key: `${data.key.substring(0, 12)}...${data.key.substring(data.key.length - 4)}`,
          fullKey: undefined,
          usageStats: {
            totalRequests: data.usage.totalRequests,
            explanationRequests: data.usage.explanationRequests,
            chatRequests: data.usage.chatRequests,
            analyzeRequests: data.usage.analyzeRequests,
          },
        })
      }
    }
    return userKeys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  async updateAPIKey(apiKey, userId, updates) {
    const keyData = this.keys.get(apiKey)
    if (!keyData || keyData.userId !== userId) {
      return null
    }

    const allowedUpdates = ["name", "description", "isActive", "rateLimit", "features", "metadata"]
    const updatedData = { ...keyData }

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        updatedData[key] = value
      }
    }

    updatedData.updatedAt = new Date().toISOString()
    this.keys.set(apiKey, updatedData)

    return updatedData
  }

  async deleteAPIKey(apiKey, userId) {
    const keyData = this.keys.get(apiKey)
    if (!keyData || keyData.userId !== userId) {
      return false
    }

    this.keys.delete(apiKey)
    this.usage.delete(apiKey)
    this.projects.delete(keyData.projectId) // Remove project mapping when API key is deleted
    return true
  }

  calculateAverageDaily(usageHistory) {
    if (usageHistory.length === 0) return 0

    const oldestRecord = new Date(usageHistory[0].timestamp)
    const newestRecord = new Date(usageHistory[usageHistory.length - 1].timestamp)
    const daysDiff = Math.max(1, (newestRecord - oldestRecord) / (1000 * 60 * 60 * 24))

    return Math.round(usageHistory.length / daysDiff)
  }

  // Utility method to check if API key has specific feature access
  hasFeatureAccess(keyData, feature) {
    return keyData.features.includes(feature)
  }

  async updateAllowedDomains(apiKey, userId, domains) {
    const keyData = this.keys.get(apiKey)
    if (!keyData || keyData.userId !== userId) {
      return null
    }

    keyData.metadata.allowedDomains = domains
    keyData.updatedAt = new Date().toISOString()
    this.keys.set(apiKey, keyData)

    return keyData
  }

  async getGlobalStats() {
    const totalKeys = this.keys.size
    const activeKeys = Array.from(this.keys.values()).filter((key) => key.isActive).length
    const totalProjects = this.projects.size
    const totalRequests = Array.from(this.keys.values()).reduce((sum, key) => sum + key.usage.totalRequests, 0)
    const totalExplanations = Array.from(this.keys.values()).reduce(
      (sum, key) => sum + key.usage.explanationRequests,
      0,
    )

    return {
      totalKeys,
      activeKeys,
      totalProjects,
      totalRequests,
      totalExplanations,
      averageRequestsPerKey: totalKeys > 0 ? Math.round(totalRequests / totalKeys) : 0,
      averageExplanationsPerProject: totalProjects > 0 ? Math.round(totalExplanations / totalProjects) : 0,
    }
  }
}

// Singleton instance
export const apiKeyService = new APIKeyService()
