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
  const [sortOption, setSortOption] = useState('name')
  const [expandedUsers, setExpandedUsers] = useState({})
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false)
  const [settings, setSettings] = useState({
    siteName: '',
    logoUrl: null,
    faviconUrl: null,
  })
  const [newSiteName, setNewSiteName] = useState('')
  const [newLogo, setNewLogo] = useState(null)
  const [newFavicon, setNewFavicon] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
    fetchSettings()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/users')
      setUsers(response.data)
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao carregar usuários ou acesso negado.')
      navigate('/marketplace')
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/admin/settings')
      setSettings(response.data)
      setNewSiteName(response.data.siteName || '')
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      toast.error('Erro ao carregar configurações.')
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

  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('siteName', newSiteName) // Sempre envia, mesmo vazio
    if (newLogo) formData.append('logo', newLogo)
    if (newFavicon) formData.append('favicon', newFavicon)

    try {
      const response = await axios.put(
        'http://localhost:5000/admin/settings',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      console.log('Resposta do backend:', response.data)
      setSettings(response.data.settings) // Atualiza o estado com o retorno
      setNewSiteName(response.data.settings.siteName) // Garante que o input reflita o valor retornado
      setNewLogo(null)
      setNewFavicon(null)
      toast.success('Configurações atualizadas com sucesso!')
      fetchSettings() // Recarrega as configurações
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações.')
    }
  }

  const handleRemoveLogo = async () => {
    try {
      const response = await axios.put('http://localhost:5000/admin/settings', {
        logoUrl: 'null',
      })
      setSettings(response.data.settings) // Usa o retorno do backend
      setNewLogo(null)
      toast.success('Logo removida com sucesso!')
      fetchSettings() // Sincroniza com o backend
    } catch (error) {
      console.error('Erro ao remover logo:', error)
      toast.error('Erro ao remover logo.')
    }
  }

  const handleRemoveFavicon = async () => {
    try {
      const response = await axios.put('http://localhost:5000/admin/settings', {
        faviconUrl: 'null',
      })
      setSettings(response.data.settings) // Usa o retorno do backend
      setNewFavicon(null)
      toast.success('Favicon removido com sucesso!')
      fetchSettings() // Sincroniza com o backend
    } catch (error) {
      console.error('Erro ao remover favicon:', error)
      toast.error('Erro ao remover favicon.')
    }
  }
  const toggleProducts = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  const toggleSettings = () => {
    setIsSettingsExpanded((prev) => !prev)
  }

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
        <button onClick={() => navigate('/marketplace')}>Voltar</button>
      </header>
      <main className="admin-content">
        {/* Seção de Configurações Expansível */}
        <section className="settings-section">
          <div className="settings-header">
            <h2>Personalizar Site</h2>
            <button className="toggle-settings-btn" onClick={toggleSettings}>
              {isSettingsExpanded ? 'Minimizar' : 'Expandir'}
            </button>
          </div>
          {isSettingsExpanded && (
            <form onSubmit={handleUpdateSettings} className="settings-form">
              <div className="form-group">
                <label htmlFor="siteName">Nome do Site:</label>
                <input
                  type="text"
                  id="siteName"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="Digite o nome do site (deixe em branco para remover)"
                />
              </div>
              <div className="form-group">
                <label>Logo Atual:</label>
                {settings.logoUrl ? (
                  <div className="image-container">
                    <img
                      src={`http://localhost:5000/uploads/${settings.logoUrl}`}
                      alt="Logo atual"
                      className="current-logo"
                    />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={handleRemoveLogo}
                    >
                      Remover Logo
                    </button>
                  </div>
                ) : (
                  <p>Sem logo definida</p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id="logo-input"
                  onChange={(e) => setNewLogo(e.target.files[0])}
                  hidden
                />
                <label htmlFor="logo-input" className="upload-btn">
                  Escolher Nova Logo
                </label>
                {newLogo && <span className="file-name">{newLogo.name}</span>}
              </div>
              <div className="form-group">
                <label>Favicon Atual:</label>
                {settings.faviconUrl ? (
                  <div className="image-container">
                    <img
                      src={`http://localhost:5000/uploads/${settings.faviconUrl}`}
                      alt="Favicon atual"
                      className="current-favicon"
                    />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={handleRemoveFavicon}
                    >
                      Remover Favicon
                    </button>
                  </div>
                ) : (
                  <p>Sem favicon definido</p>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id="favicon-input"
                  onChange={(e) => setNewFavicon(e.target.files[0])}
                  hidden
                />
                <label htmlFor="favicon-input" className="upload-btn">
                  Escolher Novo Favicon
                </label>
                {newFavicon && (
                  <span className="file-name">{newFavicon.name}</span>
                )}
              </div>
              <button type="submit" className="save-btn">
                Salvar Configurações
              </button>
            </form>
          )}
        </section>

        {/* Seção de Usuários */}
        <section className="users-section">
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
        </section>
      </main>
    </div>
  )
}
