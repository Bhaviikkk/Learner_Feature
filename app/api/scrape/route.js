import { NextResponse } from "next/server"
import { WebScraper } from "../../../lib/scraper"

export async function POST(request) {
  try {
    const { url, options = {} } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    const scraper = new WebScraper()

    try {
      const content = await scraper.scrapeWebsite(url, options)
      const textForEmbedding = WebScraper.extractTextForEmbedding(content)

      return NextResponse.json({
        success: true,
        data: {
          ...content,
          textForEmbedding,
          scrapedAt: new Date().toISOString(),
        },
      })
    } finally {
      await scraper.close()
    }
  } catch (error) {
    console.error("Scraping API error:", error)
    return NextResponse.json(
      {
        error: "Failed to scrape website",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Web Scraping API",
    endpoints: {
      POST: "/api/scrape - Scrape a single website",
      body: {
        url: "string (required)",
        options: {
          maxPages: "number (default: 10)",
          includeImages: "boolean (default: false)",
          includeLinks: "boolean (default: true)",
          timeout: "number (default: 30000)",
          waitForSelector: "string (optional)",
        },
      },
    },
  })
}
