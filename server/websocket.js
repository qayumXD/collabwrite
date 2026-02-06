const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const Document = require('./models/Document');
const Y = require('yjs');

const setupWebsocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  const persistence = {
    bindState: async (docName, ydoc) => {
      const docId = docName;
      console.log(`[Persistence] Loading document: ${docId}`);

      try {
        const persistedDoc = await Document.findById(docId);
        if (persistedDoc && persistedDoc.data) {
          console.log(`[Persistence] Document found in DB, applying update. Size: ${persistedDoc.data.length}`);
          Y.applyUpdate(ydoc, persistedDoc.data);
        } else {
          console.log(`[Persistence] Document not found in DB or empty.`);
        }
      } catch (err) {
        console.error(`[Persistence] Error loading document ${docId}:`, err);
      }
    },
    writeState: async (docName, ydoc) => {
      const docId = docName;
      const update = Y.encodeStateAsUpdate(ydoc);
      console.log(`[Persistence] Saving document: ${docId}, Size: ${update.length}`);

      try {
        await Document.findByIdAndUpdate(docId, {
          data: Buffer.from(update),
          updatedAt: new Date()
        }, { upsert: true });
      } catch (err) {
        console.error(`[Persistence] Error saving document ${docId}:`, err);
      }
    }
  };

  require('y-websocket/bin/utils').setPersistence(persistence);

  wss.on('connection', (conn, req, { docName = req.url.slice(1).split('?')[0] } = {}) => {
    setupWSConnection(conn, req, { docName, gc: true });
  });

  server.on('upgrade', (request, socket, head) => {
    const handleAuth = (ws) => {
      wss.emit('connection', ws, request);
    };
    wss.handleUpgrade(request, socket, head, handleAuth);
  });
};

module.exports = setupWebsocket;
