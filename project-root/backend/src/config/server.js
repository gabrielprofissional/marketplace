import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const config = {
  SECRET_KEY: process.env.SECRET_KEY || 'sua_chave_secreta_forte',
  __dirname,
  corsOptions: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  uploadPath: path.join(__dirname, '..', '..', '..', 'uploads'), // Ajustado para subir 3 níveis até project-root/
}
