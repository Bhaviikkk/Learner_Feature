;(() => {
  // Widget configuration
  let config = {
    apiKey: null,
    serverUrl: window.location.origin,
    language: "en",
    theme: "light",
    position: "right",
    autoDetect: true,
    selectors: {
      headings: "h1, h2, h3, h4, h5, h6",
      buttons: 'button, .btn, [role="button"]',
      forms: "form, .form",
      navigation: "nav, .nav, .navbar, .navigation",
      content: "main, article, .content, .main-content",
      interactive: 'a, button, input, select, textarea, [onclick], [role="button"]',
    },
    excludeSelectors: "script, style, .learning-widget, .learning-button, .learning-modal",
  }

  // Widget state
  let isActive = false
  let learningButtons = []
  const modal = null
  const currentExplanation = null

  // Translations
  const translations = {
    en: {
      activate: "Activate Learning Mode",
      deactivate: "Deactivate Learning Mode",
      explain: "Get AI Explanation",
      loading: "Loading explanation...",
      error: "Failed to load explanation",
      close: "Close",
      poweredBy: "Powered by AI Assistant",
    },
    es: {
      activate: "Activar Modo Aprendizaje",
      deactivate: "Desactivar Modo Aprendizaje",
      explain: "Obtener Explicación IA",
      loading: "Cargando explicación...",
      error: "Error al cargar explicación",
      close: "Cerrar",
      poweredBy: "Desarrollado por AI Assistant",
    },
  }

  // Main widget class
  class LearnModeWidget {
    constructor() {
      this.init()
    }

    init() {
      this.injectStyles()
      this.createToggleButton()
      this.createModal()
      this.bindEvents()
    }

    injectStyles() {
      const styles = `
        .learning-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 999999;
        }

        .learning-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #1976d2, #dc004e);
          color: white;
          border: none;
          border-radius: 25px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
          z-index: 1000000;
        }

        .learning-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }

        .learning-toggle.active {
          background: linear-gradient(135deg, #4caf50, #2e7d32);
        }

        .learning-button {
          position: absolute;
          width: 24px;
          height: 24px;
          background: #1976d2;
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
          z-index: 999998;
          font-family: inherit;
        }

        .learning-button:hover {
          transform: scale(1.1);
          background: #dc004e;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .learning-button.loading {
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .learning-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000001;
          backdrop-filter: blur(4px);
        }

        .learning-modal.show {
          display: flex;
        }

        .learning-modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          position: relative;
          margin: 20px;
        }

        .learning-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .learning-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1976d2;
          margin: 0;
        }

        .learning-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .learning-modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .learning-modal-body {
          line-height: 1.6;
          color: #333;
        }

        .learning-modal-body h3 {
          color: #1976d2;
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .learning-modal-body p {
          margin-bottom: 12px;
        }

        .learning-modal-body ul {
          margin-bottom: 12px;
          padding-left: 20px;
        }

        .learning-modal-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
          text-align: center;
          font-size: 12px;
          color: #666;
        }

        .learning-loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .learning-error {
          text-align: center;
          padding: 40px;
          color: #d32f2f;
        }

        @media (max-width: 768px) {
          .learning-modal-content {
            margin: 10px;
            max-height: 90vh;
          }
          
          .learning-toggle {
            top: 10px;
            right: 10px;
            padding: 10px 16px;
            font-size: 12px;
          }
        }
      `

      const styleSheet = document.createElement("style")
      styleSheet.textContent = styles
      document.head.appendChild(styleSheet)
    }

    createToggleButton() {
      const button = document.createElement("button")
      button.className = "learning-toggle learning-widget"
      button.textContent = this.t("activate")
      button.onclick = () => this.toggle()
      document.body.appendChild(button)
      this.toggleButton = button
    }

    createModal() {
      const modal = document.createElement("div")
      modal.className = "learning-modal learning-widget"
      modal.innerHTML = `
        <div class="learning-modal-content">
          <div class="learning-modal-header">
            <h3 class="learning-modal-title">AI Explanation</h3>
            <button class="learning-modal-close" onclick="LearnMode.closeModal()">&times;</button>
          </div>
          <div class="learning-modal-body">
            <div class="learning-loading">${this.t("loading")}</div>
          </div>
          <div class="learning-modal-footer">
            ${this.t("poweredBy")}
          </div>
        </div>
      `
      document.body.appendChild(modal)
      this.modal = modal

      // Close modal when clicking outside
      modal.onclick = (e) => {
        if (e.target === modal) {
          this.closeModal()
        }
      }
    }

    toggle() {
      if (isActive) {
        this.deactivate()
      } else {
        this.activate()
      }
    }

    activate() {
      if (!config.apiKey) {
        alert("Learning Mode requires an API key. Please configure the widget properly.")
        return
      }

      isActive = true
      this.toggleButton.textContent = this.t("deactivate")
      this.toggleButton.classList.add("active")
      this.addLearningButtons()
    }

    deactivate() {
      isActive = false
      this.toggleButton.textContent = this.t("activate")
      this.toggleButton.classList.remove("active")
      this.removeLearningButtons()
      this.closeModal()
    }

    addLearningButtons() {
      const elements = this.findInteractiveElements()

      elements.forEach((element, index) => {
        const button = this.createLearningButton(element, index)
        learningButtons.push(button)
      })
    }

    findInteractiveElements() {
      const elements = []
      const selectors = Object.values(config.selectors).join(", ")
      const found = document.querySelectorAll(selectors)

      found.forEach((element) => {
        // Skip if element is hidden or too small
        const rect = element.getBoundingClientRect()
        if (rect.width < 20 || rect.height < 20) return

        // Skip if element is inside excluded areas
        if (element.closest(config.excludeSelectors)) return

        // Skip if element already has a learning button
        if (element.querySelector(".learning-button")) return

        elements.push(element)
      })

      return elements.slice(0, 50) // Limit to 50 elements to avoid clutter
    }

    createLearningButton(element, index) {
      const button = document.createElement("button")
      button.className = "learning-button learning-widget"
      button.textContent = "i"
      button.title = this.t("explain")

      // Position the button relative to the element
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      button.style.top = rect.top + scrollTop - 5 + "px"
      button.style.left = rect.right + scrollLeft + 5 + "px"

      button.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.explainElement(element, button)
      }

      document.body.appendChild(button)
      return button
    }

    removeLearningButtons() {
      learningButtons.forEach((button) => {
        if (button.parentNode) {
          button.parentNode.removeChild(button)
        }
      })
      learningButtons = []
    }

    async explainElement(element, button) {
      button.classList.add("loading")

      try {
        const context = this.extractElementContext(element)
        const explanation = await this.fetchExplanation(context)
        this.showExplanation(explanation, context)
      } catch (error) {
        console.error("Explanation error:", error)
        this.showError(error.message)
      } finally {
        button.classList.remove("loading")
      }
    }

    extractElementContext(element) {
      return {
        tagName: element.tagName.toLowerCase(),
        textContent: element.textContent.trim().substring(0, 200),
        className: element.className,
        id: element.id,
        type: element.type || "",
        href: element.href || "",
        role: element.getAttribute("role") || "",
        ariaLabel: element.getAttribute("aria-label") || "",
        title: element.title || "",
        placeholder: element.placeholder || "",
        innerHTML: element.innerHTML.substring(0, 500),
        position: {
          top: element.offsetTop,
          left: element.offsetLeft,
          width: element.offsetWidth,
          height: element.offsetHeight,
        },
      }
    }

    async fetchExplanation(context) {
      const response = await fetch(`${config.serverUrl}/api/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          element: context,
          url: window.location.href,
          language: config.language,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch explanation")
      }

      return await response.json()
    }

    showExplanation(explanation, context) {
      const modalBody = this.modal.querySelector(".learning-modal-body")
      modalBody.innerHTML = `
        <h3>Element: ${context.tagName.toUpperCase()}</h3>
        <div>${explanation.explanation}</div>
        ${explanation.tips ? `<h3>Tips:</h3><div>${explanation.tips}</div>` : ""}
        ${explanation.relatedElements ? `<h3>Related Elements:</h3><div>${explanation.relatedElements}</div>` : ""}
      `
      this.modal.classList.add("show")
    }

    showError(message) {
      const modalBody = this.modal.querySelector(".learning-modal-body")
      modalBody.innerHTML = `<div class="learning-error">${this.t("error")}: ${message}</div>`
      this.modal.classList.add("show")
    }

    closeModal() {
      this.modal.classList.remove("show")
    }

    bindEvents() {
      // Handle window resize to reposition buttons
      let resizeTimeout
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          if (isActive) {
            this.removeLearningButtons()
            this.addLearningButtons()
          }
        }, 250)
      })

      // Handle scroll to reposition buttons
      let scrollTimeout
      window.addEventListener("scroll", () => {
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          if (isActive) {
            this.removeLearningButtons()
            this.addLearningButtons()
          }
        }, 100)
      })

      // Handle escape key to close modal
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.modal.classList.contains("show")) {
          this.closeModal()
        }
      })
    }

    t(key) {
      return translations[config.language]?.[key] || translations.en[key] || key
    }
  }

  // Global API
  window.LearnMode = {
    init: (options = {}) => {
      config = { ...config, ...options }

      if (!config.apiKey) {
        console.warn("LearnMode: API key is required")
        return
      }

      // Initialize widget when DOM is ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          new LearnModeWidget()
        })
      } else {
        new LearnModeWidget()
      }
    },

    activate: () => {
      if (window.learnModeWidget) {
        window.learnModeWidget.activate()
      }
    },

    deactivate: () => {
      if (window.learnModeWidget) {
        window.learnModeWidget.deactivate()
      }
    },

    closeModal: () => {
      if (window.learnModeWidget) {
        window.learnModeWidget.closeModal()
      }
    },

    configure: (options) => {
      config = { ...config, ...options }
    },
  }

  // Store widget instance globally
  window.learnModeWidget = null

  // Auto-initialize if config is provided via data attributes
  const script = document.currentScript
  if (script) {
    const apiKey = script.getAttribute("data-api-key")
    const serverUrl = script.getAttribute("data-server-url")
    const language = script.getAttribute("data-language")

    if (apiKey) {
      window.LearnMode.init({
        apiKey,
        serverUrl: serverUrl || window.location.origin,
        language: language || "en",
      })
    }
  }
})()
