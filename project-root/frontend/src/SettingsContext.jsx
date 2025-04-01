import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const SettingsContext = createContext()

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null) // Começa como null
  const [isLoading, setIsLoading] = useState(true)

  // SettingsProvider ajustado
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/admin/settings',
          {
            withCredentials: true,
          }
        )
        console.log('Settings recebidos:', response.data)
        setSettings(response.data) // Aceita siteName como null ou vazio
      } catch (error) {
        console.error(
          'Erro ao buscar settings:',
          error.response?.status,
          error.response?.data || error.message
        )
        setSettings({ siteName: null, logoUrl: null, faviconUrl: null }) // Sem fallback "Meu Marketplace"
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
