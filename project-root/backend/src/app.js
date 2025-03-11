import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from './config/server.js' // Caminho relativo dentro de backend/src/
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()
app.use(
  cors({
    origin: 'http://localhost:5173', // Porta do frontend (ajuste se necessário)
    credentials: true, // Permite cookies em todas as rotas
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  })
)
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
app.use(cors(config.corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(config.uploadPath))

app.use('/', authRoutes)
app.use('/products', productRoutes)
app.use('/users', userRoutes)
app.use('/', userRoutes)
app.use('/admin', adminRoutes)

const PORT = 5000
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})

export default app
