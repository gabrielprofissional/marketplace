import prisma from '../config/database.js'

/**
 * Modelo para operações relacionadas a configurações do site.
 */
export const SettingsModel = {
  /**
   * Busca as configurações do site (cria se não existirem).
   * @returns {Promise<Object>} Configurações atuais
   */
  getOrCreate: async () => {
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: { siteName: '', logoUrl: null, faviconUrl: null },
      })
    }
    return settings
  },

  /**
   * Atualiza as configurações do site.
   * @param {number} id - ID das configurações
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<Object>} Configurações atualizadas
   */
  update: async (id, data) => {
    return prisma.settings.update({
      where: { id: parseInt(id) },
      data,
    })
  },
}
