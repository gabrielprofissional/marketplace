import prisma from '../config/database.js'

export const FavoriteModel = {
  create: async (userId, productId) => {
    return prisma.favorite.create({
      data: { userId: parseInt(userId), productId: parseInt(productId) },
    })
  },
  delete: async (userId, productId) => {
    return prisma.favorite.delete({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId),
        },
      },
    })
  },
  findByUserId: async (userId) => {
    return prisma.favorite.findMany({
      where: { userId: parseInt(userId) },
      include: { product: true },
    })
  },
  findOne: async (userId, productId) => {
    return prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId),
        },
      },
    })
  },
}
