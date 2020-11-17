const jwt = require('jsonwebtoken')
const User = require('../models/user-models')
const Task = require('../models/task-models')

module.exports = {

  async auth (req, res, next)  {
    
    try {
      const token = req.header('Authorization').replace('Bearer ', '')
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

      if (!user) {
        throw new Error()
      }

      req.token = token
      req.user = user
      next()
    }
    catch (e) {
      res.status(401).send({ error: 'Please authenticate!' })
    }
  },

  async taskAuth (req, res, next) {

    try {
      const taskInDB = await Task.findOne({ description: req.body.description })

      if (taskInDB) {
        throw new Error()
      }
      next()
    }
    catch (error) {
      res.status(400).send({
        error: 'Task with this description already exists!',
        description: req.body.description
      })
    } 
  }
}

