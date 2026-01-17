const playerController = require('../controllers/playerController');

const activePlayers = {};

const registerSocketHandlers = (io, socket) => {

    io.emit('online_count', io.of("/").sockets.size);

    socket.on('join_game', async ({ name, userId, previousUserId }) => {
        if (!name || !userId) return;

        try {
            let player = await playerController.findPlayerByUserId(userId);

            if (player) {
                if (previousUserId === userId) {
                    await playerController.updatePlayerName(userId, name);
                    player.name = name;
                    console.log(`Player @${userId} updated name to ${name}`);
                } else {
                    socket.emit('join_error', 'Username already taken. Please choose a different one.');
                    return;
                }
            } else {
                player = await playerController.createPlayer({ name, userId, score: 0 });
            }

            activePlayers[socket.id] = {
                socketId: socket.id,
                userId: player.userId,
                name: player.name,
                score: player.score
            };

            console.log(`${name} (@${userId}) joined the game`);
            socket.emit('join_success', { userId, name });
            io.emit('players_update', Object.values(activePlayers));

        } catch (error) {
            console.error('Join game error:', error.message);
            socket.emit('join_error', 'Server error. Please try again.');
        }
    });

    socket.on('update_score', async ({ score }) => {
        if (!activePlayers[socket.id]) return;

        activePlayers[socket.id].score = score;

        try {
            await playerController.updatePlayerScore(
                activePlayers[socket.id].userId,
                score
            );
        } catch (error) {
            console.error('Score update error:', error.message);
        }

        io.emit('players_update', Object.values(activePlayers));
    });

    socket.on('request_leaderboard', async () => {
        try {
            const leaderboard = await playerController.getLeaderboard();
            socket.emit('leaderboard_data', leaderboard);
        } catch (error) {
            console.error('Leaderboard fetch error:', error.message);
        }
    });

    socket.on('disconnect', () => {
        if (activePlayers[socket.id]) {
            console.log(`${activePlayers[socket.id].name} left the game`);
            delete activePlayers[socket.id];
            io.emit('players_update', Object.values(activePlayers));
        }
        io.emit('online_count', io.of("/").sockets.size);
    });
};

module.exports = { registerSocketHandlers };
