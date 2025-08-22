"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material"
import { IconBrain, IconWorld, IconRocket, IconStar, IconMail } from "@tabler/icons-react"

export default function DemoPage() {
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const [demoApiKey, setDemoApiKey] = useState("demo_key_12345")

  useEffect(() => {
    // Simulate widget loading for demo
    const timer = setTimeout(() => {
      setWidgetLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: <IconBrain size={32} />,
      title: "AI-Powered Learning",
      description: "Get instant explanations for any website element using advanced AI technology.",
    },
    {
      icon: <IconWorld size={32} />,
      title: "Universal Integration",
      description: "Works on any website with simple script integration. No complex setup required.",
    },
    {
      icon: <IconRocket size={32} />,
      title: "Fast & Lightweight",
      description: "Optimized for performance with minimal impact on your website's loading speed.",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "UX Designer",
      content: "This widget has revolutionized how we onboard new users. The AI explanations are incredibly helpful!",
    },
    {
      name: "Mike Chen",
      role: "Developer",
      content: "Integration was seamless. Our users love the learning mode feature.",
    },
    {
      name: "Emily Rodriguez",
      role: "Product Manager",
      content: "User engagement increased by 40% after implementing the learning widget.",
    },
  ]

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #dc004e 100%)",
          color: "white",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            AI Learning Widget Demo
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: "auto" }}>
            Experience how our AI-powered learning widget transforms any website into an interactive learning experience
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: "white",
              color: "primary.main",
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              "&:hover": { bgcolor: "grey.100" },
            }}
          >
            Try Learning Mode
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Widget Status */}
        <Alert
          severity={widgetLoaded ? "success" : "info"}
          sx={{ mb: 4 }}
          icon={widgetLoaded ? <IconBrain /> : undefined}
        >
          {widgetLoaded
            ? "🎉 Learning Widget is active! Look for the toggle button in the top-right corner."
            : "Loading Learning Widget..."}
        </Alert>

        {/* Features Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
            Powerful Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Box sx={{ color: "primary.main", mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Interactive Demo Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 6, bgcolor: "grey.50" }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Interactive Demo Elements
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            These elements demonstrate different types of interactions. When Learning Mode is active, you'll see (i)
            buttons that provide AI explanations.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Navigation Elements
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Button variant="contained" color="primary">
                    Home
                  </Button>
                  <Button variant="outlined" color="primary">
                    About
                  </Button>
                  <Button variant="text" color="primary">
                    Contact
                  </Button>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Form Elements
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField label="Email Address" type="email" placeholder="Enter your email" />
                  <FormControl>
                    <InputLabel>Category</InputLabel>
                    <Select value="" label="Category">
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="support">Support</MenuItem>
                      <MenuItem value="sales">Sales</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Content Elements
                </Typography>
                <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Product Card
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    This is a sample product card that demonstrates how content elements work with the learning widget.
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip label="Popular" color="primary" size="small" />
                    <Chip label="New" color="secondary" size="small" />
                  </Box>
                </Card>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Action Elements
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Button variant="contained" startIcon={<IconRocket />}>
                    Get Started
                  </Button>
                  <Button variant="outlined" startIcon={<IconMail />}>
                    Contact Us
                  </Button>
                  <Button variant="text" startIcon={<IconStar />}>
                    Learn More
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Testimonials */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
            What Users Say
          </Typography>
          <Grid container spacing={3}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card elevation={1} sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ mb: 2, fontStyle: "italic" }}>
                      "{testimonial.content}"
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: "center",
            background: "linear-gradient(135deg, #f5f5f5 0%, #e8f5e8 100%)",
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: "auto" }}>
            Transform your website into an interactive learning experience. Process your website, get an API key, and
            start helping your users understand your content better.
          </Typography>
          <Button variant="contained" size="large" sx={{ mr: 2 }}>
            Create Your Project
          </Button>
          <Button variant="outlined" size="large">
            View Documentation
          </Button>
        </Paper>
      </Container>

      {/* Widget Script Simulation */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Simulate widget loading
            window.addEventListener('load', function() {
              console.log('[Demo] Learning Widget would be loaded here');
              console.log('[Demo] API Key: ${demoApiKey}');
              console.log('[Demo] Server URL: ${window.location.origin}');
            });
          `,
        }}
      />
    </Box>
  )
}
