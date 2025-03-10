import Joi from 'joi'

export const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(3).max(500).required(),
  price: Joi.number().positive().required(),
})

export const validateProduct = (req, res, next) => {
  const { error } = productSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  next()
}
