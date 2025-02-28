import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { SettingsProvider } from './SettingsContext' // Adiciona o provider
import Auth from './Auth.jsx'
import Portfolio from './Portfolio.jsx'
import SellerProfile from './SellerProfile'
import Admin from './Admin.jsx'
import Profile from './Profile.jsx'
import Marketplace from './Marketplace.jsx'
import App from './App.jsx' // Inclui o App como uma página
import './index.css' // ou main.css, dependendo do seu projeto

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} /> {/* App como página inicial */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/users/:id" element={<SellerProfile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </SettingsProvider>
  </StrictMode>
)
