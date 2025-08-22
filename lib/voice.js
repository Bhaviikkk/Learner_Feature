export class VoiceService {
  constructor() {
    this.recognition = null
    this.synthesis = window.speechSynthesis
    this.isListening = false
    this.isSupported = this.checkSupport()
    this.currentLanguage = "en-US"
    this.voices = []
    this.onResult = null
    this.onError = null
    this.onStart = null
    this.onEnd = null

    if (this.isSupported) {
      this.initializeRecognition()
      this.loadVoices()
    }
  }

  checkSupport() {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window || "speechSynthesis" in window
  }

  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.lang = this.currentLanguage

      this.recognition.onstart = () => {
        this.isListening = true
        if (this.onStart) this.onStart()
      }

      this.recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (this.onResult) {
          this.onResult({
            final: finalTranscript,
            interim: interimTranscript,
            confidence: event.results[0]?.confidence || 0,
          })
        }
      }

      this.recognition.onerror = (event) => {
        this.isListening = false
        if (this.onError) this.onError(event.error)
      }

      this.recognition.onend = () => {
        this.isListening = false
        if (this.onEnd) this.onEnd()
      }
    }
  }

  loadVoices() {
    const updateVoices = () => {
      this.voices = this.synthesis.getVoices()
    }

    updateVoices()
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = updateVoices
    }
  }

  setLanguage(language) {
    const languageMap = {
      en: "en-US",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-BR",
      ja: "ja-JP",
      ko: "ko-KR",
      zh: "zh-CN",
    }

    this.currentLanguage = languageMap[language] || language
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage
    }
  }

  startListening() {
    if (!this.isSupported || !this.recognition || this.isListening) {
      return false
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error("Speech recognition error:", error)
      return false
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  speak(text, options = {}) {
    if (!this.isSupported || !text) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set voice options
      const { rate = 1, pitch = 1, volume = 1, voice = null, language = this.currentLanguage } = options

      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      utterance.lang = language

      // Find appropriate voice
      if (voice) {
        utterance.voice = voice
      } else {
        const availableVoice = this.findVoiceByLanguage(language)
        if (availableVoice) {
          utterance.voice = availableVoice
        }
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(event.error)

      this.synthesis.speak(utterance)
    })
  }

  findVoiceByLanguage(language) {
    return this.voices.find((voice) => voice.lang.startsWith(language.split("-")[0]))
  }

  getAvailableVoices(language = null) {
    if (!language) return this.voices

    const langCode = language.split("-")[0]
    return this.voices.filter((voice) => voice.lang.startsWith(langCode))
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  // Voice commands processing
  processVoiceCommand(transcript) {
    const command = transcript.toLowerCase().trim()

    // Define voice commands
    const commands = {
      "explain this": () => ({ action: "explain", target: "current" }),
      "what is this": () => ({ action: "explain", target: "current" }),
      "help me": () => ({ action: "help" }),
      "scroll up": () => ({ action: "scroll", direction: "up" }),
      "scroll down": () => ({ action: "scroll", direction: "down" }),
      "go back": () => ({ action: "navigate", direction: "back" }),
      "read this": () => ({ action: "read", target: "current" }),
      "stop reading": () => ({ action: "stop_reading" }),
      "change language": () => ({ action: "change_language" }),
    }

    // Check for exact matches
    if (commands[command]) {
      return commands[command]()
    }

    // Check for partial matches
    for (const [key, action] of Object.entries(commands)) {
      if (command.includes(key)) {
        return action()
      }
    }

    // If no command matched, treat as a question
    return { action: "question", text: transcript }
  }

  // Utility methods
  isListeningActive() {
    return this.isListening
  }

  isSpeakingActive() {
    return this.synthesis && this.synthesis.speaking
  }

  getLanguageDisplayName(langCode) {
    const languages = {
      "en-US": "English (US)",
      "es-ES": "Español",
      "fr-FR": "Français",
      "de-DE": "Deutsch",
      "it-IT": "Italiano",
      "pt-BR": "Português",
      "ja-JP": "日本語",
      "ko-KR": "한국어",
      "zh-CN": "中文",
    }

    return languages[langCode] || langCode
  }
}

// Singleton instance
export const voiceService = new VoiceService()
