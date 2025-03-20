import React, { useState } from 'react'
import axios from 'axios'
import './Subscription.css'

export default function Subscription() {
  const [capeFile, setCapeFile] = useState(null)
  const [message, setMessage] = useState('')

  const handleCapeUpload = async (e) => {
    e.preventDefault()
    if (!capeFile) {
      setMessage('Por favor, selecione uma capa!')
      return
    }

    const formData = new FormData()
    formData.append('cape', capeFile)

    try {
      const response = await axios.post(
        'http://localhost:5000/upload-cape',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      setMessage('Capa enviada com sucesso! Atualize seu mod para vê-la.')
    } catch (err) {
      setMessage(
        'Erro ao enviar a capa: ' + err.response?.data?.error ||
          'Tente novamente.'
      )
    }
  }

  return (
    <div className="subscription-container">
      <h1>Área de Assinatura</h1>
      <p>Personalize sua capa abaixo:</p>
      <form onSubmit={handleCapeUpload}>
        <input
          type="file"
          accept="image/png"
          onChange={(e) => setCapeFile(e.target.files[0])}
        />
        <button type="submit">Enviar Capa</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
