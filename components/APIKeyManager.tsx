"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from "@mui/material"
import { IconKey, IconPlus, IconCopy, IconTrash, IconChevronDown, IconEye, IconEyeOff } from "@tabler/icons-react"

export default function APIKeyManager() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState(null)
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    description: "",
    features: ["scraping", "embeddings", "ai_explanations"],
    rateLimit: 1000,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showFullKeys, setShowFullKeys] = useState({})

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/keys?userId=demo-user")
      const data = await response.json()

      if (data.success) {
        setKeys(data.data)
      } else {
        setError("Failed to load API keys")
      }
    } catch (err) {
      setError("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newKeyData,
          userId: "demo-user",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("API key created successfully!")
        setCreateDialogOpen(false)
        setNewKeyData({
          name: "",
          description: "",
          features: ["scraping", "embeddings", "ai_explanations"],
          rateLimit: 1000,
        })
        fetchKeys()

        // Show the full key temporarily
        setShowFullKeys({ [data.data.key]: true })
        setTimeout(() => {
          setShowFullKeys({})
        }, 30000) // Hide after 30 seconds
      } else {
        setError(data.error || "Failed to create API key")
      }
    } catch (err) {
      setError("Failed to create API key")
    }
  }

  const handleDeleteKey = async (keyId) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/keys/${keyId}?userId=demo-user`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("API key deleted successfully!")
        fetchKeys()
      } else {
        setError(data.error || "Failed to delete API key")
      }
    } catch (err) {
      setError("Failed to delete API key")
    }
  }

  const handleToggleActive = async (key) => {
    try {
      const response = await fetch(`/api/keys/${key.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "demo-user",
          isActive: !key.isActive,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`API key ${key.isActive ? "disabled" : "enabled"} successfully!`)
        fetchKeys()
      } else {
        setError(data.error || "Failed to update API key")
      }
    } catch (err) {
      setError("Failed to update API key")
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess("API key copied to clipboard!")
  }

  const toggleKeyVisibility = (keyId) => {
    setShowFullKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }))
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconKey size={28} />
          API Key Management
        </Typography>
        <Button variant="contained" startIcon={<IconPlus />} onClick={() => setCreateDialogOpen(true)}>
          Create New Key
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {loading ? (
        <LinearProgress />
      ) : (
        <Stack spacing={2}>
          {keys.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <IconKey size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No API Keys Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first API key to start using the AI Interactive Assistant
                </Typography>
                <Button variant="contained" startIcon={<IconPlus />} onClick={() => setCreateDialogOpen(true)}>
                  Create API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            keys.map((key) => (
              <Card key={key.id} elevation={2}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {key.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {key.description || "No description"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          label={key.isActive ? "Active" : "Disabled"}
                          color={key.isActive ? "success" : "default"}
                          size="small"
                        />
                        <Chip label={`${key.usage.totalRequests} requests`} size="small" />
                        <Chip label={`${key.usage.requestsThisHour}/${key.rateLimit} this hour`} size="small" />
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <FormControlLabel
                        control={<Switch checked={key.isActive} onChange={() => handleToggleActive(key)} />}
                        label=""
                      />
                      <IconButton onClick={() => handleDeleteKey(key.key)} color="error">
                        <IconTrash size={20} />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Accordion>
                    <AccordionSummary expandIcon={<IconChevronDown />}>
                      <Typography variant="subtitle2">API Key Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            API Key:
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                bgcolor: "grey.100",
                                p: 1,
                                borderRadius: 1,
                                flexGrow: 1,
                              }}
                            >
                              {showFullKeys[key.key] ? key.key : key.key}
                            </Typography>
                            <IconButton onClick={() => toggleKeyVisibility(key.key)} size="small">
                              {showFullKeys[key.key] ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                            </IconButton>
                            <IconButton onClick={() => copyToClipboard(key.key)} size="small">
                              <IconCopy size={16} />
                            </IconButton>
                          </Stack>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Features:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {key.features.map((feature) => (
                              <Chip key={feature} label={feature} size="small" variant="outlined" />
                            ))}
                          </Stack>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Usage Information:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last Used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Rate Limit: {key.rateLimit} requests per hour
                          </Typography>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={newKeyData.name}
              onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
              placeholder="My AI Project"
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={newKeyData.description}
              onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
              placeholder="Optional description of your project"
            />
            <TextField
              fullWidth
              label="Rate Limit (requests per hour)"
              type="number"
              value={newKeyData.rateLimit}
              onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: Number.parseInt(e.target.value) })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateKey} variant="contained" disabled={!newKeyData.name.trim()}>
            Create API Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
