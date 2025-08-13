import React, { useRef, useEffect } from 'react';
import { MatrixRain } from '../utils/MatrixRain';

const CanvasTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

    const pattern = new MatrixRain(ctx, {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&',
      speed: 'medium',
      density: 'medium',
      currentTheme: 'matrix'
    });

    pattern.initialize();
    console.log('Pattern initialized');

    let animationId: number;
    let lastTime = 0;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pattern.update(deltaTime);
      pattern.render();

      animationId = requestAnimationFrame(animate);
    };

    console.log('Starting animation');
    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      pattern.cleanup();
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000',
      zIndex: 1
    }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#00ff00',
        fontFamily: 'monospace',
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '5px'
      }}>
        Canvas Test - Matrix Pattern
      </div>
    </div>
  );
};

export default CanvasTest;
