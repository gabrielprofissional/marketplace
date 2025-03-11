import { UserModel } from '../models/user.js'
import { ProductModel } from '../models/product.js'
import { FavoriteModel } from '../models/favorite.js'
import { promises as fs } from 'fs'
import path from 'path'
import { config } from '../config/server.js'
import { processProfileImage } from '../utils/imageProcessing.js'

export const getMe = async (req, res) => {
  try {
    console.log('getMe - req.user:', req.user) // Log para verificar
    const user = await UserModel.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body
    let updatedData = {}

    if (name) updatedData.name = name
    if (email) {
      const existingUser = await UserModel.findByEmail(email)
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ error: 'E-mail já está em uso' })
      }
      updatedData.email = email
    }

    if (req.file) {
      const currentUser = await UserModel.findById(req.user.id)
      if (currentUser.profilePicture) {
        await fs.unlink(
          path.join(config.uploadPath, currentUser.profilePicture)
        )
      }
      updatedData.profilePicture = await processProfileImage(req.file)
    }

    const updatedUser = await UserModel.update(req.user.id, updatedData)
    res.json({ message: 'Perfil atualizado com sucesso', user: updatedUser })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const getUserProducts = async (req, res) => {
  try {
    const { id } = req.params
    console.log('getUserProducts - Token:', req.cookies.token)
    console.log('getUserProducts - req.user antes da verificação:', req.user)

    if (!req.user || !req.user.id) {
      console.log('req.user não definido:', req.user)
      return res.status(401).json({ error: 'Autenticação inválida ou ausente' })
    }

    const requestingUser = await UserModel.findById(req.user.id)
    if (!requestingUser) {
      return res
        .status(401)
        .json({ error: 'Usuário autenticado não encontrado' })
    }

    if (parseInt(id) !== req.user.id && !requestingUser.isAdmin) {
      return res.status(403).json({
        error: 'Acesso negado: você só pode ver seus próprios produtos',
      })
    }

    const user = await UserModel.findById(id)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })

    const products = await ProductModel.findByUserId(id)
    res.json({ user, products })
  } catch (error) {
    console.error('Erro ao buscar produtos do usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body
    if (!productId)
      return res.status(400).json({ error: 'productId é obrigatório' })

    const favorite = await FavoriteModel.create(req.user.id, productId)
    res.status(201).json(favorite)
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params
    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: 'productId inválido' })
    }

    const existingFavorite = await FavoriteModel.findOne(
      req.user.id,
      parseInt(productId)
    )
    if (!existingFavorite) {
      return res.status(404).json({ error: 'Favorito não encontrado' })
    }

    await FavoriteModel.delete(req.user.id, parseInt(productId))
    res.json({ message: 'Produto removido dos favoritos' })
  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteModel.findByUserId(req.user.id)
    res.json(favorites)
  } catch (error) {
    console.error('Erro ao listar favoritos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
