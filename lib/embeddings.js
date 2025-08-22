import { GoogleGenerativeAI } from "@google/generative-ai"

export class EmbeddingsService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ model: "embedding-001" })
  }

  async generateEmbedding(text) {
    try {
      // Clean and prepare text for embedding
      const cleanText = this.preprocessText(text)

      if (!cleanText || cleanText.length < 10) {
        throw new Error("Text too short for embedding generation")
      }

      const result = await this.model.embedContent(cleanText)
      return result.embedding.values
    } catch (error) {
      console.error("Embedding generation error:", error)
      throw new Error(`Failed to generate embedding: ${error.message}`)
    }
  }

  async generateBatchEmbeddings(texts) {
    const embeddings = []
    const errors = []

    for (let i = 0; i < texts.length; i++) {
      try {
        const embedding = await this.generateEmbedding(texts[i])
        embeddings.push({
          index: i,
          text: texts[i],
          embedding,
        })
      } catch (error) {
        errors.push({
          index: i,
          text: texts[i],
          error: error.message,
        })
      }

      // Add small delay to respect rate limits
      if (i < texts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return { embeddings, errors }
  }

  preprocessText(text) {
    if (!text || typeof text !== "string") {
      return ""
    }

    return text
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, "") // Remove special characters except basic punctuation
      .trim()
      .substring(0, 8000) // Limit text length for embedding model
  }

  // Utility function to chunk large text into smaller pieces
  chunkText(text, maxChunkSize = 1000, overlap = 100) {
    const words = text.split(" ")
    const chunks = []

    for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
      const chunk = words.slice(i, i + maxChunkSize).join(" ")
      if (chunk.trim().length > 50) {
        // Only include meaningful chunks
        chunks.push(chunk.trim())
      }
    }

    return chunks
  }
}
