import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

axios.defaults.withCredentials = true

function App() {
  const [user, setUser] = useState(null)
  const [siteName, setSiteName] = useState('')
  const [logoUrl, setLogoUrl] = useState(null)
  const navigate = useNavigate()

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/me')
      setUser(response.data)
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      setUser(null)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/settings')
      console.log('Configurações recebidas:', response.data)
      setSiteName(response.data.siteName || 'Site Sem Nome')
      setLogoUrl(response.data.logoUrl || null)
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      setSiteName('Erro ao carregar nome')
      setLogoUrl(null)
    }
  }

  useEffect(() => {
    fetchUser() // Busca o usuário ao carregar a página
  }, [])

  useEffect(() => {
    if (user) {
      fetchSettings() // Busca as configurações somente após o usuário estar autenticado
    }
  }, [user])

  return (
    <div>
      <header>
        {logoUrl && (
          <img src={logoUrl} alt="Logo do site" style={{ maxWidth: '200px' }} />
        )}
        <h1>{siteName || 'Carregando...'}</h1>
      </header>
      {user ? (
        <nav>
          <ul>
            <li>
              <Link to="/marketplace">Marketplace</Link>
            </li>
          </ul>
        </nav>
      ) : (
        <p>Faça login para acessar o Marketplace</p>
      )}
    </div>
  )
}

export default App
