import { promises as fs } from 'fs' // Única importação de fs usando promises
import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import Joi from 'joi'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { updateSettings } from './project-root/backend/src/controllers/adminController.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const prisma = new PrismaClient()
const SECRET_KEY = process.env.SECRET_KEY || 'sua_chave_secreta_forte'

// Configuração do Multer
const upload = multer({ dest: 'uploads/' })

// Configuração robusta de CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
app.put(
  '/admin/settings',
  authenticateAdmin,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  updateSettings
)

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'http://localhost:5000'],
      },
    },
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
app.use(cors(corsOptions))
/*app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições, tente novamente mais tarde',
}));*/
app.use(express.json())
app.use(cookieParser())

app.use(
  '/uploads',
  (req, res, next) => {
    console.log('Acessando /uploads:', req.path)
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    next()
  },
  express.static(path.join(__dirname, 'uploads'))
)

// Validação de dados do produto
const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(500).required(),
  price: Joi.number().positive().required(),
})

// Middleware para verificar autenticação
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Acesso negado' })

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(403).json({ error: 'Usuário não encontrado' })
    if (user.isBanned) {
      const now = new Date()
      if (!user.bannedUntil || user.bannedUntil > now) {
        return res
          .status(403)
          .json({ error: `Você está banido: ${user.banReason}` })
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { isBanned: false, banReason: null, bannedUntil: null },
        })
      }
    }
    req.user = user
    next()
  } catch (err) {
    console.error('Erro ao verificar token:', err)
    return res.status(403).json({ error: 'Token inválido' })
  }
}

// Middleware para verificar se é admin
const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Acesso negado' })

  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isAdmin: true },
    })

    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito a administradores' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Erro ao verificar admin:', err)
    return res.status(403).json({ error: 'Token inválido ou acesso negado' })
  }
}

// Registro de usuário
app.post('/register', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body
    console.log('Dados recebidos para registro:', { name, email, password })
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    let profilePicture = null

    if (req.file) {
      const imageFilename = req.file.filename
      const uniqueFilenameBase = imageFilename.replace(
        path.extname(imageFilename),
        ''
      )
      const resizedFilename = `${uniqueFilenameBase}_profile.jpg`
      const resizedFilePath = path.join(__dirname, 'uploads', resizedFilename)

      await sharp(req.file.path)
        .toFormat('jpeg')
        .resize(200, 200, { fit: 'cover' })
        .toFile(resizedFilePath)

      await fs.unlink(req.file.path)
      profilePicture = resizedFilename
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        profilePicture,
      },
    })

    res
      .status(201)
      .json({ message: 'Usuário registrado com sucesso', user: newUser })
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Login de usuário
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta' })
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: '15m',
    })
    const refreshToken = jwt.sign({ id: user.id }, SECRET_KEY, {
      expiresIn: '7d',
    })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    })
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    console.log('Usuário logado:', { id: user.id, email: user.email })
    console.log('Token gerado:', token)
    res.status(200).json({ message: 'Login bem-sucedido', user })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter dados do usuário autenticado
app.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, profilePicture: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    res.json(user)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Atualizar perfil (nome, email e/ou foto de perfil)
app.put(
  '/me',
  authenticateToken,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      const { name, email } = req.body
      let updatedData = {}

      if (name) updatedData.name = name
      if (email) {
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ error: 'E-mail já está em uso' })
        }
        updatedData.email = email
      }

      if (req.file) {
        const imageFilename = req.file.filename
        const uniqueFilenameBase = imageFilename.replace(
          path.extname(imageFilename),
          ''
        )
        const resizedFilename = `${uniqueFilenameBase}_profile.jpg`
        const resizedFilePath = path.join(__dirname, 'uploads', resizedFilename)

        await sharp(req.file.path)
          .toFormat('jpeg')
          .resize(200, 200, { fit: 'cover' })
          .toFile(resizedFilePath)

        await fs.unlink(req.file.path)

        const currentUser = await prisma.user.findUnique({
          where: { id: req.user.id },
        })
        if (currentUser.profilePicture) {
          await fs.unlink(
            path.join(__dirname, 'uploads', currentUser.profilePicture)
          )
        }

        updatedData.profilePicture = resizedFilename
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updatedData,
        select: { id: true, name: true, email: true, profilePicture: true },
      })

      res.json({ message: 'Perfil atualizado com sucesso', user: updatedUser })
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
)

// Renovação de token
app.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken
  if (!refreshToken)
    return res.status(401).json({ error: 'Refresh token não fornecido' })

  jwt.verify(refreshToken, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Refresh token inválido' })
    const newToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: '15m',
    })
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    })
    res.json({ message: 'Token renovado' })
  })
})

// Listar produtos com filtros avançados
app.get('/products', async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0
    const limit = parseInt(req.query.limit) || 10
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null
    const sort = req.query.sort || 'created_at'

    const where = {}
    if (minPrice) where.price = { gte: minPrice }
    if (maxPrice) where.price = { ...where.price, lte: maxPrice }

    const orderBy = sort.startsWith('-')
      ? { [sort.slice(1)]: 'desc' }
      : { [sort]: 'asc' }

    const products = await prisma.product.findMany({
      skip: offset,
      take: limit,
      where,
      orderBy,
      include: { user: { select: { id: true, name: true } } },
    })
    const total = await prisma.product.count({ where })

    res.json({ products, total, offset, limit })
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Detalhes de um produto específico
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log('Buscando detalhes do produto:', id)
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' })
    }
    res.json(product)
  } catch (error) {
    console.error('Erro ao buscar detalhes do produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Produtos de um usuário específico (perfil do vendedor)
app.get('/users/:id/products', async (req, res) => {
  try {
    const { id } = req.params
    console.log('Buscando produtos do usuário:', id)
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, email: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }
    const products = await prisma.product.findMany({
      where: { userId: parseInt(id) },
    })
    res.json({ user, products })
  } catch (error) {
    console.error('Erro ao buscar produtos do usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Adicionar produto (protegido)
app.post(
  '/products',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, description, price } = req.body
      console.log('Dados recebidos:', { name, description, price })
      const { error } = productSchema.validate({ name, description, price })
      if (error) {
        console.log('Erro de validação:', error.details)
        return res.status(400).json({ error: error.details[0].message })
      }

      if (!req.file) {
        console.log('Nenhum arquivo enviado')
        return res.status(400).json({ error: 'Imagem é obrigatória' })
      }

      const userExists = await prisma.user.findUnique({
        where: { id: req.user.id },
      })
      if (!userExists) {
        console.log('Usuário não encontrado:', req.user.id)
        return res
          .status(403)
          .json({ error: 'Usuário associado ao token não encontrado' })
      }

      const imageFilename = req.file.filename
      const uniqueFilenameBase = imageFilename.replace(
        path.extname(imageFilename),
        ''
      )
      const resizedFilename = `${uniqueFilenameBase}.jpg`
      const resizedFilePath = path.join(__dirname, 'uploads', resizedFilename)

      console.log('Processando imagem:', req.file.path, '->', resizedFilePath)
      await sharp(req.file.path)
        .toFormat('jpeg')
        .resize(500, 500)
        .toFile(resizedFilePath)

      await fs.unlink(req.file.path) // Removido o setTimeout

      const parsedPrice = parseFloat(price)
      if (isNaN(parsedPrice)) {
        console.log('Preço inválido:', price)
        throw new Error('Preço inválido')
      }

      const newProduct = await prisma.product.create({
        data: {
          name,
          description,
          price: parsedPrice,
          image: resizedFilename,
          userId: req.user.id,
        },
      })

      res.status(201).json({
        message: 'Produto adicionado com sucesso',
        product: newProduct,
      })
    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
)

// Editar produto (protegido, apenas dono)
app.put(
  '/products/:id',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params
      const { name, description, price } = req.body
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id) },
      })

      if (!product)
        return res.status(404).json({ error: 'Produto não encontrado' })
      if (product.userId !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'Você não tem permissão para editar este produto' })
      }

      let updatedData = { name, description, price: parseFloat(price) }
      if (req.file) {
        const imageFilename = req.file.filename
        const uniqueFilenameBase = imageFilename.replace(
          path.extname(imageFilename),
          ''
        )
        const resizedFilename = `${uniqueFilenameBase}.jpg`
        const resizedFilePath = path.join(__dirname, 'uploads', resizedFilename)

        await sharp(req.file.path)
          .toFormat('jpeg')
          .resize(500, 500)
          .toFile(resizedFilePath)

        await fs.unlink(req.file.path) // Removido o setTimeout
        await fs.unlink(path.join(__dirname, 'uploads', product.image))
        updatedData.image = resizedFilename
      }

      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: updatedData,
      })

      res.json({
        message: 'Produto atualizado com sucesso',
        product: updatedProduct,
      })
    } catch (error) {
      console.error('Erro ao editar produto:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
)

// Excluir produto (protegido, apenas dono)
app.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    })

    if (!product)
      return res.status(404).json({ error: 'Produto não encontrado' })
    if (product.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Você não tem permissão para excluir este produto' })
    }

    const filePath = path.join(__dirname, 'uploads', product.image)
    console.log('Tentando excluir arquivo:', filePath)

    // Verifica e exclui o arquivo, se existir
    try {
      await fs.access(filePath)
      await fs.unlink(filePath)
      console.log('Arquivo excluído com sucesso:', filePath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn('Arquivo não encontrado, prosseguindo:', filePath)
      } else {
        throw err
      }
    }

    // Exclui todos os favoritos associados ao produto
    await prisma.favorite.deleteMany({
      where: { productId: parseInt(id) },
    })
    console.log(`Favoritos associados ao produto ${id} excluídos.`)

    // Exclui o produto
    await prisma.product.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar todos os usuários (admin)
app.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        isBanned: true,
        banReason: true,
        bannedUntil: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            created_at: true,
          },
        },
      },
    })
    res.json(users)
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Banir usuário (permanente ou temporário)
app.post('/admin/users/:id/ban', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { duration, reason } = req.body

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    if (user.isAdmin)
      return res
        .status(403)
        .json({ error: 'Não é possível banir outro administrador' })

    const banData = {
      isBanned: true,
      banReason: reason || 'Violação das regras do marketplace',
      bannedUntil: duration
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : null,
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: banData,
    })

    res.json({ message: 'Usuário banido com sucesso', user: updatedUser })
  } catch (error) {
    console.error('Erro ao banir usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Remover banimento de usuário
app.post('/admin/users/:id/unban', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    if (!user.isBanned)
      return res.status(400).json({ error: 'Usuário não está banido' })

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned: false, banReason: null, bannedUntil: null },
    })

    res.json({ message: 'Banimento removido com sucesso', user: updatedUser })
  } catch (error) {
    console.error('Erro ao remover banimento:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Remover produto com justificativa (admin)
// Remover produto com justificativa (admin)
app.delete('/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    })
    if (!product)
      return res.status(404).json({ error: 'Produto não encontrado' })

    const filePath = path.join(__dirname, 'uploads', product.image)
    console.log('Tentando excluir arquivo:', filePath)

    // Verifica e exclui o arquivo, se existir
    try {
      await fs.access(filePath)
      await fs.unlink(filePath)
      console.log('Arquivo excluído com sucesso:', filePath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(
          'Arquivo não encontrado, prosseguindo com a exclusão do produto:',
          filePath
        )
      } else {
        throw err
      }
    }

    // Exclui os favoritos associados ao produto
    await prisma.favorite.deleteMany({
      where: { productId: parseInt(id) },
    })
    console.log(`Favoritos associados ao produto ${id} excluídos.`)

    // Exclui o produto do banco de dados
    await prisma.product.delete({ where: { id: parseInt(id) } })

    console.log(
      `Produto ${id} removido. Justificativa enviada para ${product.user.email}: ${reason}`
    )
    res.json({ message: 'Produto removido com sucesso', reason })
  } catch (error) {
    console.error('Erro ao remover produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})
const conditionalUpload = (req, res, next) => {
  if (
    req.headers['content-type'] &&
    req.headers['content-type'].includes('multipart/form-data')
  ) {
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'favicon', maxCount: 1 },
    ])(req, res, next)
  } else {
    next() // Pula o multer para requisições JSON
  }
}

// Obter configurações atuais (admin)
app.put(
  '/admin/settings',
  authenticateAdmin,
  conditionalUpload,
  async (req, res) => {
    try {
      let settings = await prisma.settings.findFirst()
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            siteName: 'Marketplace',
            logoUrl: null,
            faviconUrl: null,
          },
        })
      }
      res.json(settings)
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      res.status(500).json({ error: 'Erro interno do servidor' })
    }
  }
)

// Atualizar configurações (nome do site, logo e favicon)
// Atualizar configurações (nome do site, logo e favicon)
// Atualizar configurações (nome do site, logo e favicon)
// Atualizar configurações (nome do site, logo e favicon)
const path = require('path')
const fs = require('fs').promises
const sharp = require('sharp')

app.put(
  '/admin/settings',
  authenticateAdmin,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('Requisição recebida:', { body: req.body, files: req.files })
      console.log('Tipo de conteúdo:', req.headers['content-type'])

      const { siteName, logoUrl, faviconUrl } = req.body
      const files = req.files || {}
      console.log('Files após inicialização:', files)

      let settings = await prisma.settings.findFirst()
      if (!settings) {
        console.log('Nenhuma configuração encontrada, criando nova...')
        settings = await prisma.settings.create({
          data: { siteName: 'Marketplace' },
        })
      }

      const updatedData = {}

      // Nome do site
      if (siteName !== undefined) {
        console.log('Atualizando siteName para:', siteName)
        updatedData.siteName = siteName === '' ? null : siteName
      }

      // Logo
      console.log('Verificando logo... files.logo:', files.logo)
      if (files && files.logo && Array.isArray(files.logo) && files.logo[0]) {
        console.log('Processando novo logo...')
        const logoFile = files.logo[0]
        const logoFilename = `${logoFile.filename}_logo.png`
        const logoPath = path.join(__dirname, 'uploads', logoFilename)
        await sharp(logoFile.path)
          .toFormat('png')
          .resize(200, 200, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFile(logoPath)
        await fs.unlink(logoFile.path)

        if (settings.logoUrl) {
          const oldLogoPath = path.join(__dirname, 'uploads', settings.logoUrl)
          try {
            await fs.access(oldLogoPath)
            await fs.unlink(oldLogoPath)
            console.log('Logo antigo excluído:', oldLogoPath)
          } catch (err) {
            if (err.code !== 'ENOENT') throw err
            console.warn('Logo antigo não encontrado:', oldLogoPath)
          }
        }
        updatedData.logoUrl = logoFilename
      } else if (logoUrl === 'null') {
        console.log('Removendo logo...')
        if (settings.logoUrl) {
          const oldLogoPath = path.join(__dirname, 'uploads', settings.logoUrl)
          try {
            await fs.access(oldLogoPath)
            await fs.unlink(oldLogoPath)
            console.log('Logo excluído com sucesso:', oldLogoPath)
          } catch (err) {
            if (err.code !== 'ENOENT') throw err
            console.warn('Logo antigo não encontrado:', oldLogoPath)
          }
        }
        updatedData.logoUrl = null
      }

      // Favicon
      console.log('Verificando favicon... files.favicon:', files.favicon)
      if (
        files &&
        files.favicon &&
        Array.isArray(files.favicon) &&
        files.favicon[0]
      ) {
        console.log('Processando novo favicon...')
        const faviconFile = files.favicon[0]
        const faviconFilename = `${faviconFile.filename}_favicon.png`
        const faviconPath = path.join(__dirname, 'uploads', faviconFilename)
        await sharp(faviconFile.path)
          .toFormat('png')
          .resize(32, 32, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .toFile(faviconPath)
        await fs.unlink(faviconFile.path)

        if (settings.faviconUrl) {
          const oldFaviconPath = path.join(
            __dirname,
            'uploads',
            settings.faviconUrl
          )
          try {
            await fs.access(oldFaviconPath)
            await fs.unlink(oldFaviconPath)
            console.log('Favicon antigo excluído:', oldFaviconPath)
          } catch (err) {
            if (err.code !== 'ENOENT') throw err
            console.warn('Favicon antigo não encontrado:', oldFaviconPath)
          }
        }
        updatedData.faviconUrl = faviconFilename
      } else if (faviconUrl === 'null') {
        console.log('Removendo favicon...')
        if (settings.faviconUrl) {
          const oldFaviconPath = path.join(
            __dirname,
            'uploads',
            settings.faviconUrl
          )
          try {
            await fs.access(oldFaviconPath)
            await fs.unlink(oldFaviconPath)
            console.log('Favicon excluído com sucesso:', oldFaviconPath)
          } catch (err) {
            if (err.code !== 'ENOENT') throw err
            console.warn('Favicon antigo não encontrado:', oldFaviconPath)
          }
        }
        updatedData.faviconUrl = null
      }

      if (Object.keys(updatedData).length > 0) {
        console.log('Dados a serem atualizados:', updatedData)
        const updatedSettings = await prisma.settings.update({
          where: { id: settings.id },
          data: updatedData,
        })
        console.log('Configurações atualizadas:', updatedSettings)
        res.json({
          message: 'Configurações atualizadas com sucesso',
          settings: updatedSettings,
        })
      } else {
        console.log('Nenhum dado para atualizar')
        res.json({ message: 'Nenhuma alteração realizada', settings })
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      res
        .status(500)
        .json({ error: 'Erro interno do servidor', details: error.message })
    }
  }
)
app.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body
    console.log('Adicionando favorito:', { userId: req.user.id, productId })
    if (!productId) {
      return res.status(400).json({ error: 'productId é obrigatório' })
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        productId: parseInt(productId),
      },
    })
    res.status(201).json(favorite)
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Remover produto dos favoritos
app.delete('/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params
    console.log('Removendo favorito:', { userId: req.user.id, productId })

    if (!productId || isNaN(parseInt(productId))) {
      console.log('productId inválido:', productId)
      return res.status(400).json({ error: 'productId inválido' })
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: parseInt(productId),
        },
      },
    })

    if (!existingFavorite) {
      console.log('Favorito não encontrado:', {
        userId: req.user.id,
        productId,
      })
      return res.status(404).json({ error: 'Favorito não encontrado' })
    }

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: parseInt(productId),
        },
      },
    })

    console.log('Favorito removido com sucesso:', {
      userId: req.user.id,
      productId,
    })
    res.json({ message: 'Produto removido dos favoritos' })
  } catch (error) {
    console.error('Erro ao remover favorito:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar favoritos
app.get('/favorites', authenticateToken, async (req, res) => {
  try {
    console.log('Buscando favoritos para usuário:', req.user.id)
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    })
    res.json(favorites)
  } catch (error) {
    console.error('Erro ao listar favoritos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar categorias
app.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany()
    res.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
})

// Iniciar o servidor
const PORT = 5000
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})
