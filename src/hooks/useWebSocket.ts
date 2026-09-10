import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SignalData {
    signal: number;
    name: string;
    timestamp: number;
    isPresent: boolean;
}

export const useWebSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentSignal, setCurrentSignal] = useState<SignalData | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io({
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('[WebSocket] Подключен');
            setIsConnected(true);
            newSocket.emit('subscribe');
        });

        newSocket.on('disconnect', () => {
            console.log('[WebSocket] Отключен');
            setIsConnected(false);
        });

        newSocket.on('signal:changed', (data: SignalData) => {
            console.log('[WebSocket] Сигнал:', data.signal, data.name);
            setCurrentSignal(data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const fetchCurrentSignal = useCallback(async () => {
        try {
            const response = await fetch('/api/current-signal');
            const result = await response.json();
            if (result.success && result.data) {
                setCurrentSignal(result.data);
            }
        } catch (error) {
            console.error('[WebSocket] Ошибка получения сигнала:', error);
        }
    }, []);

    return { socket, currentSignal, isConnected, fetchCurrentSignal };
};