import express from 'express'
import multer from 'multer'
import { authenticateToken } from '../middlewares/auth.js'
import {
  getMe,
  updateMe,
  getUserProducts,
  addFavorite,
  removeFavorite,
  getFavorites,
} from '../controllers/userController.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.get('/me', authenticateToken, getMe)
router.put('/me', authenticateToken, upload.single('profilePicture'), updateMe)
router.get('/users/:id/products', getUserProducts)
router.post('/favorites', authenticateToken, addFavorite)
router.delete('/favorites/:productId', authenticateToken, removeFavorite)
router.get('/favorites', authenticateToken, getFavorites)

export default router
