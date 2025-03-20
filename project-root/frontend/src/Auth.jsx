import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

axios.defaults.withCredentials = true

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/login', { email, password })
      navigate('/dashboard') // Redireciona para o dashboard
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login')
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/register', {
        name,
        email,
        password,
      })
      setIsLogin(true)
      setName('')
      setEmail('')
      setPassword('')
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="slider-toggle">
          <button
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Registro
          </button>
          <div
            className={`slider ${isLogin ? 'slide-left' : 'slide-right'}`}
          ></div>
        </div>
        <div className="form-container">
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <h2>Login</h2>
              {error && <p className="error">{error}</p>}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Entrar</button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <h2>Registro</h2>
              {error && <p className="error">{error}</p>}
              <div>
                <input
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Registrar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
