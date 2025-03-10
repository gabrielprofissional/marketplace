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

  return (
    <div>
      <h1>Welcome to the App</h1>
      <nav>
        <ul>
          <li>
            <Link to="/marketplace">Marketplace</Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default App
