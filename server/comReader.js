const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class ComReader {
    constructor(options) {
        this.portPath = options.portPath || 'COM5';
        this.baudRate = options.baudRate || 115200;
        this.currentSignal = null;
        this.onSignalChange = options.onSignalChange;
        this.onConnectionChange = options.onConnectionChange;
        this.connected = false;
        this._port = null;
        this._parser = null;
        this._shouldReconnect = true;
        this._reconnectTimer = null;
        this._reconnectAttempt = 0;
        this.reconnectDelayMs = options.reconnectDelayMs || 5000;
        this.maxReconnectDelayMs = options.maxReconnectDelayMs || 30000;
        
        this.capsuleSignals = {
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
    }

    start() {
        console.log('[COM] Сервис запущен');
        this._shouldReconnect = true;
        this._connect();
    }

    _connect() {
        if (!this._shouldReconnect) return;

        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }

        this._cleanupPort();

        console.log(`[COM] Подключение к порту ${this.portPath} на скорости ${this.baudRate}...`);

        this._port = new SerialPort({
            path: this.portPath,
            baudRate: this.baudRate,
            autoOpen: false
        });

        this._parser = this._port.pipe(new ReadlineParser({ delimiter: '\n' }));

        this._port.on('open', () => {
            this.connected = true;
            this._reconnectAttempt = 0;
            console.log(`[COM] Порт ${this.portPath} открыт, скорость ${this.baudRate}`);
            if (typeof this.onConnectionChange === 'function') {
                this.onConnectionChange(true);
            }
        });

        this._port.on('error', (err) => {
            console.error(`[COM] Ошибка порта: ${err.message}`);
            this._handlePortFailure();
        });

        this._port.on('close', () => {
            console.warn(`[COM] Порт ${this.portPath} закрыт`);
            this._handlePortFailure();
        });

        this._parser.on('data', (line) => {
            const raw = String(line).trim();
            if (!raw) return;
            
            const signalNum = parseInt(raw, 10);
            
            if (!isNaN(signalNum) && signalNum >= 0 && signalNum <= 10) {
                console.log(`[COM] РАСПОЗНАН СИГНАЛ: ${signalNum} → ${this.capsuleSignals[signalNum]}`);
                this._handleSignal(signalNum);
            } else {
                console.log(`[COM] Получены неизвестные данные (не число 0-10): ${raw}`);
            }
        });

        this._port.open((err) => {
            if (err) {
                console.error(`[COM] Не удалось открыть порт ${this.portPath}: ${err.message}`);
                this._handlePortFailure();
            }
        });
    }

    _handleSignal(signal) {
        const previousSignal = this.currentSignal;
        this.currentSignal = signal;
        
        const signalName = this.capsuleSignals[signal] || 'НЕИЗВЕСТНЫЙ СИГНАЛ';
        
        console.log(`[COM] ОБРАБОТКА СИГНАЛА: ${signal} → ${signalName} (предыдущий: ${previousSignal})`);
        
        if (typeof this.onSignalChange === 'function') {
            const signalData = {
                signal: signal,
                name: signalName,
                timestamp: Date.now(),
                isPresent: signal !== 0,
                previousSignal: previousSignal
            };
            this.onSignalChange(signalData);
        } else {
            console.log(`[COM] onSignalChange не является функцией!`);
        }
    }

    _handlePortFailure() {
        this.connected = false;
        this.currentSignal = null;
        
        console.log(`[COM] Порт ${this.portPath} недоступен`);
        
        if (typeof this.onConnectionChange === 'function') {
            this.onConnectionChange(false);
        }
        
        if (typeof this.onSignalChange === 'function') {
            this.onSignalChange({
                signal: 0,
                name: 'НЕТ КАПСУЛЫ',
                timestamp: Date.now(),
                isPresent: false,
                previousSignal: this.currentSignal
            });
        }
        
        this._scheduleReconnect();
    }

    _scheduleReconnect() {
        if (!this._shouldReconnect || this._reconnectTimer) return;

        const delay = Math.min(
            this.reconnectDelayMs * Math.pow(2, this._reconnectAttempt),
            this.maxReconnectDelayMs
        );
        this._reconnectAttempt += 1;

        console.log(`[COM] Переподключение через ${delay}ms...`);

        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            this._connect();
        }, delay);
    }

    _cleanupPort() {
        if (this._parser) {
            try {
                this._parser.removeAllListeners();
            } catch (e) {}
            this._parser = null;
        }

        if (this._port) {
            try {
                this._port.removeAllListeners();
            } catch (e) {}
            if (this._port.isOpen) {
                try {
                    this._port.close();
                } catch (e) {}
            }
            this._port = null;
        }
    }

    getCurrentSignal() {
        return this.currentSignal;
    }

    stop() {
        console.log('[COM] Остановка сервиса...');
        this._shouldReconnect = false;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
        }
        this._cleanupPort();
        console.log('[COM] Сервис остановлен');
    }
}

module.exports = { ComReader };