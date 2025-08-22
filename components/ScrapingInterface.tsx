"use client"

import { useState } from "react"
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material"
import { IconChevronDown, IconWorld, IconCheck } from "@tabler/icons-react"

export default function ScrapingInterface() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [includeImages, setIncludeImages] = useState(false)
  const [includeLinks, setIncludeLinks] = useState(true)

  const handleScrape = async () => {
    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          options: {
            includeImages,
            includeLinks,
            timeout: 30000,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape website")
      }

      setResult(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWorld size={24} />
          Web Scraping Interface
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Website URL"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Switch checked={includeLinks} onChange={(e) => setIncludeLinks(e.target.checked)} />}
              label="Include Links"
            />
            <FormControlLabel
              control={<Switch checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)} />}
              label="Include Images"
            />
          </Stack>

          <Button variant="contained" onClick={handleScrape} disabled={loading || !url.trim()} sx={{ minWidth: 120 }}>
            {loading ? <CircularProgress size={20} /> : "Scrape Website"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconCheck size={20} />
                <Typography>Successfully scraped: {result.title}</Typography>
              </Stack>
            </Alert>

            <Accordion>
              <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography variant="subtitle1">Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Typography>
                    <strong>Title:</strong> {result.title}
                  </Typography>
                  <Typography>
                    <strong>URL:</strong> {result.url}
                  </Typography>
                  <Typography>
                    <strong>Description:</strong> {result.description || "No description"}
                  </Typography>
                  <Typography>
                    <strong>Scraped:</strong> {new Date(result.scrapedAt).toLocaleString()}
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography variant="subtitle1">
                  Content Structure
                  <Chip label={`${result.headings.length} headings`} size="small" sx={{ ml: 1 }} />
                  <Chip label={`${result.paragraphs.length} paragraphs`} size="small" sx={{ ml: 1 }} />
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {result.headings.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Headings:
                      </Typography>
                      {result.headings.slice(0, 5).map((heading, index) => (
                        <Typography key={index} variant="body2" sx={{ pl: heading.level }}>
                          {"#".repeat(heading.level)} {heading.text}
                        </Typography>
                      ))}
                      {result.headings.length > 5 && (
                        <Typography variant="caption" color="text.secondary">
                          ... and {result.headings.length - 5} more headings
                        </Typography>
                      )}
                    </Box>
                  )}

                  {result.paragraphs.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Sample Paragraphs:
                      </Typography>
                      {result.paragraphs.slice(0, 2).map((paragraph, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                          {paragraph.substring(0, 200)}...
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {result.links && result.links.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<IconChevronDown />}>
                  <Typography variant="subtitle1">
                    Links
                    <Chip label={result.links.length} size="small" sx={{ ml: 1 }} />
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {result.links.slice(0, 10).map((link, index) => (
                      <Box key={index}>
                        <Typography variant="body2" noWrap>
                          <strong>{link.text}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {link.url}
                        </Typography>
                      </Box>
                    ))}
                    {result.links.length > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {result.links.length - 10} more links
                      </Typography>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography variant="subtitle1">Text for AI Processing</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: "grey.50",
                    p: 2,
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {result.textForEmbedding.substring(0, 1000)}...
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
