const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../errors/APIError');
const SECRET = process.env.JWT_SECRET;

module.exports = {
  createOne: async (req, res) => {
    const salt = await bcrypt.genSalt(10);

    const cryptedPassword = await bcrypt.hash(req.body.password, salt);

    const user = await prisma.user.create({
      data: {
        ...req.body,
        password: cryptedPassword,
      }
    })

    // TODO: catch error and return explicit message before pri
    if (!user) {
      throw new APIError({ code: 400, message: 'Un utilisateur avec cet email existe déjà' })
    }

    // Gérener un token
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '24h' });
    // Envoyer le token au client
    return res.json({ token });
  },

  login: async (req, res) => {
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email
      }
    })

    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!user || !valid) {
      throw new APIError({ code: 401, message: 'Email ou mot de passe incorrect' })
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '24h' });

    res.json({ token });
  },

  getAllUsers: async (req, res) => {
    const result = await prisma.user.findMany()
    res.status(200).json(result)
  },

  getOneUser: async (req, res) => {
    const result = await prisma.user.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: { orders: true, favorite_categories: true, favorite_universes: true }
    })

    if (!result) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json(result);

  },
  updateOneUser: async (req, res) => {
    const result = await prisma.user.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: req.body
    })

    res.status(200).json({ message: 'Utilisateur mis à jour', result });
  },
  deleteOneUser: async (req, res) => {
    const result = await prisma.user.delete({
      where: {
        id: parseInt(req.params.id)
      }
    })

    res.status(204).json();
  },
};
