const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const { ComReader } = require('./comReader');

const PORT = process.env.PORT || 3000;
const COM_PORT = process.env.COM_PORT || 'COM5';
const COM_BAUD_RATE = parseInt(process.env.COM_BAUD_RATE || '115200', 10);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

let currentSignal = { signal: 0, name: 'НЕТ КАПСУЛЫ', timestamp: Date.now() };
let lastProcessedSignal = -1;

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.emit('signal:changed', currentSignal);
    
    socket.on('subscribe', () => {
        console.log(`Client ${socket.id} subscribed`);
        socket.emit('signal:changed', currentSignal);
    });
    
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

app.use(cors());
app.use(express.json());

app.get('/api/current-signal', (req, res) => {
    res.json({ success: true, data: currentSignal });
});

app.post('/api/simulate-signal', (req, res) => {
    const { signal } = req.body;
    
    if (typeof signal !== 'number' || signal < 0 || signal > 10) {
        return res.status(400).json({ success: false, message: 'Signal must be 0-10' });
    }
    
    const names = {
        0: 'НЕТ КАПСУЛЫ', 1: 'ДИСК «МИМИНО»', 2: 'ПОСТЕР СЕРИАЛА',
        3: 'МАКЕТ «5 ГЕРБОВ»', 4: 'КОРОБКА С ДИЗАЙНОМ', 5: 'ATOMIC HEART',
        6: 'МОНЕТА', 7: 'ПЛАКАТ', 8: 'ПОЧТОВЫЕ МАРКИ', 9: 'ЗАЖИГАЛКА', 10: 'ЖЕТОН'
    };
    
    currentSignal = { signal, name: names[signal], timestamp: Date.now() };
    lastProcessedSignal = signal;
    io.emit('signal:changed', currentSignal);
    
    res.json({ success: true, message: `Signal ${signal} sent`, data: currentSignal });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const comReader = new ComReader({
    portPath: COM_PORT,
    baudRate: COM_BAUD_RATE,
    reconnectDelayMs: 5000,
    maxReconnectDelayMs: 30000,
    
    onSignalChange: (signalData) => {
        console.log(`[COM] Сигнал: ${signalData.signal} → ${signalData.name}`);
        
        // Игнорируется если сигнал не изменился
        if (signalData.signal === lastProcessedSignal) {
            console.log(`[COM] Игнорируем повтор сигнала ${signalData.signal}`);
            return;
        }
        
        console.log(`[COM] Сигнал изменился: ${lastProcessedSignal} → ${signalData.signal}`);
        lastProcessedSignal = signalData.signal;
        currentSignal = signalData;
        io.emit('signal:changed', currentSignal);
    },
    
    onConnectionChange: (connected) => {
        console.log(`[COM] Порт ${connected ? 'подключен' : 'отключен'}`);
        if (!connected) {
            lastProcessedSignal = -1;
        }
    }
});

setTimeout(() => {
    console.log('[APP] Запуск COM-ридера...');
    comReader.start();
}, 1000);

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

process.on('SIGINT', () => {
    console.log('\n[APP] Завершение работы...');
    comReader.stop();
    server.close(() => process.exit(0));
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║          ТУ-144 В МАССОВОЙ КУЛЬТУРЕ - CAPSULE DISPLAY          ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  HTTP Сервер:    http://localhost:${PORT}                        ║`);
    console.log(`║  WebSocket:      ws://localhost:${PORT}                          ║`);
    console.log(`║  COM-порт:       ${COM_PORT} @ ${COM_BAUD_RATE} бод                     ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
});