import React, { useState, useEffect, useRef, useContext } from 'react'
import axios from 'axios'
import './Marketplace.css'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SettingsContext } from './SettingsContext'

// Ícones (você pode usar uma biblioteca como react-icons para os ícones)
import {
  FaTachometerAlt,
  FaShoppingCart,
  FaStore,
  FaBox,
  FaMoneyBillWave,
  FaPlug,
  FaShoppingBag,
  FaGift,
  FaMoon,
  FaCog,
  FaUser,
} from 'react-icons/fa'

axios.defaults.withCredentials = true

export default function Marketplace() {
  const { settings, isLoading } = useContext(SettingsContext)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(10)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)
  const [editProductId, setEditProductId] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const loaderRef = useRef(null)
  const navigate = useNavigate()

  const context = useContext(SettingsContext)
  console.log('SettingsContext value:', context)

  useEffect(() => {
    fetchUser()
    fetchFavorites()
    fetchProducts(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingProducts) {
          fetchProducts()
        }
      },
      { threshold: 0.1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingProducts])

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/me')
      setUser(response.data)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      toast.error(
        'Erro ao verificar autenticação. Redirecionando para login...'
      )
      navigate('/auth')
    }
  }

  const fetchProducts = async (reset = false) => {
    if (isLoadingProducts || (!hasMore && !reset)) return
    setIsLoadingProducts(true)
    try {
      const response = await axios.get(`http://localhost:5000/products`, {
        params: {
          offset: reset ? 0 : offset,
          limit,
        },
      })
      const newProducts = response.data.products
      setProducts((prev) => (reset ? newProducts : [...prev, ...newProducts]))
      setTotal(response.data.total)
      setOffset((prev) => (reset ? limit : prev + limit))
      setHasMore(
        newProducts.length === limit && offset + limit < response.data.total
      )
      if (reset) setInitialLoadComplete(true)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      toast.error('Erro ao carregar produtos.')
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/auth')
      }
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('http://localhost:5000/favorites')
      setFavorites(response.data)
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error)
      toast.error('Erro ao carregar favoritos!')
    }
  }

  const handleLogout = () => {
    setUser(null)
    toast.info('Logout realizado com sucesso!')
    navigate('/auth')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('price', parseFloat(price))
    if (image) formData.append('image', image)

    try {
      if (editProductId) {
        await axios.put(
          `http://localhost:5000/products/${editProductId}`,
          formData
        )
        toast.success('Produto editado com sucesso!')
      } else {
        await axios.post('http://localhost:5000/products', formData)
        toast.success('Produto adicionado com sucesso!')
      }
      setName('')
      setDescription('')
      setPrice('')
      setImage(null)
      setShowForm(false)
      setEditProductId(null)
      setProducts([])
      setOffset(0)
      setHasMore(true)
      fetchProducts(true)
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('Erro ao salvar produto!')
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout()
      }
    }
  }

  const handleEdit = (product) => {
    setName(product.name)
    setDescription(product.description)
    setPrice(product.price)
    setEditProductId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/products/${id}`)
      toast.success('Produto excluído com sucesso!')
      setProducts([])
      setOffset(0)
      setHasMore(true)
      fetchProducts(true)
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto!')
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout()
      }
    }
  }

  const handleFavorite = async (productId) => {
    try {
      if (favorites.some((fav) => fav.productId === productId)) {
        await axios.delete(`http://localhost:5000/favorites/${productId}`)
        toast.success('Produto removido dos favoritos!')
      } else {
        await axios.post('http://localhost:5000/favorites', { productId })
        toast.success('Produto adicionado aos favoritos!')
      }
      fetchFavorites()
    } catch (error) {
      console.error('Erro ao manipular favorito:', error)
      toast.error('Erro ao manipular favorito!')
    }
  }

  const handleProductClick = async (productId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/products/${productId}`
      )
      setSelectedProduct(response.data)
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error)
      toast.error('Erro ao carregar detalhes do produto!')
    }
  }

  const handleViewSellerProfile = (userId) => {
    navigate(`/users/${userId}`)
  }

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev)
    document.body.classList.toggle('white-mode', !isDarkMode)
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <div className="loading-text">Carregando configurações...</div>
  }

  return (
    <div className={`marketplace ${isDarkMode ? 'white-mode' : ''}`}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <header className="marketplace-header">
        <div className="header-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user && <span className="welcome-text">Bem-vindo, {user.name}</span>}
        </div>
      </header>

      <div className="marketplace-content">
        <aside className="sidebar">
          {user && (
            <div className="sidebar-content">
              <h1 className="sidebar-title">{settings.siteName || ''}</h1>
              {settings.logoUrl && (
                <img
                  src={`http://localhost:5000/uploads/${settings.logoUrl}`}
                  alt="Logo do site"
                  className="sidebar-logo"
                />
              )}
              <nav className="sidebar-nav">
                <button
                  className="sidebar-btn active"
                  onClick={() => navigate('/dashboard')}
                >
                  <FaTachometerAlt className="sidebar-icon" /> Dashboard
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/sales')}
                >
                  <FaShoppingCart className="sidebar-icon" /> Vendas
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/marketplace')}
                >
                  <FaStore className="sidebar-icon" /> Marketplace
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/my-products')}
                >
                  <FaBox className="sidebar-icon" /> Produtos
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/finances')}
                >
                  <FaMoneyBillWave className="sidebar-icon" /> Finanças
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/integrations')}
                >
                  <FaPlug className="sidebar-icon" /> Integrações
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/purchases')}
                >
                  <FaShoppingBag className="sidebar-icon" /> Compras
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/refer-and-earn')}
                >
                  <FaGift className="sidebar-icon" /> Indique e Ganhe
                </button>
              </nav>
              <div className="sidebar-footer">
                <button
                  className="sidebar-btn theme-toggle"
                  onClick={toggleTheme}
                >
                  <FaMoon className="sidebar-icon" />{' '}
                  {isDarkMode ? 'Claro' : 'Escuro'}
                </button>
                <button
                  className="sidebar-btn"
                  onClick={() => navigate('/settings')}
                >
                  <FaCog className="sidebar-icon" /> Configurações
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className="product-area">
          {!initialLoadComplete ? (
            <p className="loading-text">Carregando produtos...</p>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => handleProductClick(product.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={`http://localhost:5000/uploads/${product.image}`}
                    alt={product.name}
                  />
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                  <p className="price">R$ {product.price.toFixed(2)}</p>
                  {user && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {product.userId === user.id && (
                        <>
                          <button onClick={() => handleEdit(product)}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(product.id)}>
                            Excluir
                          </button>
                        </>
                      )}
                      <button onClick={() => handleFavorite(product.id)}>
                        {favorites.some((fav) => fav.productId === product.id)
                          ? 'Remover Favorito'
                          : 'Favoritar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : total === 0 ? (
            <p className="no-products">
              Nenhum produto adicionado ainda.{' '}
              {user
                ? 'Clique no botão à esquerda para adicionar um.'
                : 'Faça login para adicionar.'}
            </p>
          ) : (
            <p className="no-products">
              Nenhum produto encontrado para essa busca.
            </p>
          )}

          {hasMore && (
            <div ref={loaderRef} className="loading">
              {isLoadingProducts && <p>Carregando mais produtos...</p>}
            </div>
          )}

          {showFavorites && user && (
            <div className="favorites-section">
              <h2>Meus Favoritos</h2>
              {favorites.length > 0 ? (
                <div className="product-grid">
                  {favorites.map((fav) => (
                    <div key={fav.product.id} className="product-card">
                      <img
                        src={`http://localhost:5000/uploads/${fav.product.image}`}
                        alt={fav.product.name}
                      />
                      <h2>{fav.product.name}</h2>
                      <p>{fav.product.description}</p>
                      <p className="price">R$ {fav.product.price.toFixed(2)}</p>
                      <button onClick={() => handleFavorite(fav.product.id)}>
                        Remover Favorito
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhum produto favoritado ainda.</p>
              )}
              <button onClick={() => setShowFavorites(false)}>Fechar</button>
            </div>
          )}

          {selectedProduct && (
            <div className="modal show-modal">
              <div className="modal-content">
                <h2>{selectedProduct.name}</h2>
                <img
                  src={`http://localhost:5000/uploads/${selectedProduct.image}`}
                  alt={selectedProduct.name}
                />
                <p>
                  <strong>Descrição:</strong> {selectedProduct.description}
                </p>
                <p>
                  <strong>Preço:</strong> R$ {selectedProduct.price.toFixed(2)}
                </p>
                <p>
                  <strong>Vendedor:</strong> {selectedProduct.user.name}
                </p>
                <div className="modal-buttons">
                  <button
                    onClick={() =>
                      handleViewSellerProfile(selectedProduct.user.id)
                    }
                  >
                    Ver Perfil do Vendedor
                  </button>
                  <button onClick={() => setSelectedProduct(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {user && (
          <div className="bottom-bar">
            <button
              className="bottom-bar-btn"
              onClick={() => {
                setEditProductId(null)
                setName('')
                setDescription('')
                setPrice('')
                setImage(null)
                setShowForm(true)
              }}
            >
              Adicionar Produto
            </button>
            <button
              className="bottom-bar-btn"
              onClick={() => navigate('/finances')}
            >
              Finanças
            </button>
            <button
              className="bottom-bar-btn"
              onClick={() => navigate('/sales')}
            >
              Vendas
            </button>
            <button
              className="bottom-bar-btn"
              onClick={() => navigate('/profile')}
            >
              Perfil
            </button>
          </div>
        )}
      </div>

      {showForm && user && (
        <div className="modal show-modal">
          <div className="modal-content">
            <h2>
              {editProductId ? 'Editar Produto' : 'Adicionar Novo Produto'}
            </h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Nome do produto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <textarea
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Preço"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                required
              />
              <div className="file-upload">
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  hidden
                />
                <label htmlFor="file-input" className="file-label">
                  <i className="fas fa-upload"></i> Escolher Imagem
                </label>
                {image && <span className="file-name">{image.name}</span>}
              </div>
              <div className="form-buttons">
                <button type="submit">Salvar</button>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
