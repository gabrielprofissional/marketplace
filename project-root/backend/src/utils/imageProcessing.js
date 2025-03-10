import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { config } from '../config/server.js'

export const processProfileImage = async (file) => {
  const imageFilename = file.filename
  const uniqueFilenameBase = imageFilename.replace(
    path.extname(imageFilename),
    ''
  )
  const resizedFilename = `${uniqueFilenameBase}_profile.jpg`
  const resizedFilePath = path.join(config.uploadPath, resizedFilename)

  await sharp(file.path)
    .toFormat('jpeg')
    .resize(200, 200, { fit: 'cover' })
    .toFile(resizedFilePath)
  await fs.unlink(file.path)

  return resizedFilename
}

export const processProductImage = async (file) => {
  const imageFilename = file.filename
  const uniqueFilenameBase = imageFilename.replace(
    path.extname(imageFilename),
    ''
  )
  const resizedFilename = `${uniqueFilenameBase}.jpg`
  const resizedFilePath = path.join(config.uploadPath, resizedFilename)

  await sharp(file.path)
    .toFormat('jpeg')
    .resize(500, 500)
    .toFile(resizedFilePath)
  await fs.unlink(file.path)

  return resizedFilename
}
