import { GoogleGenerativeAI } from "@google/generative-ai"

export class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    this.chatModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    this.proModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
  }

  async generateExplanation(element, context, relevantContent = [], options = {}) {
    const {
      language = "en",
      tone = "friendly",
      complexity = "intermediate",
      includeExamples = true,
      maxLength = 500,
    } = options

    try {
      const prompt = this.buildExplanationPrompt(element, context, relevantContent, {
        language,
        tone,
        complexity,
        includeExamples,
        maxLength,
      })

      const result = await this.chatModel.generateContent(prompt)
      const response = await result.response
      const explanation = response.text()

      return {
        explanation,
        element,
        context,
        language,
        generatedAt: new Date().toISOString(),
        model: "gemini-1.5-flash",
      }
    } catch (error) {
      console.error("Gemini explanation error:", error)
      throw new Error(`Failed to generate explanation: ${error.message}`)
    }
  }

  async generateDetailedAnalysis(content, query, options = {}) {
    const { language = "en", includeCodeExamples = false, analysisDepth = "comprehensive" } = options

    try {
      const prompt = this.buildAnalysisPrompt(content, query, {
        language,
        includeCodeExamples,
        analysisDepth,
      })

      const result = await this.proModel.generateContent(prompt)
      const response = await result.response
      const analysis = response.text()

      return {
        analysis,
        query,
        language,
        generatedAt: new Date().toISOString(),
        model: "gemini-1.5-pro",
      }
    } catch (error) {
      console.error("Gemini analysis error:", error)
      throw new Error(`Failed to generate analysis: ${error.message}`)
    }
  }

  async generateConversationalResponse(userMessage, conversationHistory = [], context = {}) {
    try {
      const prompt = this.buildConversationPrompt(userMessage, conversationHistory, context)

      const result = await this.chatModel.generateContent(prompt)
      const response = await result.response
      const message = response.text()

      return {
        message,
        timestamp: new Date().toISOString(),
        model: "gemini-1.5-flash",
        context,
      }
    } catch (error) {
      console.error("Gemini conversation error:", error)
      throw new Error(`Failed to generate response: ${error.message}`)
    }
  }

  buildExplanationPrompt(element, context, relevantContent, options) {
    const { language, tone, complexity, includeExamples, maxLength } = options

    const prompt = `You are an AI assistant helping users understand website elements and functionality. 

TASK: Explain the "${element}" element in a ${tone} and ${complexity} way.

CONTEXT: ${context}

LANGUAGE: Respond in ${language === "en" ? "English" : "Spanish"}

TONE: ${tone} (friendly, professional, casual, or technical)

COMPLEXITY LEVEL: ${complexity} (beginner, intermediate, or advanced)

${
  relevantContent.length > 0
    ? `RELEVANT WEBSITE CONTENT:
${relevantContent.map((content, index) => `${index + 1}. ${content.text.substring(0, 200)}...`).join("\n")}`
    : ""
}

REQUIREMENTS:
- Keep explanation under ${maxLength} characters
- Focus on practical understanding
- ${includeExamples ? "Include relevant examples when helpful" : "Avoid examples unless essential"}
- Use clear, accessible language
- Explain the purpose and functionality
- If it's a UI element, explain how users interact with it

${
  language === "es" ? "Responde en español de manera clara y útil." : "Provide a clear, helpful explanation in English."
}`

    return prompt
  }

  buildAnalysisPrompt(content, query, options) {
    const { language, includeCodeExamples, analysisDepth } = options

    const prompt = `You are an expert web analyst providing ${analysisDepth} analysis of website content.

QUERY: ${query}

CONTENT TO ANALYZE:
${content.substring(0, 4000)}

LANGUAGE: Respond in ${language === "en" ? "English" : "Spanish"}

ANALYSIS DEPTH: ${analysisDepth}

REQUIREMENTS:
- Provide detailed insights about the content
- Answer the specific query thoroughly
- ${includeCodeExamples ? "Include code examples when relevant" : "Focus on conceptual explanations"}
- Structure your response with clear sections
- Highlight key findings and recommendations
- Consider user experience and technical aspects

${language === "es" ? "Proporciona un análisis detallado en español." : "Provide a comprehensive analysis in English."}`

    return prompt
  }

  buildConversationPrompt(userMessage, conversationHistory, context) {
    const prompt = `You are a helpful AI assistant integrated into a website to help users understand and navigate the content.

CURRENT USER MESSAGE: ${userMessage}

${
  conversationHistory.length > 0
    ? `CONVERSATION HISTORY:
${conversationHistory
  .slice(-5)
  .map((msg, index) => `${msg.role}: ${msg.content}`)
  .join("\n")}`
    : ""
}

${
  context.currentPage
    ? `CURRENT PAGE CONTEXT:
Page: ${context.currentPage}
Section: ${context.currentSection || "Unknown"}
User's Focus: ${context.userFocus || "General navigation"}`
    : ""
}

INSTRUCTIONS:
- Be helpful, friendly, and concise
- Focus on the user's immediate needs
- Provide actionable guidance when possible
- If the user asks about specific website features, explain them clearly
- Maintain context from the conversation history
- Ask clarifying questions if the user's intent is unclear

Respond naturally and helpfully to assist the user.`

    return prompt
  }

  async generateStreamingResponse(prompt, onChunk) {
    try {
      const result = await this.chatModel.generateContentStream(prompt)

      let fullResponse = ""
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullResponse += chunkText
        if (onChunk) {
          onChunk(chunkText)
        }
      }

      return fullResponse
    } catch (error) {
      console.error("Gemini streaming error:", error)
      throw new Error(`Failed to generate streaming response: ${error.message}`)
    }
  }

  // Utility method to validate content safety
  async checkContentSafety(text) {
    try {
      const prompt = `Analyze this text for safety and appropriateness: "${text.substring(0, 1000)}"`
      const result = await this.chatModel.generateContent(prompt)
      const response = await result.response

      return {
        safe: true, // Gemini has built-in safety filters
        analysis: response.text(),
      }
    } catch (error) {
      return {
        safe: false,
        error: error.message,
      }
    }
  }

  async generateElementExplanation(elementContext, options = {}) {
    const { relevantContent = [], language = "en", websiteUrl = "", projectName = "" } = options

    try {
      const prompt = this.buildElementExplanationPrompt(elementContext, {
        relevantContent,
        language,
        websiteUrl,
        projectName,
      })

      const result = await this.chatModel.generateContent(prompt)
      const response = await result.response
      const explanation = response.text()

      // Parse the structured response
      const sections = this.parseStructuredResponse(explanation)

      return {
        explanation: sections.explanation || explanation,
        tips: sections.tips || "",
        relatedElements: sections.related || "",
        elementType: elementContext.tagName,
        generatedAt: new Date().toISOString(),
        model: "gemini-1.5-flash",
      }
    } catch (error) {
      console.error("Gemini element explanation error:", error)
      throw new Error(`Failed to generate element explanation: ${error.message}`)
    }
  }

  buildElementExplanationPrompt(elementContext, options) {
    const { relevantContent, language, websiteUrl, projectName } = options

    const elementInfo = `
Element Type: ${elementContext.tagName}
Text Content: ${elementContext.textContent}
CSS Classes: ${elementContext.className}
Element ID: ${elementContext.id}
Type Attribute: ${elementContext.type}
Role: ${elementContext.role}
ARIA Label: ${elementContext.ariaLabel}
Title: ${elementContext.title}
Placeholder: ${elementContext.placeholder}
Link URL: ${elementContext.href}
    `.trim()

    const prompt = `You are an AI assistant helping users understand website elements. You're analyzing a website element from ${projectName || "a website"} ${websiteUrl ? `(${websiteUrl})` : ""}.

ELEMENT DETAILS:
${elementInfo}

${
  relevantContent.length > 0
    ? `RELEVANT WEBSITE CONTENT:
${relevantContent.map((content, index) => `${index + 1}. [${content.type}] ${content.text.substring(0, 150)}...`).join("\n")}`
    : ""
}

LANGUAGE: Respond in ${language === "en" ? "English" : "Spanish"}

TASK: Provide a helpful explanation of this website element. Structure your response as follows:

EXPLANATION:
[Main explanation of what this element is and does]

TIPS:
[Practical tips for using this element effectively]

RELATED:
[Information about related elements or functionality]

REQUIREMENTS:
- Be clear and concise
- Focus on practical user understanding
- Explain the element's purpose and how to interact with it
- Use context from the website content when available
- Keep each section under 200 characters
- Use simple, accessible language

${language === "es" ? "Responde en español de manera clara y útil." : "Provide a clear, helpful explanation in English."}`

    return prompt
  }

  parseStructuredResponse(response) {
    const sections = {}

    const explanationMatch = response.match(/EXPLANATION:\s*(.*?)(?=TIPS:|RELATED:|$)/s)
    const tipsMatch = response.match(/TIPS:\s*(.*?)(?=RELATED:|$)/s)
    const relatedMatch = response.match(/RELATED:\s*(.*?)$/s)

    if (explanationMatch) {
      sections.explanation = explanationMatch[1].trim()
    }
    if (tipsMatch) {
      sections.tips = tipsMatch[1].trim()
    }
    if (relatedMatch) {
      sections.related = relatedMatch[1].trim()
    }

    return sections
  }
}

// Singleton instance
export const geminiService = new GeminiService()
