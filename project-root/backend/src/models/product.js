import prisma from '../config/database.js'

export const ProductModel = {
  findMany: async ({
    offset = 0,
    limit = 10,
    minPrice,
    maxPrice,
    sort = 'created_at',
  }) => {
    const where = {}
    if (minPrice) where.price = { gte: parseFloat(minPrice) }
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) }
    const orderBy = sort.startsWith('-')
      ? { [sort.slice(1)]: 'desc' }
      : { [sort]: 'asc' }

    const products = await prisma.product.findMany({
      skip: parseInt(offset),
      take: parseInt(limit),
      where,
      orderBy,
      include: { user: { select: { id: true, name: true } } },
    })
    const total = await prisma.product.count({ where })

    return { products, total }
  },
  findById: async (id) => {
    return prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  },
  create: async (data) => {
    return prisma.product.create({ data })
  },
  update: async (id, data) => {
    return prisma.product.update({ where: { id: parseInt(id) }, data })
  },
  delete: async (id) => {
    await prisma.favorite.deleteMany({ where: { productId: parseInt(id) } })
    return prisma.product.delete({ where: { id: parseInt(id) } })
  },
  findByUserId: async (userId) => {
    return prisma.product.findMany({ where: { userId: parseInt(userId) } })
  },
}
