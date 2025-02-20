import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Register from './Register.jsx'
import Login from './Login.jsx'
import Portfolio from './Portfolio.jsx' // 🔹 Importamos a nova página
import Marketplace from './marketplace.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portfolio" element={<Portfolio />} />{' '}
        <Route path="/marketplace" element={<Marketplace />} />{' '}
        {/* 🔹 Adicionamos a nova rota */}
      </Routes>
    </Router>
  </StrictMode>
)
