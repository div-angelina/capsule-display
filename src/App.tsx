import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Page0 } from './components/Page0';
import { CardPage } from './components/CardPage';
import { CARDS_CONFIG } from './config/cardsConfig';
import './App.css';

function App() {
    const [signal, setSignal] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [pageKey, setPageKey] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const animationTimeoutRef = useRef<number | null>(null);
    const currentSignalRef = useRef<number>(0);

    // Защита от жестов и тачпада на Windows 11
    useEffect(() => {
        const disableContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };
        
        const disableSelectStart = (e: Event) => {
            e.preventDefault();
            return false;
        };
        
        const disableDragStart = (e: DragEvent) => {
            e.preventDefault();
            return false;
        };
        
        const disableWheelGesture = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                return false;
            }
        };
        
        const disableTouchAction = (e: TouchEvent) => {
            // Предотвращает мультитач жесты
            if (e.touches.length > 1) {
                e.preventDefault();
                return false;
            }
        };
        
        const disablePinchZoom = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                return false;
            }
        };
        
        const disableKeys = (e: KeyboardEvent) => {
            // F5 обновление
            if (e.key === 'F5') {
                e.preventDefault();
                return false;
            }
            // Ctrl+R обновление
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+R принудительное обновление
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
                e.preventDefault();
                return false;
            }
    
            // Ctrl+U - просмотр исходного кода
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                return false;
            }
            // Ctrl+S - сохранение
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                return false;
            }
            // Ctrl+P - печать
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                return false;
            }
        };
        
        document.body.style.touchAction = 'none';
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        document.addEventListener('contextmenu', disableContextMenu);
        document.addEventListener('selectstart', disableSelectStart);
        document.addEventListener('dragstart', disableDragStart);
        document.addEventListener('wheel', disableWheelGesture, { passive: false });
        document.addEventListener('wheel', disablePinchZoom, { passive: false });
        document.addEventListener('touchstart', disableTouchAction, { passive: false });
        document.addEventListener('keydown', disableKeys);
        
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('dragstart', disableDragStart);
            img.setAttribute('draggable', 'false');
        });
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement && node.tagName === 'IMG') {
                        node.addEventListener('dragstart', disableDragStart);
                        node.setAttribute('draggable', 'false');
                    } else if (node instanceof HTMLElement) {
                        const imgs = node.querySelectorAll('img');
                        imgs.forEach(img => {
                            img.addEventListener('dragstart', disableDragStart);
                            img.setAttribute('draggable', 'false');
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        return () => {
            document.removeEventListener('contextmenu', disableContextMenu);
            document.removeEventListener('selectstart', disableSelectStart);
            document.removeEventListener('dragstart', disableDragStart);
            document.removeEventListener('wheel', disableWheelGesture);
            document.removeEventListener('wheel', disablePinchZoom);
            document.removeEventListener('touchstart', disableTouchAction);
            document.removeEventListener('keydown', disableKeys);
            observer.disconnect();
            
            document.body.style.touchAction = '';
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        };
    }, []);

    useEffect(() => {
        const socket = io({
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });
        
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected');
            socket.emit('subscribe');
        });

        socket.on('signal:changed', (data) => {
            console.log('Signal received:', data);
            
            const newSignal = data.signal;
            const currentSignal = currentSignalRef.current;
            
            if (newSignal === currentSignal) {
                console.log('Сигнал не изменился, игнорируем');
                return;
            }
            
            setPageKey(prev => prev + 1);
            
            if (currentSignal === 0 && newSignal === 0) {
                console.log('Уже на главной странице, игнорируем повторный 0');
                return;
            }
            
            if (newSignal === 0) {
                console.log('Возврат на главную страницу');
                
                if (animationTimeoutRef.current) {
                    clearTimeout(animationTimeoutRef.current);
                    animationTimeoutRef.current = null;
                }
                
                setIsFading(true);
                animationTimeoutRef.current = window.setTimeout(() => {
                    setSignal(0);
                    currentSignalRef.current = 0;
                    setIsFading(false);
                    animationTimeoutRef.current = null;
                }, 150);
                return;
            }
            
            console.log(`Переход на страницу ${newSignal}`);
            
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
                animationTimeoutRef.current = null;
            }
            
            setIsFading(true);
            animationTimeoutRef.current = window.setTimeout(() => {
                setSignal(newSignal);
                currentSignalRef.current = newSignal;
                setIsFading(false);
                animationTimeoutRef.current = null;
            }, 150);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        fetch('/api/current-signal')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.signal !== signal) {
                    setSignal(data.data.signal);
                    currentSignalRef.current = data.data.signal;
                }
            })
            .catch(console.error);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    const renderPage = () => {
        if (signal === 0) {
            return <Page0 key={`page0-${pageKey}`} />;
        }
        
        const config = CARDS_CONFIG[signal];
        if (config && config.images && config.images.length > 0) {
            return (
                <CardPage 
                    key={`card-${signal}-${pageKey}`}
                    title={config.title}
                    text={config.text}
                    images={config.images}
                />
            );
        }
        
        return (
            <div className="placeholder-page" key={`placeholder-${pageKey}`}>
                <h1>Страница {signal}</h1>
                <p>В разработке</p>
            </div>
        );
    };

    return (
        <div className="app-container">
            <div className={`page-container ${isFading ? 'fade-out' : ''}`}>
                {renderPage()}
            </div>
        </div>
    );
}

export default App;