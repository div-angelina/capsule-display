import { useEffect } from 'react';

const LINE_WIDTH = 2268;
const OVERLAP = 65;
const effectiveWidth = LINE_WIDTH - OVERLAP;
const lineCount = Math.ceil((1920 * 2) / effectiveWidth) + 2;

export const Page0 = () => {
    useEffect(() => {
        if (!document.querySelector('#infinite-animation')) {
            const style = document.createElement('style');
            style.id = 'infinite-animation';
            style.textContent = `
                @keyframes slideInfinite {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-${effectiveWidth}px); }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <div className="page0-container">
            <img src="/assets/element/frame.png" alt="Background" className="page0-background" />
            <div className="page0-line-wrapper">
                <div className="page0-line-track">
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <img
                            key={i}
                            src="/assets/element/line_horizontal.png"
                            alt="Line"
                            className="page0-line"
                            style={{
                                marginLeft: i === 0 ? '0' : `-${OVERLAP}px`
                            }}
                        />
                    ))}
                </div>
            </div>
            <img src="/assets/element/frame_text.png" alt="Frame Text" className="page0-top-text" />
        </div>
    );
};