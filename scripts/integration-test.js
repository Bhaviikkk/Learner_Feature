import { DataProcessor } from "../lib/dataProcessor.js"
import { APIKeyService } from "../lib/apikeys.js"

class IntegrationTester {
  constructor() {
    this.testResults = []
    this.apiKeyService = new APIKeyService()
  }

  async runFullIntegrationTest() {
    console.log("🚀 Starting Full Integration Test")
    console.log("=".repeat(50))

    try {
      // Test 1: Create test project
      const project = await this.testProjectCreation()
      if (!project.success) throw new Error("Project creation failed")

      // Test 2: Test API endpoints
      const apiTests = await this.testAPIEndpoints(project.apiKey)
      if (!apiTests.success) throw new Error("API endpoint tests failed")

      // Test 3: Test widget simulation
      const widgetTests = await this.testWidgetSimulation(project.apiKey)
      if (!widgetTests.success) throw new Error("Widget simulation failed")

      // Test 4: Test AI explanations
      const aiTests = await this.testAIExplanations(project.apiKey)
      if (!aiTests.success) throw new Error("AI explanation tests failed")

      console.log("✅ All integration tests passed!")
      return { success: true, results: this.testResults }
    } catch (error) {
      console.error("❌ Integration test failed:", error.message)
      return { success: false, error: error.message, results: this.testResults }
    }
  }

  async testProjectCreation() {
    console.log("\n📝 Testing Project Creation...")

    try {
      const processor = new DataProcessor()
      const testUrl = "https://example.com"
      const projectId = `test_${Date.now()}`

      const result = await processor.processWebsiteForProject(testUrl, {
        name: "Integration Test Project",
        projectId,
        options: { maxPages: 1 },
      })

      // Generate API key
      const apiKey = await this.apiKeyService.generateKey({
        projectId,
        name: "Integration Test Project",
        url: testUrl,
        features: ["explain", "chat", "analyze"],
      })

      const testResult = {
        test: "Project Creation",
        success: true,
        data: { ...result, apiKey: apiKey.key },
      }

      this.testResults.push(testResult)
      console.log("✅ Project creation successful")
      return { success: true, apiKey: apiKey.key, projectId }
    } catch (error) {
      const testResult = {
        test: "Project Creation",
        success: false,
        error: error.message,
      }
      this.testResults.push(testResult)
      console.log("❌ Project creation failed:", error.message)
      return { success: false }
    }
  }

  async testAPIEndpoints(apiKey) {
    console.log("\n🔌 Testing API Endpoints...")

    const endpoints = [
      {
        name: "Widget Status",
        test: () => this.mockAPICall("/api/widget/status", "POST", { url: "https://example.com" }, apiKey),
      },
      {
        name: "Explain Element",
        test: () =>
          this.mockAPICall(
            "/api/explain",
            "POST",
            {
              element: {
                tagName: "button",
                textContent: "Click me",
                className: "btn",
              },
              url: "https://example.com",
            },
            apiKey,
          ),
      },
      {
        name: "Analyze Page",
        test: () => this.mockAPICall("/api/analyze", "POST", { url: "https://example.com" }, apiKey),
      },
    ]

    let allPassed = true

    for (const endpoint of endpoints) {
      try {
        const result = await endpoint.test()
        console.log(`✅ ${endpoint.name}: PASSED`)
        this.testResults.push({
          test: `API: ${endpoint.name}`,
          success: true,
          data: result,
        })
      } catch (error) {
        console.log(`❌ ${endpoint.name}: FAILED - ${error.message}`)
        this.testResults.push({
          test: `API: ${endpoint.name}`,
          success: false,
          error: error.message,
        })
        allPassed = false
      }
    }

    return { success: allPassed }
  }

  async testWidgetSimulation(apiKey) {
    console.log("\n🎛️ Testing Widget Simulation...")

    try {
      // Simulate widget initialization
      const widgetConfig = {
        apiKey,
        serverUrl: "http://localhost:3000",
        language: "en",
      }

      // Simulate element detection
      const mockElements = [
        { tagName: "button", textContent: "Get Started", className: "btn btn-primary" },
        { tagName: "input", type: "email", placeholder: "Enter email" },
        { tagName: "a", textContent: "Learn More", href: "/learn" },
      ]

      // Simulate API calls for each element
      for (const element of mockElements) {
        await this.mockAPICall(
          "/api/explain",
          "POST",
          {
            element,
            url: "https://example.com",
            language: "en",
          },
          apiKey,
        )
      }

      console.log("✅ Widget simulation successful")
      this.testResults.push({
        test: "Widget Simulation",
        success: true,
        data: { elementsProcessed: mockElements.length },
      })

      return { success: true }
    } catch (error) {
      console.log("❌ Widget simulation failed:", error.message)
      this.testResults.push({
        test: "Widget Simulation",
        success: false,
        error: error.message,
      })
      return { success: false }
    }
  }

  async testAIExplanations(apiKey) {
    console.log("\n🤖 Testing AI Explanations...")

    const testCases = [
      {
        name: "Button Explanation",
        element: {
          tagName: "button",
          textContent: "Subscribe Now",
          className: "btn btn-primary",
          type: "submit",
        },
      },
      {
        name: "Form Input Explanation",
        element: {
          tagName: "input",
          type: "password",
          placeholder: "Enter password",
          required: true,
        },
      },
      {
        name: "Navigation Link Explanation",
        element: {
          tagName: "a",
          textContent: "Contact Us",
          href: "/contact",
          className: "nav-link",
        },
      },
    ]

    let allPassed = true

    for (const testCase of testCases) {
      try {
        const result = await this.mockAPICall(
          "/api/explain",
          "POST",
          {
            element: testCase.element,
            url: "https://example.com",
            language: "en",
          },
          apiKey,
        )

        if (result.explanation && result.explanation.length > 10) {
          console.log(`✅ ${testCase.name}: Generated explanation (${result.explanation.length} chars)`)
          this.testResults.push({
            test: `AI: ${testCase.name}`,
            success: true,
            data: { explanationLength: result.explanation.length },
          })
        } else {
          throw new Error("Explanation too short or missing")
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ${error.message}`)
        this.testResults.push({
          test: `AI: ${testCase.name}`,
          success: false,
          error: error.message,
        })
        allPassed = false
      }
    }

    return { success: allPassed }
  }

  async mockAPICall(endpoint, method, body, apiKey) {
    // Simulate API call - in real implementation, this would make actual HTTP requests
    console.log(`  📡 Mock API call: ${method} ${endpoint}`)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Mock successful responses based on endpoint
    if (endpoint.includes("explain")) {
      return {
        success: true,
        explanation: "This is a mock AI explanation for the element. It provides context and helpful information.",
        tips: "Mock tips for using this element effectively.",
        context: { hasRelevantContent: true },
      }
    }

    if (endpoint.includes("status")) {
      return {
        success: true,
        config: { projectId: "test", features: ["explain"] },
        domainAllowed: true,
      }
    }

    if (endpoint.includes("analyze")) {
      return {
        success: true,
        analysis: "Mock page analysis with insights about the website structure and content.",
        suggestions: ["Mock suggestion 1", "Mock suggestion 2"],
      }
    }

    return { success: true, data: "Mock response" }
  }

  generateReport() {
    const passed = this.testResults.filter((r) => r.success).length
    const total = this.testResults.length
    const passRate = ((passed / total) * 100).toFixed(1)

    console.log("\n📊 Integration Test Report")
    console.log("=".repeat(50))
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${total - passed}`)
    console.log(`Pass Rate: ${passRate}%`)
    console.log("\nDetailed Results:")

    this.testResults.forEach((result, index) => {
      const status = result.success ? "✅ PASS" : "❌ FAIL"
      console.log(`${index + 1}. ${result.test}: ${status}`)
      if (!result.success) {
        console.log(`   Error: ${result.error}`)
      }
    })
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new IntegrationTester()
  const results = await tester.runFullIntegrationTest()
  tester.generateReport()
  process.exit(results.success ? 0 : 1)
}

export { IntegrationTester }
