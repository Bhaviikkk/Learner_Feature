import { chromium } from "playwright"

export class WebScraper {
  constructor() {
    this.browser = null
    this.context = null
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
      this.context = await this.browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      })
    }
  }

  async scrapeWebsite(url, options = {}) {
    const {
      maxPages = 10,
      includeImages = false,
      includeLinks = true,
      timeout = 15000, // Reduced timeout from 30s to 15s
      waitForSelector = null,
    } = options

    let page = null
    try {
      await this.initialize()
      page = await this.context.newPage()

      page.setDefaultTimeout(timeout)

      // Try multiple navigation strategies with fallbacks
      let navigationSuccess = false
      const strategies = [
        { waitUntil: "domcontentloaded" }, // Fastest - just wait for DOM
        { waitUntil: "load" }, // Wait for all resources
        { waitUntil: "networkidle", timeout: 10000 }, // Last resort with shorter timeout
      ]

      for (const strategy of strategies) {
        try {
          console.log(`[WebScraper] Trying navigation strategy: ${strategy.waitUntil}`)
          await page.goto(url, strategy)
          navigationSuccess = true
          console.log(`[WebScraper] Successfully navigated using: ${strategy.waitUntil}`)
          break
        } catch (navError) {
          console.log(`[WebScraper] Strategy ${strategy.waitUntil} failed: ${navError.message}`)
          continue
        }
      }

      if (!navigationSuccess) {
        throw new Error("All navigation strategies failed")
      }

      await page.waitForTimeout(2000)

      // Wait for specific selector if provided (with shorter timeout)
      if (waitForSelector) {
        try {
          await page.waitForSelector(waitForSelector, { timeout: 5000 })
        } catch (selectorError) {
          console.log(`[WebScraper] Selector wait failed, continuing anyway: ${selectorError.message}`)
        }
      }

      // Extract structured content
      const content = await page.evaluate(
        (options) => {
          const { includeImages, includeLinks } = options

          // Helper function to clean text
          const cleanText = (text) => {
            return text.replace(/\s+/g, " ").trim()
          }

          // Extract main content areas
          const contentSelectors = ["main", "article", '[role="main"]', ".content", "#content", ".main-content", "body"]

          let mainContent = null
          for (const selector of contentSelectors) {
            const element = document.querySelector(selector)
            if (element) {
              mainContent = element
              break
            }
          }

          if (!mainContent) {
            mainContent = document.body
          }

          // Extract structured data
          const result = {
            url: window.location.href,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || "",
            headings: [],
            paragraphs: [],
            lists: [],
            links: [],
            images: [],
            metadata: {
              author: document.querySelector('meta[name="author"]')?.content || "",
              keywords: document.querySelector('meta[name="keywords"]')?.content || "",
              publishedTime: document.querySelector('meta[property="article:published_time"]')?.content || "",
              modifiedTime: document.querySelector('meta[property="article:modified_time"]')?.content || "",
            },
          }

          // Extract headings (h1-h6)
          const headings = mainContent.querySelectorAll("h1, h2, h3, h4, h5, h6")
          headings.forEach((heading) => {
            const text = cleanText(heading.textContent)
            if (text) {
              result.headings.push({
                level: Number.parseInt(heading.tagName.charAt(1)),
                text: text,
                id: heading.id || null,
              })
            }
          })

          // Extract paragraphs
          const paragraphs = mainContent.querySelectorAll("p")
          paragraphs.forEach((p) => {
            const text = cleanText(p.textContent)
            if (text && text.length > 20) {
              // Filter out very short paragraphs
              result.paragraphs.push(text)
            }
          })

          // Extract lists
          const lists = mainContent.querySelectorAll("ul, ol")
          lists.forEach((list) => {
            const items = Array.from(list.querySelectorAll("li")).map((li) => cleanText(li.textContent))
            if (items.length > 0) {
              result.lists.push({
                type: list.tagName.toLowerCase(),
                items: items.filter((item) => item.length > 0),
              })
            }
          })

          // Extract links if requested
          if (includeLinks) {
            const links = mainContent.querySelectorAll("a[href]")
            links.forEach((link) => {
              const href = link.href
              const text = cleanText(link.textContent)
              if (href && text && !href.startsWith("javascript:")) {
                result.links.push({
                  url: href,
                  text: text,
                  isInternal: href.includes(window.location.hostname),
                })
              }
            })
          }

          // Extract images if requested
          if (includeImages) {
            const images = mainContent.querySelectorAll("img[src]")
            images.forEach((img) => {
              result.images.push({
                src: img.src,
                alt: img.alt || "",
                title: img.title || "",
              })
            })
          }

          return result
        },
        { includeImages, includeLinks },
      )

      console.log(`[WebScraper] Successfully scraped ${url}`)
      return content
    } catch (error) {
      console.error("Scraping error:", error)
      throw new Error(`Failed to scrape ${url}: ${error.message}`)
    } finally {
      if (page) {
        try {
          await page.close()
        } catch (closeError) {
          console.log(`[WebScraper] Error closing page: ${closeError.message}`)
        }
      }
    }
  }

  async scrapeMultiplePages(urls, options = {}) {
    const results = []
    const errors = []

    for (const url of urls) {
      try {
        const content = await this.scrapeWebsite(url, options)
        results.push(content)
      } catch (error) {
        errors.push({ url, error: error.message })
      }
    }

    return { results, errors }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.context = null
    }
  }

  // Utility method to extract clean text for embeddings
  static extractTextForEmbedding(scrapedContent) {
    const textParts = []

    // Add title and description
    if (scrapedContent.title) {
      textParts.push(`Title: ${scrapedContent.title}`)
    }
    if (scrapedContent.description) {
      textParts.push(`Description: ${scrapedContent.description}`)
    }

    // Add headings with hierarchy
    scrapedContent.headings.forEach((heading) => {
      textParts.push(`${"#".repeat(heading.level)} ${heading.text}`)
    })

    // Add paragraphs
    textParts.push(...scrapedContent.paragraphs)

    // Add list items
    scrapedContent.lists.forEach((list) => {
      list.items.forEach((item) => {
        textParts.push(`- ${item}`)
      })
    })

    return textParts.join("\n\n")
  }
}
