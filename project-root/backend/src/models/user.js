import prisma from '../config/database.js'

export const UserModel = {
  findById: async (id) => {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        isAdmin: true,
        isBanned: true,
        banReason: true,
        bannedUntil: true,
        createdAt: true,
      },
    })
  },
  findByEmail: async (email) => {
    return prisma.user.findUnique({ where: { email } })
  },
  create: async (data) => {
    return prisma.user.create({ data })
  },
  update: async (id, data) => {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, name: true, email: true, profilePicture: true },
    })
  },
  findAll: async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        isBanned: true,
        banReason: true,
        bannedUntil: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            created_at: true,
          },
        },
      },
    })
  },
}
