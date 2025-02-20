import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// Configuração do Multer para uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve arquivos da pasta uploads em /uploads

// Registro de usuário
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({ message: 'Usuário registrado com sucesso', user: newUser });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login de usuário
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        res.status(200).json({ message: 'Login bem-sucedido', user });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Listar produtos (GET /products)
app.get('/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Adicionar produto (POST /products)
app.post('/products', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const imageFilename = req.file.filename;
        const uniqueFilenameBase = imageFilename.replace(path.extname(imageFilename), '');
        const resizedFilename = `${uniqueFilenameBase}.jpg`;

        const resizedFilePath = path.join(__dirname, 'uploads', resizedFilename);

        console.log('Arquivo original:', req.file.path);
        console.log('Novo nome do arquivo:', resizedFilename);

        await sharp(req.file.path)
            .resize(500, 500)
            .jpeg()
            .toFile(resizedFilePath);

        console.log('Arquivo redimensionado salvo em:', resizedFilePath);

        await fs.unlink(req.file.path);

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                image: resizedFilename,
            },
        });

        res.status(201).json({ message: 'Produto adicionado com sucesso', product: newProduct });
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Inicializa o servidor na porta 5000
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});