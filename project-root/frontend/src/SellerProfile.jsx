import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import './SellerProfile.css' // Crie este arquivo se quiser estilizar

axios.defaults.withCredentials = true

export default function SellerProfile() {
  const [seller, setSeller] = useState(null)
  const [products, setProducts] = useState([])
  const { id } = useParams() // Pega o ID do vendedor da URL
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSellerProfile = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/users/${id}/products`
        )
        setSeller(response.data.user)
        setProducts(response.data.products)
      } catch (error) {
        console.error('Erro ao buscar perfil do vendedor:', error)
        navigate('/') // Volta para o Marketplace se falhar
      }
    }
    fetchSellerProfile()
  }, [id, navigate])

  if (!seller) return <p>Carregando...</p>

  return (
    <div className="seller-profile">
      <h1>Perfil de {seller.name}</h1>
      <p>
        <strong>Email:</strong> {seller.email}
      </p>
      <h2>Produtos Adicionados por {seller.name}</h2>
      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
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
        <p>Este vendedor ainda não adicionou produtos.</p>
      )}
      <button onClick={() => navigate('/')}>Voltar ao Marketplace</button>
    </div>
  )
}
