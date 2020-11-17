require('dotenv').config({ debug: process.env.DEBUG })
const express = require('express')
const usersRouter = require('./routes/users')
const tasksRouter = require('./routes/tasks')

const app = express()

app.use(express.json())
app.use(usersRouter)
app.use(tasksRouter)

const port = process.env.PORT
app.listen(port, () => console.log(`---server up on port ${port}`))
