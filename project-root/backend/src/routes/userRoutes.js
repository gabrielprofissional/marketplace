import { Router } from 'express'
import {
  getMe,
  updateMe,
  getUserProducts,
  addFavorite,
  removeFavorite,
  getFavorites,
} from '../controllers/userController.js'
import { authenticateToken } from '../middlewares/auth.js'

const router = Router()

router.get('/me', authenticateToken, getMe)
router.put('/me', authenticateToken, updateMe)
router.get('/:id/products', authenticateToken, getUserProducts) // Confirme esta linha
router.post('/favorites', authenticateToken, addFavorite)
router.delete('/favorites/:productId', authenticateToken, removeFavorite)
router.get('/favorites', authenticateToken, getFavorites)

export default router
