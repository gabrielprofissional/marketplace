import { ProductModel } from '../models/product.js'
import { UserModel } from '../models/user.js'
import { promises as fs } from 'fs'
import path from 'path'
import { config } from '../config/server.js'
import { processProductImage } from '../utils/imageProcessing.js'

export const getProducts = async (req, res) => {
  try {
    const { offset, limit, minPrice, maxPrice, sort } = req.query
    const { products, total } = await ProductModel.findMany({
      offset,
      limit,
      minPrice,
      maxPrice,
      sort,
    })
    res.json({
      products,
      total,
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 10,
    })
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    const product = await ProductModel.findById(id)
    if (!product)
      return res.status(404).json({ error: 'Produto não encontrado' })
    res.json(product)
  } catch (error) {
    console.error('Erro ao buscar detalhes do produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body
    if (!req.file)
      return res.status(400).json({ error: 'Imagem é obrigatória' })

    const userExists = await UserModel.findById(req.user.id)
    if (!userExists)
      return res
        .status(403)
        .json({ error: 'Usuário associado ao token não encontrado' })

    const image = await processProductImage(req.file)
    const parsedPrice = parseFloat(price)

    const newProduct = await ProductModel.create({
      name,
      description,
      price: parsedPrice,
      image,
      userId: req.user.id,
    })

    res
      .status(201)
      .json({ message: 'Produto adicionado com sucesso', product: newProduct })
  } catch (error) {
    console.error('Erro ao adicionar produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await ProductModel.findById(id)
    if (!product)
      return res.status(404).json({ error: 'Produto não encontrado' })

    const user = await UserModel.findById(req.user.id)
    if (product.userId !== req.user.id && !user.isAdmin) {
      return res
        .status(403)
        .json({ error: 'Você não tem permissão para excluir este produto' })
    }

    if (product.image) {
      await fs.unlink(path.join(config.uploadPath, product.image))
    }

    await ProductModel.delete(id)
    res.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

// Adicionando a função updateProduct
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price } = req.body

    const product = await ProductModel.findById(id)
    if (!product)
      return res.status(404).json({ error: 'Produto não encontrado' })

    // Verifica se o usuário é o dono do produto ou admin
    const user = await UserModel.findById(req.user.id)
    if (product.userId !== req.user.id && !user.isAdmin) {
      return res
        .status(403)
        .json({ error: 'Você não tem permissão para atualizar este produto' })
    }

    // Dados a serem atualizados
    let updatedData = {}
    if (name) updatedData.name = name
    if (description) updatedData.description = description
    if (price) updatedData.price = parseFloat(price)

    // Atualiza a imagem, se fornecida
    if (req.file) {
      if (product.image) {
        await fs.unlink(path.join(config.uploadPath, product.image)) // Remove a imagem antiga
      }
      updatedData.image = await processProductImage(req.file)
    }

    const updatedProduct = await ProductModel.update(id, updatedData)
    res.json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct,
    })
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
