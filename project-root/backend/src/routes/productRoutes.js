import express from 'express'
import multer from 'multer'
import { authenticateToken } from '../middlewares/auth.js'
import { validateProduct } from '../middlewares/validation.js'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.get('/', getProducts)
router.get('/:id', getProductById)
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  validateProduct,
  createProduct
)
router.put('/:id', authenticateToken, upload.single('image'), updateProduct)
router.delete('/:id', authenticateToken, deleteProduct)

export default router
