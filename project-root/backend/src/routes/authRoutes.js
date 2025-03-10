import express from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import { register, login } from '../controllers/authController.js'
import { config } from '../config/server.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.post('/register', upload.single('profilePicture'), register)
router.post('/login', login)
router.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken
  if (!refreshToken)
    return res.status(401).json({ error: 'Refresh token não fornecido' })

  jwt.verify(refreshToken, config.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Refresh token inválido' })
    const newToken = jwt.sign(
      { id: user.id, email: user.email },
      config.SECRET_KEY,
      { expiresIn: '15m' }
    )
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    })
    res.json({ message: 'Token renovado' })
  })
})

export default router
