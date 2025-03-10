import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const SettingsContext = createContext()

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    siteName: 'Marketplace',
    logoUrl: null,
    faviconUrl: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/settings')
        setSettings(response.data)
        if (response.data.faviconUrl) {
          const link =
            document.querySelector("link[rel*='icon']") ||
            document.createElement('link')
          link.type = 'image/png' // Alterado de 'image/x-icon' para 'image/png'
          link.rel = 'shortcut icon'
          link.href = `http://localhost:5000/uploads/${response.data.faviconUrl}`
          document.getElementsByTagName('head')[0].appendChild(link)
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}
