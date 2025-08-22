import { WebScraper } from "./scraper.js"
import { EmbeddingsService } from "./embeddings.js"
import { VectorDBService } from "./vectordb.js"

export class DataProcessor {
  constructor() {
    this.scraper = new WebScraper()
    this.embeddingsService = new EmbeddingsService()
    this.vectorDB = new VectorDBService()
  }

  async processWebsiteForProject(url, projectConfig) {
    const { name, projectId, options = {} } = projectConfig

    try {
      console.log(`[DataProcessor] Starting processing for project: ${name}`)

      // Step 1: Scrape website with enhanced options
      const scrapingOptions = {
        maxPages: options.maxPages || 10,
        includeImages: options.includeImages || false,
        includeLinks: true,
        timeout: 30000,
        ...options.scraping,
      }

      const scrapedData = await this.scraper.scrapeWebsite(url, scrapingOptions)
      console.log(
        `[DataProcessor] Scraped ${scrapedData.paragraphs.length} paragraphs, ${scrapedData.headings.length} headings`,
      )

      // Step 2: Process and structure the content
      const processedContent = this.structureContent(scrapedData)

      // Step 3: Generate embeddings for different content types
      const embeddingResults = await this.generateContentEmbeddings(processedContent, projectId)

      // Step 4: Store in vector database with metadata
      await this.storeProcessedData(embeddingResults, {
        projectId,
        url,
        name,
        originalData: scrapedData,
        processedAt: new Date().toISOString(),
      })

      // Step 5: Generate project summary and statistics
      const projectStats = this.generateProjectStats(scrapedData, embeddingResults)

      return {
        success: true,
        projectId,
        stats: projectStats,
        contentTypes: Object.keys(processedContent),
        embeddingsCount: embeddingResults.embeddings.length,
      }
    } catch (error) {
      console.error(`[DataProcessor] Error processing ${url}:`, error)
      throw new Error(`Failed to process website: ${error.message}`)
    }
  }

  structureContent(scrapedData) {
    const structured = {
      // Main content for general explanations
      mainContent: [],

      // Navigation and UI elements
      navigation: [],

      // Interactive elements (buttons, forms, etc.)
      interactive: [],

      // Informational content
      informational: [],
    }

    // Process headings as navigation/structure elements
    scrapedData.headings.forEach((heading) => {
      if (heading.level <= 2) {
        structured.navigation.push({
          type: "heading",
          level: heading.level,
          text: heading.text,
          id: heading.id,
          context: `Main section: ${heading.text}`,
        })
      }

      structured.mainContent.push({
        type: "heading",
        content: heading.text,
        metadata: { level: heading.level, id: heading.id },
      })
    })

    // Process paragraphs as informational content
    scrapedData.paragraphs.forEach((paragraph, index) => {
      structured.informational.push({
        type: "paragraph",
        content: paragraph,
        metadata: { index, length: paragraph.length },
      })

      structured.mainContent.push({
        type: "paragraph",
        content: paragraph,
        metadata: { index },
      })
    })

    // Process lists as structured information
    scrapedData.lists.forEach((list, index) => {
      const listContent = `${list.type.toUpperCase()} LIST: ${list.items.join("; ")}`

      structured.informational.push({
        type: "list",
        content: listContent,
        metadata: { listType: list.type, itemCount: list.items.length, index },
      })
    })

    // Process links as interactive elements
    scrapedData.links.forEach((link, index) => {
      if (link.text && link.text.length > 3) {
        structured.interactive.push({
          type: "link",
          content: `Link: ${link.text} (${link.url})`,
          metadata: {
            url: link.url,
            isInternal: link.isInternal,
            index,
          },
        })
      }
    })

    return structured
  }

  async generateContentEmbeddings(structuredContent, projectId) {
    const allEmbeddings = []
    const errors = []

    for (const [contentType, items] of Object.entries(structuredContent)) {
      console.log(`[DataProcessor] Processing ${items.length} ${contentType} items`)

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        try {
          // Create embedding-ready text
          const embeddingText = this.prepareTextForEmbedding(item)

          if (embeddingText.length < 20) continue // Skip very short content

          const embedding = await this.embeddingsService.generateEmbedding(embeddingText)

          allEmbeddings.push({
            id: `${projectId}_${contentType}_${i}`,
            projectId,
            contentType,
            originalContent: item.content,
            embeddingText,
            embedding,
            metadata: {
              ...item.metadata,
              type: item.type,
              processedAt: new Date().toISOString(),
            },
          })

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 150))
        } catch (error) {
          errors.push({
            contentType,
            index: i,
            content: item.content.substring(0, 100),
            error: error.message,
          })
        }
      }
    }

    return { embeddings: allEmbeddings, errors }
  }

  prepareTextForEmbedding(contentItem) {
    let text = contentItem.content

    // Add context based on content type
    switch (contentItem.type) {
      case "heading":
        text = `Section Header: ${text}`
        break
      case "paragraph":
        text = `Content: ${text}`
        break
      case "list":
        text = `List Information: ${text}`
        break
      case "link":
        text = `Navigation Link: ${text}`
        break
      default:
        text = `Website Element: ${text}`
    }

    return this.embeddingsService.preprocessText(text)
  }

  async storeProcessedData(embeddingResults, projectMetadata) {
    const { embeddings } = embeddingResults

    // Group embeddings by content type for better organization
    const groupedEmbeddings = embeddings.reduce((groups, embedding) => {
      const type = embedding.contentType
      if (!groups[type]) groups[type] = []
      groups[type].push(embedding)
      return groups
    }, {})

    // Store each content type separately for better querying
    for (const [contentType, typeEmbeddings] of Object.entries(groupedEmbeddings)) {
      await this.vectorDB.storeEmbeddings(typeEmbeddings, {
        ...projectMetadata,
        contentType,
        namespace: `${projectMetadata.projectId}_${contentType}`,
      })
    }

    // Store project metadata
    await this.storeProjectMetadata(projectMetadata, embeddingResults)
  }

  async storeProjectMetadata(projectMetadata, embeddingResults) {
    const metadata = {
      ...projectMetadata,
      contentStats: this.generateProjectStats(projectMetadata.originalData, embeddingResults),
      embeddingStats: {
        total: embeddingResults.embeddings.length,
        byType: embeddingResults.embeddings.reduce((counts, emb) => {
          counts[emb.contentType] = (counts[emb.contentType] || 0) + 1
          return counts
        }, {}),
        errors: embeddingResults.errors.length,
      },
    }

    // Store in a separate metadata collection/namespace
    await this.vectorDB.storeMetadata(projectMetadata.projectId, metadata)
  }

  generateProjectStats(scrapedData, embeddingResults) {
    return {
      content: {
        headings: scrapedData.headings.length,
        paragraphs: scrapedData.paragraphs.length,
        lists: scrapedData.lists.length,
        links: scrapedData.links.length,
        images: scrapedData.images?.length || 0,
      },
      embeddings: {
        total: embeddingResults.embeddings.length,
        successful: embeddingResults.embeddings.length,
        failed: embeddingResults.errors.length,
      },
      metadata: {
        title: scrapedData.title,
        description: scrapedData.description,
        author: scrapedData.metadata.author,
        hasStructuredData: !!(scrapedData.metadata.publishedTime || scrapedData.metadata.author),
      },
    }
  }

  async cleanup() {
    await this.scraper.close()
  }
}
