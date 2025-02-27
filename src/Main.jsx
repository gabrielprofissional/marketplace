import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import Auth from './Auth.jsx' // Novo componente combinado
import Portfolio from './Portfolio.jsx' // 🔹 Importamos a nova página
import Marketplace from './Marketplace.jsx'
import SellerProfile from './SellerProfile' // Novo componente
import Admin from './Admin.jsx' // Importe a nova página

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<Auth />} />{' '}
        {/* Substitui /login e /register */}
        <Route path="/portfolio" element={<Portfolio />} />{' '}
        <Route path="/marketplace" element={<Marketplace />} />{' '}
        <Route path="/users/:id" element={<SellerProfile />} />
        <Route path="/admin" element={<Admin />} /> {/* Nova rota */}
        {/* 🔹 Adicionamos a nova rota */}
      </Routes>
    </Router>
  </StrictMode>
)
