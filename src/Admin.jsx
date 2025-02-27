import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './Admin.css'

axios.defaults.withCredentials = true

export default function Admin() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState('')
  const [removeProductReasons, setRemoveProductReasons] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('name') // Novo estado para ordenação
  const [expandedUsers, setExpandedUsers] = useState({}) // Novo estado para expandir produtos
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/users')
      console.log('Usuários recebidos:', response.data)
      setUsers(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao carregar usuários ou acesso negado.')
      navigate('/marketplace')
    }
  }

  const handleBanUser = async (userId) => {
    if (!banReason) {
      toast.error('Por favor, forneça uma justificativa para o banimento.')
      return
    }
    try {
      await axios.post(`http://localhost:5000/admin/users/${userId}/ban`, {
        reason: banReason,
        duration: banDuration ? parseInt(banDuration) : null,
      })
      toast.success('Usuário banido com sucesso!')
      fetchUsers()
      setBanReason('')
      setBanDuration('')
    } catch (error) {
      console.error('Erro ao banir usuário:', error)
      toast.error('Erro ao banir usuário.')
    }
  }

  const handleUnbanUser = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/admin/users/${userId}/unban`)
      toast.success('Banimento removido com sucesso!')
      fetchUsers()
    } catch (error) {
      console.error('Erro ao remover banimento:', error)
      toast.error('Erro ao remover banimento.')
    }
  }

  const handleRemoveProduct = async (productId) => {
    const reason = removeProductReasons[productId] || ''
    if (!reason) {
      toast.error(
        'Por favor, forneça uma justificativa para remover o produto.'
      )
      return
    }
    try {
      await axios.delete(`http://localhost:5000/admin/products/${productId}`, {
        data: { reason },
      })
      toast.success('Produto removido com sucesso!')
      fetchUsers()
      setRemoveProductReasons((prev) => ({ ...prev, [productId]: '' }))
    } catch (error) {
      console.error('Erro ao remover produto:', error)
      toast.error('Erro ao remover produto.')
    }
  }

  const toggleProducts = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  // Filtrar e ordenar usuários
  const filteredUsers = users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name)
      if (sortOption === 'createdAt')
        return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortOption === 'status')
        return (a.isBanned ? 1 : 0) - (b.isBanned ? 1 : 0)
      return 0
    })

  if (isLoading) return <div className="loading">Carregando...</div>

  return (
    <div className="admin">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="admin-header">
        <h1>Painel de Administração</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar usuários por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="sort-select"
        >
          <option value="name">Ordenar por Nome</option>
          <option value="createdAt">Ordenar por Data de Criação</option>
          <option value="status">Ordenar por Status</option>
        </select>
        <button onClick={() => navigate('/marketplace')}>
          Voltar ao Marketplace
        </button>
      </header>
      <main className="admin-content">
        <h2>Gerenciar Usuários</h2>
        <div className="user-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <h3>{user.name}</h3>
                  <button
                    className="toggle-products-btn"
                    onClick={() => toggleProducts(user.id)}
                  >
                    {expandedUsers[user.id]
                      ? 'Esconder Produtos'
                      : 'Mostrar Produtos'}
                  </button>
                </div>
                <p>Email: {user.email}</p>
                <p>Admin: {user.isAdmin ? 'Sim' : 'Não'}</p>
                <p>
                  Status:{' '}
                  {user.isBanned
                    ? `Banido até ${
                        user.bannedUntil
                          ? new Date(user.bannedUntil).toLocaleDateString()
                          : 'Permanentemente'
                      } - Motivo: ${user.banReason || 'N/A'}`
                    : 'Ativo'}
                </p>
                {!user.isAdmin && (
                  <div className="ban-section">
                    {!user.isBanned ? (
                      <>
                        <input
                          type="text"
                          placeholder="Justificativa do banimento"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Duração (dias, deixe em branco para permanente)"
                          value={banDuration}
                          onChange={(e) => setBanDuration(e.target.value)}
                        />
                        <button onClick={() => handleBanUser(user.id)}>
                          Banir
                        </button>
                      </>
                    ) : (
                      <button
                        className="unban-btn"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        Remover Banimento
                      </button>
                    )}
                  </div>
                )}
                {expandedUsers[user.id] && (
                  <div className="products-section">
                    <h4>Produtos</h4>
                    {user.products.length > 0 ? (
                      <ul>
                        {user.products.map((product) => (
                          <li key={product.id} className="product-item">
                            <span>
                              {product.name} - R$ {product.price.toFixed(2)}
                            </span>
                            <input
                              type="text"
                              placeholder="Justificativa para remoção"
                              value={removeProductReasons[product.id] || ''}
                              onChange={(e) =>
                                setRemoveProductReasons((prev) => ({
                                  ...prev,
                                  [product.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="remove-product-btn"
                              onClick={() => handleRemoveProduct(product.id)}
                            >
                              Remover
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhum produto cadastrado.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="no-results">Nenhum usuário encontrado.</p>
          )}
        </div>
      </main>
    </div>
  )
}
