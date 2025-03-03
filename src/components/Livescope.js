import React, { useRef, useEffect } from 'react';
import '../styles/Livescope.css';

const Livescope = ({ width, height, bottomDepth }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Create an offscreen canvas for the blur effect
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');
    
    const drawLivescope = () => {
      // Clear both canvases
      ctx.clearRect(0, 0, width, height);
      offCtx.clearRect(0, 0, width, height);
      
      // Draw background (water) - orange monochrome style
      const waterGradient = offCtx.createLinearGradient(0, 0, 0, height);
      waterGradient.addColorStop(0, 'rgba(30, 10, 0, 0.9)');
      waterGradient.addColorStop(0.8, 'rgba(40, 15, 0, 0.95)');
      offCtx.fillStyle = waterGradient;
      offCtx.fillRect(0, 0, width, height);
      
      // Add noise to the background
      addNoise(offCtx, width, height, 0.03);
      
      // Draw bottom terrain
      offCtx.beginPath();
      offCtx.moveTo(0, bottomDepth);
      
      // Create a jagged bottom terrain with more variation
      let lastHeight = 0;
      for (let x = 0; x < width; x += 10) {
        // Use Perlin-like noise for smoother terrain
        const randomHeight = lastHeight * 0.85 + Math.random() * 30 * 0.15;
        lastHeight = randomHeight;
        offCtx.lineTo(x, bottomDepth + randomHeight);
      }
      
      offCtx.lineTo(width, bottomDepth);
      offCtx.lineTo(width, height);
      offCtx.lineTo(0, height);
      offCtx.closePath();
      
      // Fill the bottom with an orange gradient
      const bottomGradient = offCtx.createLinearGradient(0, bottomDepth, 0, height);
      bottomGradient.addColorStop(0, 'rgba(255, 120, 0, 0.7)');  // Bright orange
      bottomGradient.addColorStop(1, 'rgba(180, 70, 0, 0.8)');   // Darker orange
      offCtx.fillStyle = bottomGradient;
      offCtx.fill();
      
      // Draw some plants/weeds with orange monochrome style
      drawPlants(offCtx, bottomDepth);
      
      // Draw horizontal grids (depth lines)
      drawDepthLines(offCtx, width, height);
      
      // Draw some small particles in the water
      drawParticles(offCtx, width, height, bottomDepth);
      
      // Apply the offscreen canvas to the main canvas with blur effect
      ctx.filter = 'blur(2px) brightness(1.1) contrast(1.2)';
      ctx.drawImage(offscreenCanvas, 0, 0);
      ctx.filter = 'none';
      
      // Add a subtle orange overlay to enhance the monochrome effect
      ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      // Add a vignette effect
      addVignette(ctx, width, height);
    };
    
    const addNoise = (ctx, width, height, intensity) => {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 255;
        data[i] = Math.min(255, Math.max(0, data[i] + noise * 2)); // More red
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // Less green
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5)); // Even less blue
      }
      
      ctx.putImageData(imageData, 0, 0);
    };
    
    const drawDepthLines = (ctx, width, height) => {
      ctx.strokeStyle = 'rgba(255, 150, 50, 0.15)';
      ctx.lineWidth = 1;
      
      // Draw horizontal depth lines
      for (let y = 50; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Add depth markers
        ctx.fillStyle = 'rgba(255, 150, 50, 0.5)';
        ctx.font = '10px Arial';
        ctx.fillText(`${y / 5}ft`, 5, y - 5);
      }
    };
    
    const drawPlants = (ctx, bottomY) => {
      ctx.strokeStyle = 'rgba(255, 140, 30, 0.6)';
      ctx.lineWidth = 1.5;
      
      // Draw some random plants
      for (let x = 30; x < width; x += 70) {
        if (Math.random() > 0.3) { // Only draw plants at some positions
          const plantHeight = Math.random() * 100 + 40;
          const plantSegments = Math.floor(Math.random() * 4) + 2;
          
          ctx.beginPath();
          ctx.moveTo(x, bottomY);
          
          let currentY = bottomY;
          const segmentHeight = plantHeight / plantSegments;
          
          for (let s = 0; s < plantSegments; s++) {
            const controlX = x + (Math.random() * 40 - 20);
            currentY -= segmentHeight;
            ctx.quadraticCurveTo(controlX, currentY + segmentHeight / 2, x, currentY);
          }
          
          ctx.stroke();
        }
      }
    };
    
    const drawParticles = (ctx, width, height, bottomY) => {
      ctx.fillStyle = 'rgba(255, 180, 100, 0.4)';
      
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * (bottomY - 20);
        const size = Math.random() * 1.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    
    const addVignette = (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, height / 3,
        width / 2, height / 2, height
      );
      
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };
    
    // Draw initially
    drawLivescope();
    
    // Redraw occasionally for particles and noise
    const noiseInterval = setInterval(() => {
      drawLivescope();
    }, 1000);
    
    return () => clearInterval(noiseInterval);
  }, [width, height, bottomDepth]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="livescope-canvas"
      width={width} 
      height={height}
    />
  );
};

export default Livescope;
