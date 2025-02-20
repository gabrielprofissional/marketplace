import React from 'react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <div>
      <h1>Welcome to the App</h1>
      <nav>
        <ul>
          <li>
            <Link to="/marketplace">Marketplace</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
          <li>
            <Link to="/portfolio">Portfolio</Link>
          </li>{' '}
          {/* 🔹 Novo link para o portfólio */}
        </ul>
      </nav>
    </div>
  )
}

export default App
