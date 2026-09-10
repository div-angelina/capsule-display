import { useState, useEffect, useRef } from 'react';
import { ImageConfig } from '../config/cardsConfig';

interface CardPageProps {
    title: string;        
    text: string | string[]; 
    images: ImageConfig[];   
}

const LINE_HEIGHT = 2268;  
const LINE_WIDTH = 109;   
const OVERLAP = 50;    
const effectiveHeight = LINE_HEIGHT - OVERLAP; 
const lineCount = Math.ceil((1080 * 2) / effectiveHeight) + 2;

export const CardPage = ({ title, text, images }: CardPageProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);      
    const [showArrow, setShowArrow] = useState(false);            
    const [showMask, setShowMask] = useState(false);     
    const [showHint, setShowHint] = useState(true);           
    const [hintFadingOut, setHintFadingOut] = useState(false);
    const textScrollRef = useRef<HTMLDivElement>(null);
    const touchStartY = useRef<number | null>(null); 
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const hideHintTimeoutRef = useRef<number | null>(null);

    const formatNumSign = (text: string) => {
        if (typeof text !== 'string') return text;
        
        const parts = [];
        let lastIndex = 0;
        const regex = /№/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            parts.push(
                <span key={`num-${match.index}`} className="num-sign">
                    №
                </span>
            );
            lastIndex = match.index + 1;
        }
        
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts.length === 0 ? text : parts;
    };

    useEffect(() => {
        const protectImages = () => {
            const images = document.querySelectorAll('.card-photo, .card-indicator img, .card-hint img');
            images.forEach(img => {
                img.setAttribute('draggable', 'false');
                img.setAttribute('ondragstart', 'return false;');
                img.setAttribute('oncontextmenu', 'return false;');
                img.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                img.addEventListener('dragstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
            });
        };

        protectImages();

        const observer = new MutationObserver(() => {
            protectImages();
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        return () => observer.disconnect();
    }, []);


    if (!images || images.length === 0) {
        return <div className="placeholder-page">Нет изображений</div>;
    }

    useEffect(() => {
        setShowHint(true);
        setHintFadingOut(false);
        setCurrentImageIndex(0);
        
        if (hideHintTimeoutRef.current) {
            window.clearTimeout(hideHintTimeoutRef.current);
            hideHintTimeoutRef.current = null;
        }
        
        if (images.length > 1) {
            hideHintTimeoutRef.current = window.setTimeout(() => {
                setHintFadingOut(true);
                setTimeout(() => {
                    setShowHint(false);
                    setHintFadingOut(false);
                }, 300);
            }, 3000);
        } else {
            setShowHint(false);
        }
        
        return () => {
            if (hideHintTimeoutRef.current) {
                window.clearTimeout(hideHintTimeoutRef.current);
            }
        };
    }, [images.length]);

    const isLastImage = (index: number) => index === images.length - 1;

    const getIndicatorIcon = (index: number, isActive: boolean) => {
        if (isLastImage(index)) {
            return isActive 
                ? '/assets/element/mark_on_end.png' 
                : '/assets/element/mark_off_end.png';
        }
        return isActive 
            ? '/assets/element/mark_on.png' 
            : '/assets/element/mark_off.png';
    };

    const hideHint = () => {
        if (showHint && !hintFadingOut) {
            setHintFadingOut(true);
            setTimeout(() => {
                setShowHint(false);
                setHintFadingOut(false);
            }, 300);
        }
    };

    useEffect(() => {
        if (!showHint || images.length <= 1) return;

        const handleInteraction = () => {
            if (showHint) hideHint();
        };

        const container = photoContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleInteraction);
            container.addEventListener('click', handleInteraction);
            container.addEventListener('touchstart', handleInteraction);
        }
        
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleInteraction);
                container.removeEventListener('click', handleInteraction);
                container.removeEventListener('touchstart', handleInteraction);
            }
        };
    }, [showHint, images.length]);

    useEffect(() => {
        if (showHint && images.length > 1 && currentImageIndex !== 0) {
            hideHint();
        }
    }, [currentImageIndex, showHint, images.length]);

    useEffect(() => {
        const container = photoContainerRef.current;
        if (!container || images.length <= 1) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY > 0 && currentImageIndex < images.length - 1) {
                switchImage(currentImageIndex + 1); 
            } else if (e.deltaY < 0 && currentImageIndex > 0) {
                switchImage(currentImageIndex - 1);
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [currentImageIndex, images.length]);

    useEffect(() => {
        const container = photoContainerRef.current;
        if (!container || images.length <= 1) return;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (touchStartY.current === null) return;
            const deltaY = e.changedTouches[0].clientY - touchStartY.current;
            
            if (Math.abs(deltaY) > 50) {
                if (deltaY < 0 && currentImageIndex < images.length - 1) {
                    switchImage(currentImageIndex + 1); 
                } else if (deltaY > 0 && currentImageIndex > 0) {
                    switchImage(currentImageIndex - 1); 
                }
            }
            touchStartY.current = null;
        };

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchend', handleTouchEnd);
        
        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [currentImageIndex, images.length]);

    const handleScroll = () => {
        if (!textScrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = textScrollRef.current;
        const canScroll = scrollHeight > clientHeight;          
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; 
        
        setShowArrow(canScroll && !isAtBottom);   
        setShowMask(canScroll && !isAtBottom);   
    };

    const switchImage = (index: number) => {
        if (index === currentImageIndex) return;
        if (index < 0 || index >= images.length) return;
        setIsFading(true);
        setTimeout(() => {
            setCurrentImageIndex(index);
            setIsFading(false);
        }, 150);
    };

    const scrollText = () => {
        if (textScrollRef.current) {
            textScrollRef.current.scrollBy({ top: 200, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const container = textScrollRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            setTimeout(handleScroll, 100); 
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [text]);

    useEffect(() => {
        if (!document.querySelector('#vertical-animation')) {
            const style = document.createElement('style');
            style.id = 'vertical-animation';
            style.textContent = `
                @keyframes slideVertical {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-${effectiveHeight}px); }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const currentImage = images[currentImageIndex] || images[0];
    const imageStyle = {
        position: 'absolute' as const,
        left: currentImage?.left !== undefined ? `${currentImage.left}px` : '80px',
        top: currentImage?.top !== undefined ? `${currentImage.top}px` : '50%',
        transform: currentImage?.top !== undefined ? 'none' : 'translateY(-50%)',
        transition: 'opacity 0.3s ease'
    };

    return (
        <div className="card-page">
            {/* Фоновое изображение */}
            <img 
                src="/assets/element/background.png" 
                alt="" 
                className="card-background"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
            />
            
            {/* Вертикальная бегущая линия */}
            <div className="card-line-wrapper">
                <div className="card-line-track" style={{ animation: `slideVertical ${30}s linear infinite` }}>
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <img
                            key={i}
                            src="/assets/element/line.png"
                            alt=""
                            className="card-line"
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                            style={{
                                width: `${LINE_WIDTH}px`,
                                height: `${LINE_HEIGHT}px`,
                                display: 'block',
                                flexShrink: 0,
                                marginTop: i === 0 ? '0' : `-${OVERLAP}px`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Контейнер с текстом */}
            <div className="card-text-container">
                <div className="card-title">{title}</div>
                <div 
                    className={`card-text-scroll ${showMask ? 'with-mask' : ''}`} 
                    ref={textScrollRef}
                >
                    <div className="card-text-content">
                        {Array.isArray(text) ? (
                            text.map((paragraph, idx) => {
                                const isHighlighted = paragraph && paragraph === paragraph.toUpperCase() && paragraph.length > 10;
                                return (
                                    <p 
                                        key={idx} 
                                        className={isHighlighted ? 'card-text-paragraph card-text-highlight' : 'card-text-paragraph'}
                                    >
                                        {formatNumSign(paragraph)}
                                    </p>
                                );
                            })
                        ) : (
                            <p className="card-text-paragraph">{formatNumSign(text)}</p>
                        )}
                    </div>
                </div>
                {/* Стрелка для скролла текста */}
                <div className={`card-down-arrow ${showArrow ? 'visible' : ''}`} onClick={scrollText}>
                    <img 
                        src="/assets/element/down_arrow.png" 
                        alt=""
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                    />
                </div>
            </div>

            {/* Контейнер с фотографией */}
            <div className="card-photo-container" ref={photoContainerRef}>
                <img 
                    src={currentImage?.src || ''} 
                    alt=""
                    className={`card-photo ${isFading ? 'fade-out' : ''}`}
                    style={imageStyle}
                    draggable="false"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                />
            </div>

            {/* Подсказка для листания фото */}
            {showHint && images.length > 1 && (
                <div className={`card-hint ${hintFadingOut ? 'fade-out' : ''}`}>
                    <img 
                        src="/assets/element/hint.png" 
                        alt=""
                        draggable="false"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                    />
                </div>
            )}

            {/* Индикаторы фотографий */}
            {images.length > 1 && (
                <div className="card-indicators">
                    {images.map((_, i) => (
                        <div key={i} className="card-indicator" onClick={() => switchImage(i)}>
                            <img 
                                src={getIndicatorIcon(i, i === currentImageIndex)}
                                alt=""
                                draggable="false"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};