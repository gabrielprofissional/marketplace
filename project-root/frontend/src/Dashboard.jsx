import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="dashboard-container">
      <h1>Bem-vindo ao Painel</h1>
      <div className="options">
        <button onClick={() => navigate('/marketplace')}>
          Acessar Marketplace
        </button>
        <button onClick={() => navigate('/subscription')}>
          Área de Assinatura
        </button>
      </div>
    </div>
  )
}
