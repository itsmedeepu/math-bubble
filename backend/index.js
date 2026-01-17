const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const { registerSocketHandlers } = require('./socket/handlers');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

connectDatabase();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    registerSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
