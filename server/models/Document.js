const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    _id: String, // Use the document ID from the URL/Yjs room
    data: Buffer, // Store Yjs updates as Buffer
    title: { type: String, default: "Untitled Document" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', DocumentSchema);
