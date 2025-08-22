import { NextResponse } from "next/server"
import { WebScraper } from "../../../../lib/scraper"

export async function POST(request) {
  try {
    const { urls, options = {} } = await request.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "URLs array is required" }, { status: 400 })
    }

    if (urls.length > 50) {
      return NextResponse.json({ error: "Maximum 50 URLs allowed per batch" }, { status: 400 })
    }

    // Validate all URLs
    for (const url of urls) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json({ error: `Invalid URL format: ${url}` }, { status: 400 })
      }
    }

    const scraper = new WebScraper()

    try {
      const { results, errors } = await scraper.scrapeMultiplePages(urls, options)

      // Process results for embeddings
      const processedResults = results.map((content) => ({
        ...content,
        textForEmbedding: WebScraper.extractTextForEmbedding(content),
        scrapedAt: new Date().toISOString(),
      }))

      return NextResponse.json({
        success: true,
        data: {
          results: processedResults,
          errors,
          summary: {
            total: urls.length,
            successful: results.length,
            failed: errors.length,
          },
        },
      })
    } finally {
      await scraper.close()
    }
  } catch (error) {
    console.error("Batch scraping API error:", error)
    return NextResponse.json(
      {
        error: "Failed to scrape websites",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
