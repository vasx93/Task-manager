require('../db/mongoose')
const express = require('express')
const sharp = require('sharp')
const User = require('../models/user-models')
const { auth } = require('../middleware/auth')
const { welcomeEmail, cancelAccountEmail } = require('../emails/account')
const router = express.Router()

const multer = require('multer')

const upload = multer({ 
  limits: {
    fileSize: 1_000_000
  },
  fileFilter(req, file, cb) {
    // if (!file.originalname.endsWith('.jpg') && (!file.originalname.endsWith('.png')) ...
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Upload in correct format!'))
    }
    cb(undefined, true)
  }
})


//!                       CRUD  ROUTES


//*                ~~~~~     CREATE  USER     ~~~~~

router.post('/users', async (req, res) => {

  const user = new User(req.body)

  try {
    await user.save()
    welcomeEmail(user.email, user.name)

    const token = await user.generateToken()
    res.status(201).send({user, token})
  }
  catch (error) {
    res.status(400).send(error)
  }
  
})


//*                ~~~~~     READ USER PROFILE     ~~~~~

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})


//*                ~~~~~     UPLOAD USER IMG     ~~~~~

router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res) => {
  
  const sharpBuffer = await sharp(req.file.buffer).resize(250, 250)
  .png().toBuffer()

  req.user.avatar = sharpBuffer
  await req.user.save()

  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

//*                ~~~~~     SERVE USER IMG     ~~~~~

router.get('/users/:id/avatar', async (req, res) => {
  const _id = req.params.id

  try {
    const user = await User.findById(_id)

    if (!user || !user.avatar) {
      throw new Error('No user or image found!')
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  }
  catch (e) {
    res.status(404).send()
  }
})



//*                ~~~~~     DELETE USER IMG     ~~~~~

router.delete('/users/me/avatar', auth, async(req, res,) => {
  req.user.avatar = undefined
  await req.user.save()
  res.status(200).send()
})



//*                ~~~~~     UPDATE  USER     ~~~~~

router.patch('/users/me', auth, async (req, res) => {

  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  
  const isValid = updates.every( (update) => allowedUpdates.includes(update))

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid updates!'})
  }

  try {
    
    updates.forEach(update => req.user[update] = req.body[update])

    await req.user.save()
    
    res.send({ msg: 'Updates successful!', user: req.user})
  }
  catch (error) {
    res.status(400).send(error)
  }
})


//*                ~~~~~     DELETE  USER     ~~~~~

router.delete('/users/me', auth, async(req, res) => {

  try {

    req.user.remove()
    cancelAccountEmail(req.user.email, req.user.name)
    res.send({ msg: '---Delete successful'})
  }
  catch (error) {
    res.status(400).send(error)
  }
})


//*                ~~~~~     LOGIN USER     ~~~~~

router.post('/users/login', async (req, res) => {

  const {email, password} = req.body

  try {
    const user = await User.findByCredentials(email, password)

    const token = await user.generateToken()

    res.send({user, token})
  }
  catch(error) {
    res.status(400).send()
  }
})


//*                ~~~~~     LOGOUT ONE DEVICE     ~~~~~

router.post('/users/logout', auth, async (req, res) => {
  
  //? returns all tokens which are NOT used now in req.token, -- the one currently in use is deleted
  
  try {
    req.user.tokens = req.user.tokens.filter( tokenObj => {
      return tokenObj.token !== req.token
    })

    await req.user.save()

    res.send({msg: 'logout complete'})
  } catch (e) { 
    res.status(500).send()
  }
})


//*                ~~~~~     LOGOUT ALL DEVICES     ~~~~~

router.post('/users/logoutAll', auth, async (req, res) => {
  
  try {
    req.user.tokens = []
    await req.user.save()
    res.status(200).send()
  }
  catch (error) {
    res.status(500).send()
  }
})

module.exports = router



