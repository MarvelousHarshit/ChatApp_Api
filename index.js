const express = require('express');
const dotenv = require('dotenv');
dotenv.config();   //moved up
const { chats } = require('./data/data');
const connectDB = require('./config/db')    //commented
const cors = require('cors')

//added
// require('./config/db.js');
const User = require('./models/userModel.js');

const userRoutes = require('./Routes/userRoutes')
const chatRoutes = require('./Routes/chatRoutes');
const messageRoutes = require('./Routes/messageRoutes')
const { notFound, errorHandler } = require('./middlewares/errorhandler');
const { Socket } = require('socket.io');

connectDB(); //commented

const app = express();



// Enable CORS for all routes
app.use(cors());

// Handle pre-flight requests
app.use(cors({ origin: ['https://chatappfrontend-yy97.onrender.com', 'http://localhost:3000'] }));
// app.options('*', cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});



app.get('/', (req, res) => {
    res.send('I am live now');

})

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);


//handling invalid urls
//notfound and errorhandlers are middlewares
app.use(notFound);


const PORT = process.env.PORT || 4000
// console.log(PORT);

const server = app.listen(PORT, console.log('server running on port : ' + PORT));
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    },
    pingTimeout: 60000,
});

var chatRoom = '';
var allUsers = []
var onlineUsers = [];
io.on("connection", (socket) => {
    console.log("socket connection established");
    socket.on("setup", (user) => {
        if (!user) return;
        socket.join(user?._id) //check validity
        console.log(user?.name, 'user connected 🟢')
        onlineUsers.push({ id: socket.id, name: user.name, user_id: user._id });
        console.log("online users : ", onlineUsers);
        socket.emit("connected");
    });
    socket.on("join chat", (data) => {
        var { username, room } = data;
        socket.join(room);
        chatRoom = room;
        allUsers.push({ id: socket.id, username, room });
        var chatRoomUsers = allUsers.filter((user) => user.room === room);
        // socket.to(room).emit('chatroom_users', chatRoomUsers);
        console.log("Connected sockets in this room : ", chatRoomUsers)

        console.log("user joined room : ", room);
    });

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;
        console.log("new message : ", newMessageRecieved);

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return;

            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    socket.on('get active users', () => {
        socket.emit('all active users', onlineUsers);
    })

    socket.on("typing", (room) => socket.broadcast.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));


    socket.on('disconnect', () => {
        var disconnectedUser = onlineUsers.filter((data) => data.id === socket.id);
        console.log(disconnectedUser, ' user disconnected! 🔴');
        onlineUsers = onlineUsers.filter((data) => data.id != socket.id);
        allUsers = allUsers.filter((data) => data.id != socket.id);
        console.log(" 👨user disconnected! current socket details : ", onlineUsers);

        console.log("👨‍👩‍👦 current group-socket details : ", allUsers);
    })

})
