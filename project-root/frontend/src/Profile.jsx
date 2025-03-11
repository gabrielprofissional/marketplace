import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './Profile.css'

// Configuração global do Axios
axios.defaults.withCredentials = true // Define withCredentials globalmente

export default function Profile() {
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newProfilePicture, setNewProfilePicture] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
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
        'Erro ao carregar perfil:',
        error.response?.data || error.message
      )
      toast.error('Erro ao carregar perfil. Redirecionando para login...')
      navigate('/auth')
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureChange = async (e) => {
    e.preventDefault()
    if (!newProfilePicture) {
      toast.error('Selecione uma imagem primeiro!')
      return
    }

    const formData = new FormData()
    formData.append('profilePicture', newProfilePicture)

    try {
      const response = await axios.put('http://localhost:5000/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUser(response.data.user)
      setNewProfilePicture(null)
      toast.success('Foto de perfil atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error)
      toast.error('Erro ao atualizar foto de perfil!')
    }
  }

  const handleBackToMarketplace = () => {
    navigate('/marketplace')
  }

  if (loading) {
    return <div className="loading-text">Carregando perfil...</div>
  }

  return (
    <div className="profile-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="profile-header">
        <h1>Meu Perfil</h1>
        <button
          className="marketplace-button"
          onClick={handleBackToMarketplace}
        >
          Voltar ao Marketplace
        </button>
      </header>

      <main className="profile-content">
        <section className="user-info">
          <h2>Informações Pessoais</h2>
          <div className="profile-picture-container">
            {user?.profilePicture ? (
              <img
                src={`http://localhost:5000/uploads/${user.profilePicture}`}
                alt="Foto de perfil"
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">Sem foto</div>
            )}
            <form onSubmit={handleProfilePictureChange}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewProfilePicture(e.target.files[0])}
                id="profile-picture-input"
                hidden
              />
              <label htmlFor="profile-picture-input" className="upload-button">
                Alterar Foto
              </label>
              {newProfilePicture && (
                <button type="submit" className="save-button">
                  Salvar
                </button>
              )}
            </form>
          </div>
          <p>
            <strong>Nome:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
        </section>

        <section className="user-products">
          <h2>Meus Produtos Cadastrados</h2>
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
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum produto cadastrado ainda.</p>
          )}
        </section>

        <section className="user-sales">
          <h2>Minhas Vendas</h2>
          <p>Funcionalidade em desenvolvimento.</p>
        </section>
      </main>
    </div>
  )
}
