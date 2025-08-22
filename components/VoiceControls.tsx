"use client"

import { useState, useEffect } from "react"
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
} from "@mui/material"
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVolume,
  IconVolumeOff,
  IconSettings,
  IconWaveSquare,
} from "@tabler/icons-react"
import { voiceService } from "../lib/voice"

interface VoiceControlsProps {
  onVoiceCommand?: (command: any) => void
  onTranscript?: (transcript: string) => void
  language?: string
  onLanguageChange?: (language: string) => void
}

export default function VoiceControls({
  onVoiceCommand,
  onTranscript,
  language = "en",
  onLanguageChange,
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState("")
  const [speechRate, setSpeechRate] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(1)

  useEffect(() => {
    setIsSupported(voiceService.isSupported)
    if (voiceService.isSupported) {
      loadVoices()
      setupVoiceCallbacks()
      voiceService.setLanguage(language)
    }
  }, [language])

  const loadVoices = () => {
    const availableVoices = voiceService.getAvailableVoices(language)
    setVoices(availableVoices)
    if (availableVoices.length > 0 && !selectedVoice) {
      setSelectedVoice(availableVoices[0].name)
    }
  }

  const setupVoiceCallbacks = () => {
    voiceService.onStart = () => {
      setIsListening(true)
      setError("")
    }

    voiceService.onEnd = () => {
      setIsListening(false)
    }

    voiceService.onError = (error) => {
      setError(`Voice recognition error: ${error}`)
      setIsListening(false)
    }

    voiceService.onResult = (result) => {
      setTranscript(result.interim || result.final)

      if (result.final) {
        const command = voiceService.processVoiceCommand(result.final)
        if (onVoiceCommand) {
          onVoiceCommand(command)
        }
        if (onTranscript) {
          onTranscript(result.final)
        }
        setTranscript("")
      }
    }
  }

  const toggleListening = () => {
    if (isListening) {
      voiceService.stopListening()
    } else {
      const started = voiceService.startListening()
      if (!started) {
        setError("Could not start voice recognition. Please check your microphone permissions.")
      }
    }
  }

  const toggleSpeaking = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking()
      setIsSpeaking(false)
    }
  }

  const testVoice = async () => {
    try {
      setIsSpeaking(true)
      const selectedVoiceObj = voices.find((v) => v.name === selectedVoice)
      await voiceService.speak("Hello! This is a test of the voice synthesis system.", {
        voice: selectedVoiceObj,
        rate: speechRate,
        pitch: speechPitch,
      })
    } catch (error) {
      setError("Voice synthesis test failed")
    } finally {
      setIsSpeaking(false)
    }
  }

  if (!isSupported) {
    return (
      <Tooltip title="Voice features not supported in this browser">
        <IconButton disabled>
          <IconMicrophoneOff size={24} />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* Microphone Control */}
      <Tooltip title={isListening ? "Stop listening" : "Start voice recognition"}>
        <IconButton
          onClick={toggleListening}
          color={isListening ? "secondary" : "inherit"}
          sx={{
            bgcolor: isListening ? "secondary.main" : "transparent",
            "&:hover": {
              bgcolor: isListening ? "secondary.dark" : "rgba(255,255,255,0.1)",
            },
          }}
        >
          {isListening ? <IconWaveSquare size={24} /> : <IconMicrophone size={24} />}
        </IconButton>
      </Tooltip>

      {/* Speaker Control */}
      <Tooltip title={isSpeaking ? "Stop speaking" : "Voice synthesis ready"}>
        <IconButton onClick={toggleSpeaking} color={isSpeaking ? "secondary" : "inherit"} disabled={!isSpeaking}>
          {isSpeaking ? <IconVolumeOff size={24} /> : <IconVolume size={24} />}
        </IconButton>
      </Tooltip>

      {/* Voice Settings */}
      <Tooltip title="Voice settings">
        <IconButton onClick={() => setSettingsOpen(true)}>
          <IconSettings size={20} />
        </IconButton>
      </Tooltip>

      {/* Live Transcript Display */}
      {transcript && (
        <Chip
          label={transcript}
          size="small"
          sx={{
            maxWidth: 200,
            "& .MuiChip-label": {
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
      )}

      {/* Voice Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Voice Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Voice</InputLabel>
              <Select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} label="Voice">
                {voices.map((voice) => (
                  <MenuItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Speech Rate: {speechRate}</Typography>
              <Slider
                value={speechRate}
                onChange={(e, value) => setSpeechRate(value)}
                min={0.5}
                max={2}
                step={0.1}
                marks={[
                  { value: 0.5, label: "Slow" },
                  { value: 1, label: "Normal" },
                  { value: 2, label: "Fast" },
                ]}
              />
            </Box>

            <Box>
              <Typography gutterBottom>Speech Pitch: {speechPitch}</Typography>
              <Slider
                value={speechPitch}
                onChange={(e, value) => setSpeechPitch(value)}
                min={0.5}
                max={2}
                step={0.1}
                marks={[
                  { value: 0.5, label: "Low" },
                  { value: 1, label: "Normal" },
                  { value: 2, label: "High" },
                ]}
              />
            </Box>

            <Button variant="outlined" onClick={testVoice} disabled={isSpeaking}>
              {isSpeaking ? "Testing..." : "Test Voice"}
            </Button>

            <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Voice Commands:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • "Explain this" - Get AI explanation
                <br />• "Help me" - Show help information
                <br />• "Read this" - Read current content
                <br />• "Stop reading" - Stop voice synthesis
                <br />• Ask any question naturally
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
