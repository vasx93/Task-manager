require('../db/mongoose')
const express = require('express')
const router = express.Router()
const Task = require('../models/task-models')
const {auth, taskAuth} = require('../middleware/auth')




//*                ~~~~~     CREATE NEW TASK     ~~~~~

router.post('/tasks', auth, taskAuth, async (req, res) => {

  const task = new Task({ ...req.body, author: req.user._id })

  try {
    await task.save()
    res.status(201).send(task)
  }
  catch (error) {
    res.status(400).send(error)
  }
})



//*                ~~~~~     READ ALL TASKS WITH QUERY     ~~~~~

router.get('/tasks', auth, async (req, res) => {

  //* setting up options object for query search 
  const match = {}
  const sort = {}

  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }

  if (req.query.sort) {

    const parts = req.query.sort.split('_')
    const queryField = parts[0]
    const queryOrder = parts[1]

    sort[queryField] = queryOrder === 'desc' ? -1 : 1
  }

  try {
    //? populates the virtual req.user.tasks field on User(not shown in mongoDB)
    await req.user.populate({ 
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.send(req.user.tasks)    
  }
  catch (error) {
    res.status(500).send()
  }
})


//*                ~~~~~     READ SINGLE TASK     ~~~~~

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    
    const task = await Task.findOne({ _id, author: req.user._id})

    if (!task) {
      return res.status(404).send()
    }
    res.status(200).send(task)
  }
  catch (error) {
    res.status(500).send()
  }
})


//*                ~~~~~     UPDATE TASK     ~~~~~

router.patch('/tasks/:id', auth, async (req,res) => {

  const _id = req.params.id

  //* check to see if update is valid

  const updates = Object.keys(req.body)
  const allowed = ['description', 'completed']
  const isValid = updates.every( update => allowed.includes(update))

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid update!'})
  }

  try {

    const task = await Task.findOne({ _id, author: req.user._id})

    if (!task) {
      return res.status(404).send()
    }

    updates.forEach( update => task[update] = req.body[update] )
    await task.save()

    res.status(200).send(task)
  }
  catch(error) {
    res.status(400).send(error)
  }

})


//*                ~~~~~     DELETE TASK     ~~~~~

router.delete('/tasks/:id', auth, async (req, res) => {
  
  const _id = req.params.id

  try {
    const task = await Task.findOneAndDelete({ _id, author: req.user._id})

    if (!task) {
      return res.status(404).send()
    }
    res.send({ msg: 'Task deleted!', task})
  }
  catch (error) {
    res.status(400).send(error)
  }
})

module.exports = router