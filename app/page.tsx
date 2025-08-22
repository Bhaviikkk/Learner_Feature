"use client"

import type React from "react"

import { useState } from "react"
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Tabs,
  Tab,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material"
import { IconBrain, IconUpload, IconKey, IconDatabase, IconWorld } from "@tabler/icons-react"

interface TabPanelProps {
  children?: React.ReactNode
  value: number
  index: number
  [key: string]: any
}

interface Project {
  id: string
  name: string
  url: string
  apiKey: string
  createdAt: string
}

interface AlertState {
  type: "success" | "error" | "warning" | "info"
  message: string
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ServerDashboard() {
  const [tabValue, setTabValue] = useState<number>(0)
  const [websiteUrl, setWebsiteUrl] = useState<string>("")
  const [projectName, setProjectName] = useState<string>("")
  const [processing, setProcessing] = useState<boolean>(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [alert, setAlert] = useState<AlertState | null>(null)

  const handleProcessWebsite = async (): Promise<void> => {
    if (!websiteUrl || !projectName) {
      setAlert({ type: "error", message: "Please provide both website URL and project name" })
      return
    }

    setProcessing(true)
    setAlert(null)

    try {
      // Process website and generate API key
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: websiteUrl,
          name: projectName,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setProjects([...projects, result])
        setAlert({ type: "success", message: `Project created successfully! API Key: ${result.apiKey}` })
        setWebsiteUrl("")
        setProjectName("")
      } else {
        setAlert({ type: "error", message: result.error || "Failed to process website" })
      }
    } catch (error) {
      setAlert({ type: "error", message: "Network error occurred" })
    } finally {
      setProcessing(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "primary.main",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <IconBrain size={32} style={{ marginRight: 16 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              AI Assistant Server Dashboard
            </Typography>
          </Box>
          <Chip label="Server Mode" color="secondary" />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: "linear-gradient(45deg, #1976d2, #dc004e)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 2,
            }}
          >
            Website Processing Server
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: "auto", lineHeight: 1.6 }}>
            Upload and process websites to generate API keys for AI-powered learning experiences
          </Typography>
        </Box>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Box sx={{ width: "100%", mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="server tabs">
              <Tab label="Process Website" icon={<IconUpload size={20} />} />
              <Tab label="Manage Projects" icon={<IconDatabase size={20} />} />
              <Tab label="API Keys" icon={<IconKey size={20} />} />
              <Tab label="Learning Widget" icon={<IconWorld size={20} />} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Process New Website
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website URL"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    disabled={processing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Website Project"
                    disabled={processing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleProcessWebsite}
                    disabled={processing || !websiteUrl || !projectName}
                    startIcon={<IconUpload />}
                    sx={{ mr: 2 }}
                  >
                    {processing ? "Processing..." : "Process Website"}
                  </Button>
                  {processing && <LinearProgress sx={{ mt: 2 }} />}
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  What happens when you process a website:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Scrapes all content from the website</Typography>
                  <Typography variant="body2">• Generates embeddings for semantic search</Typography>
                  <Typography variant="body2">• Stores data in vector database</Typography>
                  <Typography variant="body2">• Creates unique API key for this project</Typography>
                  <Typography variant="body2">• Provides learning widget code for deployment</Typography>
                </Stack>
              </Box>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Your Projects
            </Typography>

            {projects.length === 0 ? (
              <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No projects yet. Process your first website to get started!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {projects.map((project, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {project.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {project.url}
                        </Typography>
                        <Typography variant="caption" display="block" gutterBottom>
                          API Key: {project.apiKey}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              API Key Management
            </Typography>
            <Paper elevation={1} sx={{ p: 4 }}>
              <Typography color="text.secondary">
                API key management interface will be displayed here. Each key provides access to specific project data.
              </Typography>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Learning Widget Code
            </Typography>
            <Paper elevation={1} sx={{ p: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                After processing a website, you'll get a standalone learning widget that can be embedded anywhere.
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", bgcolor: "grey.100", p: 2, borderRadius: 1 }}>
                {`<script src="https://your-server.com/learning-widget.js"></script>
<script>
  LearnMode.init({
    apiKey: 'your-generated-api-key',
    language: 'en'
  });
</script>`}
              </Typography>
            </Paper>
          </TabPanel>
        </Box>
      </Container>
    </Box>
  )
}
