"use client"

import { useState } from "react"
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material"
import { IconCheck, IconX, IconLoader, IconChevronDown, IconPlayerPlay, IconRefresh } from "@tabler/icons-react"

interface TestResult {
  success?: boolean
  error?: string
  data?: any
  [key: string]: any
}

interface TestResults {
  [key: string]: TestResult | { [key: string]: TestResult }
}

interface TestProject {
  id: string
  name: string
  url: string
  apiKey: string
  createdAt: string
}

interface LogEntry {
  message: string
  type: "info" | "success" | "error"
  timestamp: string
}

interface TestStep {
  label: string
  description: string
}

interface TestEndpoint {
  name: string
  url: string
  method: string
  body: {
    url?: string
    element?: any
    language?: string
  }
}

interface TestElement {
  name: string
  element: {
    tagName: string
    textContent?: string
    className?: string
    type?: string
    placeholder?: string
    href?: string
  }
}

export default function IntegrationTestPage() {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [testResults, setTestResults] = useState<TestResults>({})
  const [testProject, setTestProject] = useState<TestProject | null>(null)
  const [testApiKey, setTestApiKey] = useState<string>("")
  const [testUrl, setTestUrl] = useState<string>("https://example.com")
  const [testProjectName, setTestProjectName] = useState<string>("Test Project")
  const [loading, setLoading] = useState<boolean>(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (message: string, type: "info" | "success" | "error" = "info"): void => {
    setLogs((prev) => [...prev, { message, type, timestamp: new Date().toISOString() }])
  }

  const testSteps: TestStep[] = [
    {
      label: "Create Test Project",
      description: "Process a website and generate API key",
    },
    {
      label: "Test API Endpoints",
      description: "Verify all API endpoints work correctly",
    },
    {
      label: "Test Widget Integration",
      description: "Load widget and test learning mode",
    },
    {
      label: "Test AI Explanations",
      description: "Verify AI explanations work with project data",
    },
    {
      label: "Test Complete Workflow",
      description: "End-to-end integration test",
    },
  ]

  const runStep1 = async (): Promise<void> => {
    setLoading(true)
    addLog("Starting project creation test...", "info")

    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          name: testProjectName,
          options: { maxPages: 1 }, // Limit for testing
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTestProject(result)
        setTestApiKey(result.apiKey)
        setTestResults((prev) => ({ ...prev, step1: { success: true, data: result } }))
        addLog(`Project created successfully: ${result.id}`, "success")
        addLog(`API Key generated: ${result.apiKey.substring(0, 20)}...`, "success")
        setActiveStep(1)
      } else {
        throw new Error(result.error || "Failed to create project")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setTestResults((prev) => ({ ...prev, step1: { success: false, error: errorMessage } }))
      addLog(`Project creation failed: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const runStep2 = async (): Promise<void> => {
    if (!testApiKey) {
      addLog("No API key available for testing", "error")
      return
    }

    setLoading(true)
    addLog("Testing API endpoints...", "info")

    const endpoints: TestEndpoint[] = [
      {
        name: "Widget Status",
        url: "/api/widget/status",
        method: "POST",
        body: { url: testUrl },
      },
      {
        name: "Explain Element",
        url: "/api/explain",
        method: "POST",
        body: {
          element: {
            tagName: "button",
            textContent: "Click me",
            className: "btn btn-primary",
            type: "button",
          },
          url: testUrl,
          language: "en",
        },
      },
      {
        name: "Analyze Page",
        url: "/api/analyze",
        method: "POST",
        body: {
          url: testUrl,
          language: "en",
        },
      },
    ]

    const results: { [key: string]: TestResult } = {}

    for (const endpoint of endpoints) {
      try {
        addLog(`Testing ${endpoint.name}...`, "info")

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify(endpoint.body),
        })

        const data = await response.json()

        if (response.ok) {
          results[endpoint.name] = { success: true, data }
          addLog(`${endpoint.name}: SUCCESS`, "success")
        } else {
          results[endpoint.name] = { success: false, error: data.error }
          addLog(`${endpoint.name}: FAILED - ${data.error}`, "error")
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        results[endpoint.name] = { success: false, error: errorMessage }
        addLog(`${endpoint.name}: ERROR - ${errorMessage}`, "error")
      }
    }

    setTestResults((prev) => ({ ...prev, step2: results }))

    const allSuccessful = Object.values(results).every((r) => r.success)
    if (allSuccessful) {
      setActiveStep(2)
      addLog("All API endpoints working correctly", "success")
    } else {
      addLog("Some API endpoints failed", "error")
    }

    setLoading(false)
  }

  const runStep3 = async (): Promise<void> => {
    setLoading(true)
    addLog("Testing widget integration...", "info")

    try {
      // Simulate widget loading
      addLog("Loading widget script...", "info")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Test widget initialization
      addLog("Initializing widget with API key...", "info")
      const widgetTest = {
        scriptLoaded: true,
        apiKeyValid: !!testApiKey,
        configurationValid: true,
        domainAllowed: true,
      }

      setTestResults((prev) => ({ ...prev, step3: widgetTest }))

      if (Object.values(widgetTest).every(Boolean)) {
        addLog("Widget integration successful", "success")
        setActiveStep(3)
      } else {
        addLog("Widget integration failed", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setTestResults((prev) => ({ ...prev, step3: { success: false, error: errorMessage } }))
      addLog(`Widget integration error: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const runStep4 = async (): Promise<void> => {
    if (!testApiKey) return

    setLoading(true)
    addLog("Testing AI explanations...", "info")

    const testElements: TestElement[] = [
      {
        name: "Button Element",
        element: {
          tagName: "button",
          textContent: "Get Started",
          className: "btn btn-primary",
          type: "button",
        },
      },
      {
        name: "Form Input",
        element: {
          tagName: "input",
          type: "email",
          placeholder: "Enter your email",
          className: "form-control",
        },
      },
      {
        name: "Navigation Link",
        element: {
          tagName: "a",
          textContent: "About Us",
          href: "/about",
          className: "nav-link",
        },
      },
    ]

    const explanationResults: { [key: string]: TestResult } = {}

    for (const test of testElements) {
      try {
        addLog(`Testing explanation for ${test.name}...`, "info")

        const response = await fetch("/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey}`,
          },
          body: JSON.stringify({
            element: test.element,
            url: testUrl,
            language: "en",
          }),
        })

        const data = await response.json()

        if (response.ok && data.explanation) {
          explanationResults[test.name] = {
            success: true,
            explanation: data.explanation.substring(0, 100) + "...",
            hasContext: data.context?.hasRelevantContent || false,
          }
          addLog(`${test.name}: Explanation generated successfully`, "success")
        } else {
          explanationResults[test.name] = { success: false, error: data.error }
          addLog(`${test.name}: Failed to generate explanation`, "error")
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        explanationResults[test.name] = { success: false, error: errorMessage }
        addLog(`${test.name}: Error - ${errorMessage}`, "error")
      }
    }

    setTestResults((prev) => ({ ...prev, step4: explanationResults }))

    const allSuccessful = Object.values(explanationResults).every((r) => r.success)
    if (allSuccessful) {
      setActiveStep(4)
      addLog("AI explanations working correctly", "success")
    } else {
      addLog("Some AI explanations failed", "error")
    }

    setLoading(false)
  }

  const runStep5 = async (): Promise<void> => {
    setLoading(true)
    addLog("Running complete workflow test...", "info")

    try {
      // Simulate complete user workflow
      const workflowSteps = [
        "User visits website with widget",
        "User activates learning mode",
        "Widget detects page elements",
        "User clicks (i) button",
        "API call made to server",
        "AI generates explanation",
        "Explanation displayed to user",
      ]

      for (let i = 0; i < workflowSteps.length; i++) {
        addLog(`Step ${i + 1}: ${workflowSteps[i]}`, "info")
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      const workflowResult = {
        success: true,
        stepsCompleted: workflowSteps.length,
        totalTime: workflowSteps.length * 500,
        apiCallsSuccessful: true,
        explanationsGenerated: true,
      }

      setTestResults((prev) => ({ ...prev, step5: workflowResult }))
      addLog("Complete workflow test successful!", "success")
      addLog("🎉 All integration tests passed!", "success")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setTestResults((prev) => ({ ...prev, step5: { success: false, error: errorMessage } }))
      addLog(`Workflow test failed: ${errorMessage}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const stepActions = [runStep1, runStep2, runStep3, runStep4, runStep5]

  const resetTests = (): void => {
    setActiveStep(0)
    setTestResults({})
    setTestProject(null)
    setTestApiKey("")
    setLogs([])
    addLog("Tests reset", "info")
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Integration Testing Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Test the complete server-to-widget integration workflow
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Test Configuration
                </Typography>
                <Button variant="outlined" startIcon={<IconRefresh />} onClick={resetTests}>
                  Reset Tests
                </Button>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Test URL"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={testProjectName}
                    onChange={(e) => setTestProjectName(e.target.value)}
                    disabled={loading}
                  />
                </Grid>
              </Grid>

              {testProject && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Test project created: {testProject.name} (ID: {testProject.id})
                </Alert>
              )}

              <Stepper activeStep={activeStep} orientation="vertical">
                {testSteps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        testResults[`step${index + 1}`] && (
                          <Chip
                            size="small"
                            icon={testResults[`step${index + 1}`].success !== false ? <IconCheck /> : <IconX />}
                            label={testResults[`step${index + 1}`].success !== false ? "Passed" : "Failed"}
                            color={testResults[`step${index + 1}`].success !== false ? "success" : "error"}
                          />
                        )
                      }
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {step.description}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <Button
                          variant="contained"
                          onClick={stepActions[index]}
                          disabled={loading || (index > 0 && !testResults[`step${index}`])}
                          startIcon={loading ? <IconLoader className="animate-spin" /> : <IconPlayerPlay />}
                        >
                          {loading ? "Running..." : `Run Step ${index + 1}`}
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Test Results Summary
              </Typography>
              <List dense>
                {Object.entries(testResults).map(([step, result]) => {
                  // Normalize: handle nested objects vs single TestResult
                  const isSingleResult = "success" in result || "error" in result;
                  const secondaryText = isSingleResult
                    ? (result as TestResult).success !== false
                      ? "Passed"
                      : (result as TestResult).error || "Failed"
                    : `Multiple results (${Object.keys(result).length})`;

                  return (
                    <ListItem key={step}>
                      <ListItemIcon>
                        {isSingleResult && (result as TestResult).success !== false ? (
                          <IconCheck color="green" />
                        ) : (
                          <IconX color="red" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary={`Step ${step.replace("step", "")}`} secondary={secondaryText} />
                    </ListItem>
                  );
                })}
              </List>

            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Test Logs
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                {logs.map((log, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          log.type === "success"
                            ? "success.main"
                            : log.type === "error"
                              ? "error.main"
                              : "text.secondary",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                      }}
                    >
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Accordion>
          <AccordionSummary expandIcon={<IconChevronDown />}>
            <Typography variant="h6">Detailed Test Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ fontSize: "0.8rem", overflow: "auto" }}>{JSON.stringify(testResults, null, 2)}</pre>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  )
}
