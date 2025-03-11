import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserModel } from '../models/user.js'
import { config } from '../config/server.js'
import { processProfileImage } from '../utils/imageProcessing.js'

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    const existingUser = await UserModel.findByEmail(email)
    if (existingUser)
      return res.status(400).json({ error: 'E-mail já cadastrado' })

    const hashedPassword = await bcrypt.hash(password, 12)
    let profilePicture = req.file ? await processProfileImage(req.file) : null

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      profilePicture,
    })

    res
      .status(201)
      .json({ message: 'Usuário registrado com sucesso', user: newUser })
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await UserModel.findByEmail(email)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    const token = jwt.sign({ id: user.id }, config.SECRET_KEY, {
      expiresIn: '1h',
    })
    res.cookie('token', token, {
      httpOnly: true, // Impede acesso via JavaScript
      secure: process.env.NODE_ENV === 'production', // True em produção com HTTPS
      sameSite: 'Lax', // 'Lax' permite envio em navegação, ajuste para 'Strict' se necessário
      maxAge: 3600000, // 1 hora em milissegundos
    })
    res.json({
      message: 'Login bem-sucedido',
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
