"use client"

import { useState, useRef, useEffect } from "react"
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Paper,
  IconButton,
  Avatar,
  Chip,
  Alert,
} from "@mui/material"
import { IconSend, IconUser, IconRobot, IconTrash, IconVolume } from "@tabler/icons-react"
import { voiceService } from "../lib/voice"
import VoiceControls from "./VoiceControls"

export default function ChatInterface({ apiKey = "demo-key-123", language = "en" }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant. I can help you understand this website and answer any questions you have. You can type or use voice commands!",
      timestamp: new Date().toISOString(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [voiceError, setVoiceError] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Update voice service language when language changes
    voiceService.setLanguage(language)
  }, [language])

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim()
    if (!textToSend || loading) return

    const userMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10),
          context: {
            currentPage: window.location.pathname,
            currentSection: "chat",
            userFocus: "general assistance",
            language,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response")
      }

      const assistantMessage = {
        role: "assistant",
        content: data.data.message,
        timestamp: data.data.timestamp,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Auto-speak the response if voice is enabled
      if (voiceService.isSupported) {
        try {
          await voiceService.speak(assistantMessage.content, {
            language: voiceService.currentLanguage,
          })
        } catch (voiceError) {
          console.warn("Voice synthesis failed:", voiceError)
        }
      }
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
        error: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceCommand = (command) => {
    setVoiceError("")

    switch (command.action) {
      case "question":
        handleSendMessage(command.text)
        break
      case "help":
        handleSendMessage("Can you help me understand this website?")
        break
      case "explain":
        handleSendMessage("Please explain what I'm looking at on this page.")
        break
      case "clear":
        clearChat()
        break
      default:
        setVoiceError(`Voice command "${command.action}" not recognized`)
    }
  }

  const handleVoiceTranscript = (transcript) => {
    setInputMessage(transcript)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your AI assistant. I can help you understand this website and answer any questions you have. You can type or use voice commands!",
        timestamp: new Date().toISOString(),
      },
    ])
  }

  const speakMessage = async (message) => {
    try {
      await voiceService.speak(message.content, {
        language: voiceService.currentLanguage,
      })
    } catch (error) {
      setVoiceError("Failed to speak message")
    }
  }

  return (
    <Card elevation={2} sx={{ height: 600, display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
          <IconRobot size={24} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AI Chat Assistant
          </Typography>
          <VoiceControls onVoiceCommand={handleVoiceCommand} onTranscript={handleVoiceTranscript} language={language} />
          <IconButton onClick={clearChat} size="small">
            <IconTrash size={20} />
          </IconButton>
        </Box>

        {/* Voice Error Alert */}
        {voiceError && (
          <Alert severity="warning" sx={{ m: 2, mb: 0 }} onClose={() => setVoiceError("")}>
            {voiceError}
          </Alert>
        )}

        {/* Messages */}
        <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
          <Stack spacing={2}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                {message.role === "assistant" && (
                  <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                    <IconRobot size={18} />
                  </Avatar>
                )}

                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: "70%",
                    bgcolor: message.role === "user" ? "primary.main" : "grey.100",
                    color: message.role === "user" ? "white" : "text.primary",
                    borderRadius: 2,
                    position: "relative",
                    ...(message.error && { bgcolor: "error.light", color: "error.contrastText" }),
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {message.content}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        fontSize: "0.7rem",
                      }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                    {message.role === "assistant" && voiceService.isSupported && (
                      <IconButton
                        size="small"
                        onClick={() => speakMessage(message)}
                        sx={{ ml: 1, opacity: 0.7, "&:hover": { opacity: 1 } }}
                      >
                        <IconVolume size={14} />
                      </IconButton>
                    )}
                  </Box>
                </Paper>

                {message.role === "user" && (
                  <Avatar sx={{ bgcolor: "secondary.main", width: 32, height: 32 }}>
                    <IconUser size={18} />
                  </Avatar>
                )}
              </Box>
            ))}

            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                  <IconRobot size={18} />
                </Avatar>
                <Paper elevation={1} sx={{ p: 2, bgcolor: "grey.100" }}>
                  <Typography variant="body2">Thinking...</Typography>
                </Paper>
              </Box>
            )}
          </Stack>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask me anything or use voice commands..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              size="small"
            />
            <Button
              variant="contained"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              sx={{ minWidth: 48, height: 40 }}
            >
              <IconSend size={20} />
            </Button>
          </Stack>
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="Powered by Gemini" size="small" />
            <Chip label={`${messages.length} messages`} size="small" variant="outlined" />
            {voiceService.isSupported && <Chip label="Voice enabled" size="small" color="success" />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
