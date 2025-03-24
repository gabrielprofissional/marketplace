import prisma from '../config/database.js'
import { UserModel } from '../models/user.js'
import { promises as fs } from 'fs'
import path from 'path'
import { SettingsModel } from '../models/settings.js'
import { config } from '../config/server.js'
import sharp from 'sharp'

export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll()
    res.json(users)
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const banUser = async (req, res) => {
  try {
    const { id } = req.params
    const { duration, reason } = req.body

    const user = await UserModel.findById(id)
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    if (user.isAdmin)
      return res
        .status(403)
        .json({ error: 'Não é possível banir outro administrador' })

    const banData = {
      isBanned: true,
      banReason: reason || 'Violação das regras do marketplace',
      bannedUntil: duration
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : null,
    }

    const updatedUser = await UserModel.update(id, banData)
    res.json({ message: 'Usuário banido com sucesso', user: updatedUser })
  } catch (error) {
    console.error('Erro ao banir usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    if (!user.isBanned)
      return res.status(400).json({ error: 'Usuário não está banido' })

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned: false, banReason: null, bannedUntil: null },
    })

    res.json({ message: 'Banimento removido com sucesso', user: updatedUser })
  } catch (error) {
    console.error('Erro ao remover banimento:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const deleteProductAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    })
    if (!product)
      return res.status(404).json({ error: 'Produto não encontrado' })

    const filePath = path.join(config.uploadPath, product.image)
    try {
      await fs.access(filePath)
      await fs.unlink(filePath)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }

    await prisma.favorite.deleteMany({ where: { productId: parseInt(id) } })
    await prisma.product.delete({ where: { id: parseInt(id) } })

    res.json({ message: 'Produto removido com sucesso', reason })
  } catch (error) {
    console.error('Erro ao remover produto:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const getSettings = async (req, res) => {
  try {
    const settings = await SettingsModel.getOrCreate()
    res.json(settings)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}

export const updateSettings = async (req, res) => {
  try {
    console.log('Requisição recebida:', { body: req.body, files: req.files })

    const { siteName, logoUrl, faviconUrl } = req.body
    const files = req.files || {} // Garante que files seja um objeto vazio se undefined
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      console.log('Nenhuma configuração encontrada, criando nova...')
      settings = await prisma.settings.create({
        data: { siteName: '' },
      })
    }

    const updatedData = {}

    // Nome do site
    if (siteName !== undefined) {
      console.log('Atualizando siteName para:', siteName)
      updatedData.siteName = siteName === '' ? null : siteName
    }

    // Logo: verifica remoção ou upload
    if (logoUrl === 'null') {
      console.log('Removendo logo...')
      if (settings.logoUrl) {
        const oldLogoPath = path.join(config.uploadPath, settings.logoUrl)
        try {
          await fs.access(oldLogoPath)
          await fs.unlink(oldLogoPath)
          console.log('Logo excluído com sucesso:', oldLogoPath)
        } catch (err) {
          if (err.code !== 'ENOENT') console.warn('Erro ao excluir logo:', err)
          else console.log('Logo antigo não encontrado, prosseguindo...')
        }
      }
      updatedData.logoUrl = null
    } else if (
      files.logo &&
      Array.isArray(files.logo) &&
      files.logo.length > 0
    ) {
      console.log('Processando novo logo...')
      const logoFile = files.logo[0]
      const logoFilename = `${logoFile.filename}_logo.png`
      const logoPath = path.join(config.uploadPath, logoFilename)
      await sharp(logoFile.path)
        .toFormat('png')
        .resize(200, 200, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFile(logoPath)
      await fs.unlink(logoFile.path)

      if (settings.logoUrl) {
        const oldLogoPath = path.join(config.uploadPath, settings.logoUrl)
        try {
          await fs.unlink(oldLogoPath)
          console.log('Logo antigo excluído:', oldLogoPath)
        } catch (err) {
          console.log('Logo antigo não encontrado ou erro:', err)
        }
      }
      updatedData.logoUrl = logoFilename
    }

    // Favicon: verifica remoção ou upload
    if (faviconUrl === 'null') {
      console.log('Removendo favicon...')
      if (settings.faviconUrl) {
        const oldFaviconPath = path.join(config.uploadPath, settings.faviconUrl)
        try {
          await fs.access(oldFaviconPath)
          await fs.unlink(oldFaviconPath)
          console.log('Favicon excluído com sucesso:', oldFaviconPath)
        } catch (err) {
          if (err.code !== 'ENOENT')
            console.warn('Erro ao excluir favicon:', err)
          else console.log('Favicon antigo não encontrado, prosseguindo...')
        }
      }
      updatedData.faviconUrl = null
    } else if (
      files.favicon &&
      Array.isArray(files.favicon) &&
      files.favicon.length > 0
    ) {
      console.log('Processando novo favicon...')
      const faviconFile = files.favicon[0]
      const faviconFilename = `${faviconFile.filename}_favicon.png`
      const faviconPath = path.join(config.uploadPath, faviconFilename)
      await sharp(faviconFile.path)
        .toFormat('png')
        .resize(32, 32, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toFile(faviconPath)
      await fs.unlink(faviconFile.path)

      if (settings.faviconUrl) {
        const oldFaviconPath = path.join(config.uploadPath, settings.faviconUrl)
        try {
          await fs.unlink(oldFaviconPath)
          console.log('Favicon antigo excluído:', oldFaviconPath)
        } catch (err) {
          console.log('Favicon antigo não encontrado ou erro:', err)
        }
      }
      updatedData.faviconUrl = faviconFilename
    }

    if (Object.keys(updatedData).length > 0) {
      console.log('Dados a serem atualizados:', updatedData)
      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: updatedData,
      })
      console.log('Configurações atualizadas:', updatedSettings)
      res.json({
        message: 'Configurações atualizadas com sucesso',
        settings: updatedSettings,
      })
    } else {
      console.log('Nenhum dado para atualizar')
      res.json({ message: 'Nenhuma alteração realizada', settings })
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    res
      .status(500)
      .json({ error: 'Erro interno do servidor', details: error.message })
  }
}
