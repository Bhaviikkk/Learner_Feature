"use client"

import { useState } from "react"
import { Box, IconButton, Menu, MenuItem, Typography, ListItemIcon, ListItemText, Divider, Chip } from "@mui/material"
import { IconLanguage, IconCheck } from "@tabler/icons-react"

interface LanguageSelectorProps {
  currentLanguage: string
  onLanguageChange: (language: string) => void
  variant?: "button" | "menu"
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
]

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  variant = "button",
}: LanguageSelectorProps) {
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const currentLang = languages.find((lang) => lang.code === currentLanguage) || languages[0]

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageSelect = (languageCode) => {
    onLanguageChange(languageCode)
    handleClose()
  }

  if (variant === "menu") {
    return (
      <Box>
        <IconButton onClick={handleClick} color="inherit" sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
          <IconLanguage size={24} />
        </IconButton>
        <Typography variant="caption" sx={{ color: "white", minWidth: 20, ml: 0.5 }}>
          {currentLang.code.toUpperCase()}
        </Typography>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { minWidth: 200 } }}>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: "text.secondary" }}>
            Select Language
          </Typography>
          <Divider />
          {languages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              selected={language.code === currentLanguage}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {language.code === currentLanguage ? <IconCheck size={20} /> : <span>{language.flag}</span>}
              </ListItemIcon>
              <ListItemText
                primary={language.name}
                secondary={language.nativeName}
                primaryTypographyProps={{ variant: "body2" }}
                secondaryTypographyProps={{ variant: "caption" }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>
    )
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Chip
        label={`${currentLang.flag} ${currentLang.nativeName}`}
        onClick={handleClick}
        variant="outlined"
        size="small"
        sx={{ cursor: "pointer" }}
      />

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { minWidth: 200 } }}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: "text.secondary" }}>
          Select Language
        </Typography>
        <Divider />
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            selected={language.code === currentLanguage}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {language.code === currentLanguage ? <IconCheck size={20} /> : <span>{language.flag}</span>}
            </ListItemIcon>
            <ListItemText
              primary={language.name}
              secondary={language.nativeName}
              primaryTypographyProps={{ variant: "body2" }}
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
