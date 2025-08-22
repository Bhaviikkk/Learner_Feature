// lib/vectordb.js

import { Pinecone } from "@pinecone-database/pinecone"
import fetch from "node-fetch"

// ✅ Force Pinecone SDK to use node-fetch instead of Next.js fetch
if (typeof global.fetch === "undefined" || global.fetch.name !== "fetch") {
  global.fetch = fetch
}

class InMemoryVectorStore {
  constructor() {
    this.vectors = new Map()
    this.initialized = true
  }

  async initialize() {
    console.log("[v0] Using in-memory vector storage (fallback mode)")
    return true
  }

  async upsertVectors(vectors) {
    console.log("[v0] Storing", vectors.length, "vectors in memory")
    vectors.forEach((vector) => {
      this.vectors.set(vector.id, {
        id: vector.id,
        values: vector.embedding,
        metadata: vector.metadata,
      })
    })
    return { upsertedCount: vectors.length }
  }

  async queryVectors(queryEmbedding, options = {}) {
    const { topK = 5, filter = {} } = options
    const allVectors = Array.from(this.vectors.values())

    const results = allVectors
      .filter((vector) => {
        if (filter.apiKey && vector.metadata?.apiKey !== filter.apiKey) return false
        return true
      })
      .slice(0, topK)
      .map((vector) => ({
        id: vector.id,
        score: 0.8, // Mock similarity
        metadata: vector.metadata,
      }))

    return results
  }

  async deleteVectors(ids) {
    ids.forEach((id) => this.vectors.delete(id))
    return { success: true, deletedCount: ids.length }
  }

  async deleteByFilter(filter) {
    let deletedCount = 0
    for (const [id, vector] of this.vectors.entries()) {
      if (filter.apiKey && vector.metadata?.apiKey === filter.apiKey) {
        this.vectors.delete(id)
        deletedCount++
      }
    }
    return { success: true, deletedCount }
  }

  async getIndexStats() {
    return {
      totalVectorCount: this.vectors.size,
      dimension: 1024, // ✅ match Pinecone index
      indexFullness: 0.1,
    }
  }
}

export class VectorDatabase {
  constructor() {
    this.client = null
    this.index = null
    this.indexName = process.env.PINECONE_INDEX_NAME || "bhavik"
    this.fallbackMode = false
    this.store = null
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return

    try {
      if (!process.env.PINECONE_API_KEY) {
        throw new Error("Missing Pinecone API key")
      }

      console.log("Initializing Pinecone client...")
      this.client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      })

      this.indexName = process.env.PINECONE_INDEX_NAME || "bhavik"

      const existing = await this.client.listIndexes()
      if (!existing.indexes.some((idx) => idx.name === this.indexName)) {
        console.log(`Creating index: ${this.indexName}`)
        await this.client.createIndex({
          name: this.indexName,
          dimension: 1024, // ✅ must match embeddings
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        })

        await this.waitForIndexReady()
      }

      this.index = this.client.index(this.indexName)
      this.initialized = true
      console.log("Pinecone initialized successfully")
    } catch (error) {
      console.error("Pinecone initialization failed:", error)
      console.warn("[v0] Falling back to in-memory vector storage")
      this.fallbackMode = true
      this.store = new InMemoryVectorStore()
      await this.store.initialize()
    }
  }

  async waitForIndexReady(maxWaitTime = 60000) {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const desc = await this.client.describeIndex(this.indexName)
        if (desc.status?.ready) {
          console.log("Index is ready")
          return
        }
      } catch {
        console.log("Waiting for index to be ready...")
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error("Index creation timeout")
  }

  async upsertVectors(vectors, namespace = null) {
    await this.initialize()
    console.log("[upsertVectors] Sending", formattedVectors.length, "vectors to Pinecone namespace:", namespace)

    if (this.fallbackMode) {
      return await this.store.upsertVectors(vectors, { namespace })
    }

    try {
      const formattedVectors = vectors.map((vector) => ({
        id: vector.id,
        values: vector.embedding,
        metadata: {
          text: vector.text?.substring(0, 40000),
          url: vector.url,
          title: vector.title,
          apiKey: vector.apiKey,
          timestamp: vector.timestamp || new Date().toISOString(),
          ...vector.metadata,
        },
      }))

      const target = namespace ? this.index.namespace(namespace) : this.index
      return await target.upsert(formattedVectors)
    } catch (error) {
      console.error("Vector upsert error:", error)
      this.fallbackMode = true
      this.store = new InMemoryVectorStore()
      await this.store.initialize()
      return await this.store.upsertVectors(vectors, { namespace })
    }
  }

  async queryVectors(queryEmbedding, options = {}) {
    await this.initialize()

    const {
      topK = 5,
      filter = {},
      includeMetadata = true,
      includeValues = false,
      namespace = null,
      threshold = null,
    } = options

    if (this.fallbackMode) {
      const results = await this.store.queryVectors(queryEmbedding, { topK, filter, namespace })
      return typeof threshold === "number" ? results.filter(r => r.score >= threshold) : results
    }

    try {
      const queryRequest = {
        vector: queryEmbedding,
        topK,
        includeMetadata,
        includeValues,
        filter,
      }

      const target = namespace ? this.index.namespace(namespace) : this.index
      const response = await target.query(queryRequest)
      let matches = response.matches || []
      if (typeof threshold === "number") {
        matches = matches.filter((m) => m.score >= threshold)
      }
      return matches
    } catch (error) {
      console.error("Vector query error:", error)
      throw new Error(`Failed to query vectors: ${error.message}`)
    }
  }

  async deleteVectors(ids) {
    await this.initialize()

    if (this.fallbackMode) {
      return await this.store.deleteVectors(ids)
    }

    try {
      await this.index.deleteMany(ids)
      return { success: true, deletedCount: ids.length }
    } catch (error) {
      console.error("Vector deletion error:", error)
      throw new Error(`Failed to delete vectors: ${error.message}`)
    }
  }

  async deleteByFilter(filter) {
    await this.initialize()

    if (this.fallbackMode) {
      return await this.store.deleteByFilter(filter)
    }

    try {
      await this.index.deleteMany({ filter })
      return { success: true }
    } catch (error) {
      console.error("Vector deletion by filter error:", error)
      throw new Error(`Failed to delete vectors by filter: ${error.message}`)
    }
  }

  async getIndexStats() {
    await this.initialize()

    if (this.fallbackMode) {
      return await this.store.getIndexStats()
    }

    try {
      return await this.index.describeIndexStats()
    } catch (error) {
      console.error("Index stats error:", error)
      throw new Error(`Failed to get index stats: ${error.message}`)
    }
  }

  generateVectorId(url, chunkIndex = 0) {
    const urlHash = Buffer.from(url).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 20)
    return `${urlHash}_${chunkIndex}_${Date.now()}`
  }

  async storeEmbeddings(embeddings, projectMetadata) {
    await this.initialize()
    console.log("[storeEmbeddings] Received", embeddings.length, "embeddings for project", projectMetadata.projectId)
    try {
      const ns = projectMetadata.namespace
        || `${projectMetadata.projectId}_${projectMetadata.contentType || "mainContent"}`

      const vectors = embeddings.map((embedding) => ({
        id: embedding.id,
        embedding: embedding.embedding,
        text: embedding.embeddingText || embedding.originalContent,
        url: projectMetadata.url,
        title: projectMetadata.name,
        apiKey: projectMetadata.projectId,
        timestamp: new Date().toISOString(),
        metadata: {
          projectId: projectMetadata.projectId,
          contentType: embedding.contentType,
          originalContent: embedding.originalContent?.substring(0, 1000),
          ...embedding.metadata,
          ...projectMetadata,
        },
      }))

      return await this.upsertVectors(vectors, ns)
    } catch (error) {
      console.error("Store embeddings error:", error)
      throw new Error(`Failed to store embeddings: ${error.message}`)
    }
  }

  async storeMetadata(projectId, metadata) {
    await this.initialize()

    try {
      const ns = `${projectId}_metadata`
      const metadataVector = {
        id: `${projectId}_metadata_${Date.now()}`,
        embedding: new Array(1024).fill(0), // ✅ match dimension
        text: JSON.stringify(metadata).substring(0, 1000),
        url: metadata.url,
        title: metadata.name,
        apiKey: projectId,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          isMetadata: true,
          projectId,
        },
      }

      return await this.upsertVectors([metadataVector], ns)
    } catch (error) {
      console.error("Store metadata error:", error)
      throw new Error(`Failed to store metadata: ${error.message}`)
    }
  }
}

export { VectorDatabase as VectorDBService }
