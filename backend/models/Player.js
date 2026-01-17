const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    score: {
        type: Number,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Player', playerSchema);
