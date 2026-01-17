export interface Player {
    id?: string; // Mongoose ID
    socketId?: string; // Socket ID for live players
    userId: string; // Unique User Handle
    name: string;
    score: number;
}
