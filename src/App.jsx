import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode' // Mudança aqui: importação nomeada

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode(token) // Uso da função nomeada
        setUser({ email: decoded.email })
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
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
              <li>Bem-vindo, {user.email}</li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <></>
          )}
          <li>
            <Link to="/auth">Auth</Link>
          </li>
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default App
