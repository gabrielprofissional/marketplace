import express from 'express'
import multer from 'multer'
import { authenticateAdmin } from '../middlewares/auth.js'
import {
  getUsers,
  banUser,
  unbanUser,
  deleteProductAdmin,
  getSettings,
  updateSettings,
} from '../controllers/adminController.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

router.get('/users', authenticateAdmin, getUsers)
router.post('/users/:id/ban', authenticateAdmin, banUser)
router.post('/users/:id/unban', authenticateAdmin, unbanUser)
router.delete('/products/:id', authenticateAdmin, deleteProductAdmin)
router.get('/settings', getSettings) // Sem authenticateAdmin
router.put(
  '/settings',
  authenticateAdmin,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
  ]),
  updateSettings
)

export default router
