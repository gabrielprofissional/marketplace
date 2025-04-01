import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import './Myproducts.css'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SettingsContext } from './SettingsContext'

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
} from 'react-icons/fa'

axios.defaults.withCredentials = true

export default function Myproducts() {
  const { settings, isLoading } = useContext(SettingsContext)
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState(null)
  const [editProductId, setEditProductId] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setIsLoadingProducts(true)
      console.log('Buscando dados de /me...')
      const userResponse = await axios.get('http://localhost:5000/me')
      console.log('Resposta de /me:', userResponse.data)
      setUser(userResponse.data)

      console.log(
        `Buscando produtos de /users/${userResponse.data.id}/products...`
      )
      const productsResponse = await axios.get(
        `http://localhost:5000/users/${userResponse.data.id}/products`
      )
      console.log('Resposta de produtos:', productsResponse.data)
      setProducts(productsResponse.data.products)
    } catch (error) {
      console.error(
        'Erro ao carregar produtos:',
        error.response?.data || error.message
      )
      toast.error('Erro ao carregar produtos. Redirecionando para login...')
      navigate('/auth')
    } finally {
      setIsLoadingProducts(false)
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
      fetchProfileData()
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
      fetchProfileData()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto!')
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout()
      }
    }
  }

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev)
    document.body.classList.toggle('white-mode', !isDarkMode)
  }

  if (isLoading || isLoadingProducts) {
    return <div className="loading-text">Carregando...</div>
  }

  return (
    <div className={`my-products ${isDarkMode ? 'white-mode' : ''}`}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="my-products-content">
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
                  className="sidebar-btn"
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
                  className="sidebar-btn active"
                  onClick={() => navigate('/myproducts')}
                >
                  <FaBox className="sidebar-icon" /> Meus Produtos
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
          <div className="header-actions">
            <h2>Meus Produtos</h2>
            {user && (
              <button
                className="add-product-btn"
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
            )}
          </div>
          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={`http://localhost:5000/uploads/${product.image}`}
                    alt={product.name}
                  />
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <p className="price">R$ {product.price.toFixed(2)}</p>
                  <div>
                    <button onClick={() => handleEdit(product)}>Editar</button>
                    <button onClick={() => handleDelete(product.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-products">
              Você ainda não adicionou produtos. Clique no botão acima para
              começar!
            </p>
          )}
        </main>
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
