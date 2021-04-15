const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocation} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = 1450
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New connection')

    socket.on('join', (options, callback) => {

        const { error, user} = addUser({id: socket.id, ...options})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
         
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
        
    })
    
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback ('Profanity is not allowed')
        }

        io.to(getUser(socket.id).room).emit('message', generateMessage(getUser(socket.id).username, message))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        io.to(getUser(socket.id).room).emit('locationMessage',generateLocation(getUser(socket.id).username, `https://google.com/maps?q=${coords.latitude},${coords.longtitude}`))
        callback()
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',  `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
  console.log(`server is up on port ${port}!`)
})
