import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './Marketplace.css'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ReactSlider from 'react-slider' // Importando o react-slider

axios.defaults.withCredentials = true

// Configuração do interceptor permanece igual (omitido por brevidade)

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
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
  const [priceRange, setPriceRange] = useState([0, 1000]) // Substitui minPrice e maxPrice
  const [sort, setSort] = useState('created_at')
  const [showFavorites, setShowFavorites] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const loaderRef = useRef(null) // Referência para o ponto de observação
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
    fetchFavorites()
    fetchProducts(true) // Carrega produtos iniciais explicitamente
  }, [])

  useEffect(() => {
    // Resetar produtos e offset ao mudar filtros
    setProducts([])
    setOffset(0)
    setHasMore(true)
    fetchProducts(true) // true indica reset
  }, [priceRange, sort]) // priceRange substitui minPrice e maxPrice

  useEffect(() => {
    // Configurar IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchProducts()
        }
      },
      { threshold: 0.1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading])

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

  const fetchProducts = async (reset = false) => {
    if (isLoading || (!hasMore && !reset)) return
    setIsLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/products`, {
        params: {
          offset: reset ? 0 : offset,
          limit,
          minPrice: priceRange[0], // Usa valores do slider
          maxPrice: priceRange[1],
          sort,
        },
      })
      const newProducts = response.data.products
      setProducts((prev) => (reset ? newProducts : [...prev, ...newProducts]))
      setTotal(response.data.total)
      setOffset((prev) => (reset ? limit : prev + limit))
      setHasMore(
        newProducts.length === limit && offset + limit < response.data.total
      )
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      toast.error('Erro ao carregar produtos.')
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login')
      }
    } finally {
      setIsLoading(false)
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
    navigate('/login')
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
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')}>Login</button>
          )}
        </div>
      </header>

      <div className="marketplace-content">
        <aside className="sidebar">
          {user && (
            <>
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
              <button onClick={() => setShowFavorites(true)}>
                Meus Favoritos
              </button>
              <button onClick={() => setShowProfile(true)}>Meu Perfil</button>
            </>
          )}
        </aside>

        <main className="product-area">
          <div className="filters">
            <div className="price-filter">
              <label>
                Faixa de Preço: R$ {priceRange[0]} - R$ {priceRange[1]}
              </label>
              <ReactSlider
                className="price-slider"
                thumbClassName="price-thumb"
                trackClassName="price-track"
                value={priceRange}
                onChange={(value) => setPriceRange(value)}
                min={0}
                max={1000} // Ajuste conforme os preços reais do seu marketplace
                step={10}
                pearling
                minDistance={10}
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="created_at">Mais recente</option>
              <option value="price">Menor preço</option>
              <option value="-price">Maior preço</option>
            </select>
          </div>

          {filteredProducts.length > 0 ? (
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
          ) : (
            <p className="no-products">
              Nenhum produto adicionado ainda.{' '}
              {user
                ? 'Clique no botão à esquerda para adicionar um.'
                : 'Faça login para adicionar.'}
            </p>
          )}

          {/* Elemento de carregamento observado pelo IntersectionObserver */}
          {hasMore && (
            <div ref={loaderRef} className="loading">
              {isLoading && <p>Carregando mais produtos...</p>}
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

          {showProfile && user && (
            <div className="profile-section">
              <h2>Meu Perfil</h2>
              <p>
                <strong>Nome:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Produtos Cadastrados:</strong>{' '}
                {products.filter((p) => p.userId === user.id).length}
              </p>
              <p>
                <strong>Vendas Realizadas:</strong> 0 (A implementar)
              </p>
              <button onClick={() => setShowProfile(false)}>Fechar</button>
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
