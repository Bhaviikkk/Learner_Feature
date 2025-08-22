"use client"

import { useState } from "react"
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
} from "@mui/material"
import { IconSearch, IconDatabase, IconKey } from "@tabler/icons-react"

export default function VerifyDataPage() {
  const [apiKey, setApiKey] = useState("learn_5c7692583df03e7d73ea3dbc6e1d2c52a1354caae64d82f569d03d562d2535c7")
  const [pineconeStats, setPineconeStats] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const checkPineconeStats = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/embeddings/stats")
      const data = await response.json()

      if (response.ok) {
        setPineconeStats(data.data)
      } else {
        setError(data.error || "Failed to get Pinecone stats")
      }
    } catch (err) {
      setError("Error connecting to Pinecone: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const queryProjectData = async () => {
    if (!apiKey) {
      setError("Please enter your API key")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/embeddings/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "website content",
          apiKey: apiKey,
          options: { topK: 10, minScore: 0.1 },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setProjectData(data.data)
      } else {
        setError(data.error || "Failed to query project data")
      }
    } catch (err) {
      setError("Error querying data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Data Verification Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Verify your project data is stored correctly in Pinecone
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconDatabase /> Pinecone Index Stats
              </Typography>
              <Button variant="contained" onClick={checkPineconeStats} disabled={loading} sx={{ mb: 2 }}>
                Check Pinecone Stats
              </Button>

              {pineconeStats && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Connected to Pinecone index: {pineconeStats.indexName}
                  </Alert>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Total Vectors" secondary={pineconeStats.totalVectors.toLocaleString()} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Dimensions" secondary={pineconeStats.dimension} />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Index Fullness"
                        secondary={`${(pineconeStats.indexFullness * 100).toFixed(2)}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Namespaces"
                        secondary={Object.keys(pineconeStats.namespaces).length || "Default namespace"}
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconKey /> Your Project Data
              </Typography>

              <TextField
                fullWidth
                label="Your API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />

              <Button
                variant="contained"
                onClick={queryProjectData}
                disabled={loading || !apiKey}
                startIcon={<IconSearch />}
                sx={{ mb: 2 }}
              >
                Query Your Data
              </Button>

              {projectData && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Found {projectData.results.length} data chunks for your project
                  </Alert>

                  <Typography variant="subtitle2" gutterBottom>
                    Data Samples:
                  </Typography>

                  {projectData.results.slice(0, 3).map((result, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 1, p: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Score: {result.score.toFixed(3)}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {result.text.substring(0, 150)}...
                      </Typography>
                      {result.metadata.title && <Chip label={result.metadata.title} size="small" sx={{ mt: 1 }} />}
                    </Card>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Card elevation={2} sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Next Steps:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="1. Deploy Learning Widget"
                secondary="Use your API key with the learning widget on any website"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Test Integration"
                secondary="Visit /test page to run comprehensive integration tests"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Use Widget File"
                secondary="Download /learning-widget.js and embed it on your target website"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  )
}
