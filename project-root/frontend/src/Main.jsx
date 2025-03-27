import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { SettingsProvider } from './SettingsContext.jsx'
import Auth from './Auth.jsx'
import Portfolio from './Portfolio.jsx'
import SellerProfile from './SellerProfile.jsx'
import Admin from './Admin.jsx'
import Profile from './Profile.jsx'
import Marketplace from './Marketplace.jsx'
import App from './App.jsx'
import './index.css'
import Dashboard from './Dashboard.jsx'
import Myproducts from './myproducts.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/users/:id" element={<SellerProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Myproducts" element={<Myproducts />} />
        </Routes>
      </Router>
    </SettingsProvider>
  </StrictMode>
)
