"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from "@mui/material"
import { IconChevronDown, IconDatabase, IconSearch } from "@tabler/icons-react"

export default function EmbeddingsInterface() {
  const [query, setQuery] = useState("")
  const [apiKey, setApiKey] = useState("demo-key-123")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState("")
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/embeddings/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a query")
      return
    }

    if (!apiKey.trim()) {
      setError("Please enter an API key")
      return
    }

    setLoading(true)
    setError("")
    setResults(null)

    try {
      const response = await fetch("/api/embeddings/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          apiKey: apiKey.trim(),
          options: {
            topK: 5,
            minScore: 0.7,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to query embeddings")
      }

      setResults(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      {/* Database Stats */}
      {stats && (
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconDatabase size={24} />
              Vector Database Status
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip label={`${stats.totalVectors} vectors`} color="primary" />
              <Chip label={`${stats.dimension}D embeddings`} />
              <Chip label={`${(stats.indexFullness * 100).toFixed(1)}% full`} />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Query Interface */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconSearch size={24} />
            Semantic Search
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Search Query"
              multiline
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your question or search query..."
              disabled={loading}
            />

            <Button
              variant="contained"
              onClick={handleQuery}
              disabled={loading || !query.trim() || !apiKey.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={20} /> : "Search"}
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {results && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Found {results.filteredMatches} relevant results out of {results.totalMatches} total matches
              </Alert>

              {results.results.length === 0 ? (
                <Alert severity="info">
                  No results found. Try a different query or check if content has been indexed for this API key.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {results.results.map((result, index) => (
                    <Accordion key={result.id}>
                      <AccordionSummary expandIcon={<IconChevronDown />}>
                        <Box sx={{ width: "100%" }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                              {result.title || `Result ${index + 1}`}
                            </Typography>
                            <Chip
                              label={`${(result.score * 100).toFixed(1)}% match`}
                              color={result.score > 0.8 ? "success" : "primary"}
                              size="small"
                            />
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={result.score * 100}
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                            {result.text.substring(0, 300)}...
                          </Typography>
                          {result.url && (
                            <Typography variant="caption" color="text.secondary">
                              Source: {result.url}
                            </Typography>
                          )}
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Chunk {result.metadata.chunkIndex + 1} of {result.metadata.totalChunks}
                            </Typography>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
