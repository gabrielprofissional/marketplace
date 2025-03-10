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
    const { siteName } = req.body
    const files = req.files
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      settings = await prisma.settings.create({
        data: { siteName: 'Marketplace' },
      })
    }

    const updatedData = {}
    if (siteName) updatedData.siteName = siteName

    if (files.logo) {
      const logoFile = files.logo[0]
      const logoFilename = `${logoFile.filename}_logo.png`
      const logoPath = path.join(config.uploadPath, logoFilename)
      await sharp(logoFile.path)
        .toFormat('png')
        .resize(200, 200, { fit: 'contain' })
        .toFile(logoPath)
      await fs.unlink(logoFile.path)
      if (settings.logoUrl)
        await fs.unlink(path.join(config.uploadPath, settings.logoUrl))
      updatedData.logoUrl = logoFilename
    }

    if (files.favicon) {
      const faviconFile = files.favicon[0]
      const faviconFilename = `${faviconFile.filename}_favicon.png`
      const faviconPath = path.join(config.uploadPath, faviconFilename)
      await sharp(faviconFile.path)
        .toFormat('png')
        .resize(32, 32, { fit: 'contain' })
        .toFile(faviconPath)
      await fs.unlink(faviconFile.path)
      if (settings.faviconUrl)
        await fs.unlink(path.join(config.uploadPath, settings.faviconUrl))
      updatedData.faviconUrl = faviconFilename
    }

    const updatedSettings = await prisma.settings.update({
      where: { id: settings.id },
      data: updatedData,
    })

    res.json({
      message: 'Configurações atualizadas com sucesso',
      settings: updatedSettings,
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
