const Player = require('../models/Player');

const findPlayerByUserId = async (userId) => {
    return await Player.findOne({ userId });
};

const createPlayer = async (userData) => {
    const player = new Player(userData);
    return await player.save();
};

const updatePlayerName = async (userId, newName) => {
    const player = await Player.findOne({ userId });
    if (player) {
        player.name = newName;
        await player.save();
    }
    return player;
};

const updatePlayerScore = async (userId, score) => {
    return await Player.findOneAndUpdate(
        { userId },
        { score, lastActive: Date.now() },
        { new: true, upsert: true }
    );
};

const getLeaderboard = async (limit = 50) => {
    return await Player.find().sort({ score: -1 }).limit(limit);
};

module.exports = {
    findPlayerByUserId,
    createPlayer,
    updatePlayerName,
    updatePlayerScore,
    getLeaderboard
};
