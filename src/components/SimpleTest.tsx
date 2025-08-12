import React, { useEffect, useRef } from 'react';
import { MatrixRain } from '../utils/MatrixRain';

const SimpleTest: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    const pattern = new MatrixRain(ctx, {
      characters: '01{}[]()<>/*+-=;:.,!@#$%^&',
      speed: 'medium',
      density: 'medium'
    });

    pattern.initialize();

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
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <canvas 
        ref={canvasRef}
        style={{ border: '1px solid #00ff00' }}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#00ff00',
        fontFamily: 'monospace'
      }}>
        Simple Matrix Test
      </div>
    </div>
  );
};

export default SimpleTest;
