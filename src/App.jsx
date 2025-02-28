import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

axios.defaults.withCredentials = true

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/me')
        setUser(response.data)
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    setUser(null)
    navigate('/auth')
  }

  return (
    <div>
      <h1>Welcome to the App</h1>
      <nav>
        <ul>
          <li>
            <Link to="/marketplace">Marketplace</Link>
          </li>
          {user ? (
            <>
              <li>Bem-vindo, {user.name}</li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth">Login</Link>
            </li>
          )}
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default App
