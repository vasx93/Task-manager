require('dotenv').config()
const express = require('express')
const usersRouter = require('./routes/users')
const tasksRouter = require('./routes/tasks')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true}))

app.use(usersRouter)
app.use(tasksRouter)

const port = process.env.PORT
app.listen(port, () => console.log(`---server up on port ${port}`))
