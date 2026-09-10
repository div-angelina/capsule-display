const { Server } = require('socket.io');

let io = null;
const connectedClients = new Set();

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Клиент подключен: ${socket.id}`);
        connectedClients.add(socket.id);

        socket.on('disconnect', () => {
            console.log(`[Socket] Клиент отключен: ${socket.id}`);
            connectedClients.delete(socket.id);
        });
        
        socket.on('subscribe', () => {
            console.log(`[Socket] Клиент ${socket.id} подписался на обновления`);
        });
    });
}

function emitSignal(signalData) {
    if (!io) {
        console.log('[Socket] Ошибка: io не инициализирован');
        return;
    }
    
    console.log(`[Socket] Отправка сигнала ${signalData.signal} всем клиентам`);
    io.emit('signal:changed', signalData);
}

function getConnectedClientsCount() {
    return connectedClients.size;
}

module.exports = {
    initSocket,
    emitSignal,
    getConnectedClientsCount
};