import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'
import { config } from '../config/server.js'

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token
  console.log('Token recebido em authenticateToken:', token)
  if (!token) return res.status(401).json({ error: 'Acesso negado' })

  try {
    const decoded = jwt.verify(token, config.SECRET_KEY)
    console.log('Token decodificado:', decoded)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return res.status(403).json({ error: 'Usuário não encontrado' })
    if (user.isBanned) {
      const now = new Date()
      if (!user.bannedUntil || user.bannedUntil > now) {
        return res
          .status(403)
          .json({ error: `Você está banido: ${user.banReason}` })
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { isBanned: false, banReason: null, bannedUntil: null },
      })
    }
    req.user = user // Certifique-se de que req.user é definido aqui
    console.log('req.user definido:', req.user) // Log para verificar
    next()
  } catch (err) {
    console.error('Erro ao verificar token:', err)
    return res.status(403).json({ error: 'Token inválido' })
  }
}

export const authenticateAdmin = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Acesso negado' })

  try {
    const decoded = jwt.verify(token, config.SECRET_KEY)
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
