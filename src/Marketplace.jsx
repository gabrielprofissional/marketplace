import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Marketplace.css'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

axios.defaults.withCredentials = true

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await axios.post('http://localhost:5000/refresh-token')
        return axios(originalRequest)
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError)
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('created_at')
  const [user, setUser] = useState(null)
  const [editProductId, setEditProductId] = useState(null)
  const [favorites, setFavorites] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
    fetchUser()
    fetchFavorites()
  }, [page, minPrice, maxPrice, sort])

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/me')
      setUser(response.data)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      toast.error(
        'Erro ao verificar autenticação. Redirecionando para login...'
      )
      navigate('/login')
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/products', {
        params: { page, limit, minPrice, maxPrice, sort },
      })
      setProducts(response.data.products)
      setTotal(response.data.total)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      toast.error('Erro ao carregar produtos.')
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login')
      }
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('http://localhost:5000/favorites')
      setFavorites(response.data.map((fav) => fav.productId))
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error)
      toast.error('Erro ao carregar favoritos.')
    }
  }

  const handleLogout = () => {
    setUser(null)
    toast.info('Logout realizado com sucesso!')
    navigate('/login')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('price', parseFloat(price))
    if (image) {
      console.log('Imagem selecionada:', image)
      formData.append('image', image)
    }

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
      fetchProducts()
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
      fetchProducts()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto!')
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout()
      }
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage)
    }
  }

  const handleFavorite = async (productId, isFavorited) => {
    try {
      if (isFavorited) {
        await axios.delete(`http://localhost:5000/favorites/${productId}`)
        setFavorites(favorites.filter((id) => id !== productId))
        toast.success('Produto removido dos favoritos!')
      } else {
        await axios.post('http://localhost:5000/favorites', { productId })
        setFavorites([...favorites, productId])
        toast.success('Produto adicionado aos favoritos!')
      }
    } catch (error) {
      console.error('Erro ao manipular favorito:', error)
      toast.error('Erro ao atualizar favoritos!')
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="marketplace">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      <header className="marketplace-header">
        <div className="header-content">
          <h1>Marketplace</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user ? (
            <div>
              <span>Bem-vindo, {user.name}</span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </header>

      <div className="marketplace-content">
        <aside className="sidebar">
          {user && (
            <button
              className={`add-button ${products.length === 0 ? 'pulse' : ''}`}
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
        </aside>

        <main className="product-area">
          {/* Filtros Avançados */}
          <div className="filters">
            <input
              type="number"
              placeholder="Preço mínimo"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              placeholder="Preço máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="created_at">Mais recente</option>
              <option value="price">Menor preço</option>
              <option value="-price">Maior preço</option>
            </select>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={`http://localhost:5000/uploads/${product.image}`}
                    alt={product.name}
                  />
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                  <p className="price">R$ {product.price.toFixed(2)}</p>
                  {user && (
                    <div>
                      <button
                        onClick={() =>
                          handleFavorite(
                            product.id,
                            favorites.includes(product.id)
                          )
                        }
                        className={
                          favorites.includes(product.id) ? 'favorited' : ''
                        }
                      >
                        {favorites.includes(product.id)
                          ? '★ Favoritado'
                          : '☆ Favoritar'}
                      </button>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-products">
              Nenhum produto adicionado ainda.{' '}
              {user
                ? 'Clique no botão à esquerda para adicionar um.'
                : 'Faça login para adicionar.'}
            </p>
          )}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span>
              Página {page} de {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === Math.ceil(total / limit)}
            >
              Próximo
            </button>
          </div>
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
