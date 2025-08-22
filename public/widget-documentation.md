# Learning Widget Documentation

## Overview

The Learning Widget is a standalone JavaScript component that can be embedded on any website to provide AI-powered explanations for page elements. When activated, it displays interactive (i) buttons next to key elements that users can click to get contextual explanations.

## Quick Start

### 1. Include the Widget Script

\`\`\`html
<script src="https://your-server.com/learning-widget.js" 
        data-api-key="your-api-key-here"
        data-server-url="https://your-server.com"
        data-language="en"></script>
\`\`\`

### 2. Manual Initialization (Alternative)

\`\`\`html
<script src="https://your-server.com/learning-widget.js"></script>
<script>
  LearnMode.init({
    apiKey: 'your-api-key-here',
    serverUrl: 'https://your-server.com',
    language: 'en'
  });
</script>
\`\`\`

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | null | **Required.** Your project's API key |
| `serverUrl` | string | current origin | URL of your AI Assistant server |
| `language` | string | 'en' | Language for explanations ('en', 'es') |
| `theme` | string | 'light' | Widget theme ('light', 'dark') |
| `position` | string | 'right' | Toggle button position ('right', 'left') |
| `autoDetect` | boolean | true | Automatically detect interactive elements |

## Advanced Configuration

\`\`\`javascript
LearnMode.init({
  apiKey: 'your-api-key',
  serverUrl: 'https://your-server.com',
  language: 'en',
  selectors: {
    headings: 'h1, h2, h3, h4, h5, h6',
    buttons: 'button, .btn, [role="button"]',
    forms: 'form, .form',
    navigation: 'nav, .nav, .navbar',
    content: 'main, article, .content',
    interactive: 'a, button, input, select, textarea'
  },
  excludeSelectors: 'script, style, .learning-widget'
});
\`\`\`

## API Methods

### LearnMode.init(options)
Initialize the widget with configuration options.

### LearnMode.activate()
Programmatically activate learning mode.

### LearnMode.deactivate()
Programmatically deactivate learning mode.

### LearnMode.configure(options)
Update configuration after initialization.

### LearnMode.closeModal()
Close the explanation modal.

## CSS Customization

The widget uses CSS classes that can be customized:

\`\`\`css
/* Toggle button */
.learning-toggle {
  /* Your custom styles */
}

/* Learning buttons */
.learning-button {
  /* Your custom styles */
}

/* Modal */
.learning-modal {
  /* Your custom styles */
}

.learning-modal-content {
  /* Your custom styles */
}
\`\`\`

## Events

The widget automatically handles:
- Window resize (repositions buttons)
- Scroll events (repositions buttons)
- Escape key (closes modal)
- Click outside modal (closes modal)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security

- API key authentication
- Domain restrictions (configured server-side)
- Rate limiting
- CORS protection

## Troubleshooting

### Widget not appearing
- Check that API key is valid
- Verify server URL is correct
- Check browser console for errors

### No (i) buttons showing
- Ensure learning mode is activated
- Check that elements match the configured selectors
- Verify elements are not hidden or too small

### Explanations not loading
- Check API key permissions
- Verify server is accessible
- Check network connectivity

## Integration Examples

### WordPress
\`\`\`php
function add_learning_widget() {
    wp_enqueue_script('learning-widget', 'https://your-server.com/learning-widget.js');
    wp_add_inline_script('learning-widget', '
        LearnMode.init({
            apiKey: "' . get_option('learning_widget_api_key') . '",
            serverUrl: "https://your-server.com"
        });
    ');
}
add_action('wp_enqueue_scripts', 'add_learning_widget');
\`\`\`

### React
\`\`\`jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-server.com/learning-widget.js';
    script.onload = () => {
      window.LearnMode.init({
        apiKey: process.env.REACT_APP_LEARNING_API_KEY,
        serverUrl: 'https://your-server.com'
      });
    };
    document.head.appendChild(script);
  }, []);

  return <div>Your app content</div>;
}
\`\`\`

### Vue.js
\`\`\`vue
<template>
  <div>Your app content</div>
</template>

<script>
export default {
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://your-server.com/learning-widget.js';
    script.onload = () => {
      window.LearnMode.init({
        apiKey: process.env.VUE_APP_LEARNING_API_KEY,
        serverUrl: 'https://your-server.com'
      });
    };
    document.head.appendChild(script);
  }
};
</script>
