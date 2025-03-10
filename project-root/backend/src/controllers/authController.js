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
  try {
    const { email, password } = req.body
    const user = await UserModel.findByEmail(email)
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid)
      return res.status(401).json({ error: 'Senha incorreta' })

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.SECRET_KEY,
      { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign({ id: user.id }, config.SECRET_KEY, {
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

    res.status(200).json({ message: 'Login bem-sucedido', user })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
