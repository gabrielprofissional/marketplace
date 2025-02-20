import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Marketplace.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('price', parseFloat(price))
    formData.append('image', image)

    try {
      await axios.post('http://localhost:5000/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setName('')
      setDescription('')
      setPrice('')
      setImage(null)
      setShowForm(false)
      fetchProducts()
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="marketplace">
      <header className="marketplace-header">
        <div className="header-content">
          <h1>TESTE</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="marketplace-content">
        <aside className="sidebar">
          <button
            className={`add-button ${products.length === 0 ? 'pulse' : ''}`}
            onClick={() => setShowForm(true)}
          >
            Adicionar Produto
          </button>
        </aside>

        <main className="product-area">
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
                </div>
              ))}
            </div>
          ) : (
            <p className="no-products">
              Nenhum produto adicionado ainda. Clique no botão à esquerda para
              adicionar um.
            </p>
          )}
        </main>
      </div>

      {showForm && (
        <div className="modal show-modal">
          <div className="modal-content">
            <h2>Adicionar Novo Produto</h2>
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
              {/* Novo campo de arquivo personalizado */}
              <div className="file-upload">
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  required
                  hidden // Esconde o input padrão
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
