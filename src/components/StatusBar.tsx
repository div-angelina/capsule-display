interface StatusBarProps {
    signal: number;
    capsuleName: string;
    isConnected: boolean;
}

const capsuleNames: Record<number, string> = {
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

export const StatusBar: React.FC<StatusBarProps> = ({ signal, isConnected }) => {
    return (
        <div className="status-bar">
            <div className="signal-info">
                <span className="signal-label">Текущий сигнал:</span>
                <span className="signal-value">{signal}</span>
                <span className="capsule-name">{capsuleNames[signal] || 'НЕИЗВЕСТНАЯ КАПСУЛА'}</span>
            </div>
            <div className="connection-status">
                <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                <span>{isConnected ? 'Подключено' : 'Отключено'}</span>
            </div>
        </div>
    );
};