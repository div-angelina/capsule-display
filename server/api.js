const express = require('express');
const router = express.Router();

// Хранилище последнего сигнала (для API запросов)
let lastSignal = {
    signal: 0,
    name: 'НЕТ КАПСУЛЫ',
    timestamp: null,
    isPresent: false
};

// Обновление последнего сигнала (вызывается из index.js)
function updateLastSignal(signalData) {
    lastSignal = signalData;
}

// GET /api/current-signal - получить текущий сигнал
router.get('/current-signal', (req, res) => {
    res.json({
        success: true,
        data: lastSignal
    });
});

// GET /api/capsules - получить список всех капсул
router.get('/capsules', (req, res) => {
    const capsules = {
        1: { name: 'ДИСК «МИМИНО»', signal: 1 },
        2: { name: 'ПОСТЕР СЕРИАЛА', signal: 2 },
        3: { name: 'МАКЕТ «5 ГЕРБОВ»', signal: 3 },
        4: { name: 'КОРОБКА С ДИЗАЙНОМ или САМОЛЁТ В МАСШТАБЕ', signal: 4 },
        5: { name: 'КОРОБКА С ИГРОЙ «ATOMIC HEART»', signal: 5 },
        6: { name: 'МОНЕТА', signal: 6 },
        7: { name: 'ПЛАКАТ', signal: 7 },
        8: { name: 'ПОЧТОВЫЕ МАРКИ', signal: 8 },
        9: { name: 'ЗАЖИГАЛКА', signal: 9 },
        10: { name: 'ЖЕТОН', signal: 10 },
        0: { name: 'НЕТ КАПСУЛЫ', signal: 0 }
    };
    res.json({ success: true, data: capsules });
});

// POST /api/simulate-signal - симуляция сигнала (для тестирования через Postman)
router.post('/simulate-signal', (req, res) => {
    const { signal } = req.body;
    
    if (typeof signal !== 'number' || signal < 0 || signal > 10) {
        return res.status(400).json({
            success: false,
            message: 'Неверный сигнал. Допустимые значения: 0-10'
        });
    }
    
    const signalNames = {
        0: 'НЕТ КАПСУЛЫ',
        1: 'ДИСК «МИМИНО»',
        2: 'ПОСТЕР СЕРИАЛА',
        3: 'МАКЕТ «5 ГЕРБОВ»',
        4: 'КОРОБКА С ДИЗАЙНОМ или САМОЛЁТ В МАСШТАБЕ',
        5: 'КОРОБКА С ИГРОЙ «ATOMIC HEART»',
        6: 'МОНЕТА',
        7: 'ПЛАКАТ',
        8: 'ПОЧТОВЫЕ МАРКИ',
        9: 'ЗАЖИГАЛКА',
        10: 'ЖЕТОН'
    };
    
    const signalData = {
        signal: signal,
        name: signalNames[signal],
        timestamp: Date.now(),
        isPresent: signal !== 0
    };
    
    // Этот объект будет использован в index.js
    if (global.simulateSignalCallback) {
        global.simulateSignalCallback(signalData);
    }
    
    res.json({
        success: true,
        message: `Сигнал ${signal} симулирован`,
        data: signalData
    });
});

// GET /health - health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        lastSignal: lastSignal
    });
});

module.exports = {
    router,
    updateLastSignal
};