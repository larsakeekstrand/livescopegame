import React, { useState, useEffect } from 'react';
import Livescope from './Livescope';
import Lure from './Lure';
import Fish from './Fish';
import '../styles/Game.css';

const Game = () => {
  const [gameWidth, setGameWidth] = useState(800);
  const [gameHeight, setGameHeight] = useState(600);
  const [lurePosition, setLurePosition] = useState({ x: gameWidth / 2, y: 100 });
  const [fishes, setFishes] = useState([]);
  const [bottomDepth, setBottomDepth] = useState(500);
  const [isReeling, setIsReeling] = useState(false);
  const [caughtFish, setCaughtFish] = useState(null);
  const [score, setScore] = useState(0);
  const [pointNotification, setPointNotification] = useState({ show: false, points: 0, x: 0, y: 0 });

  // Initialize fishes
  useEffect(() => {
    const initialFishes = [];
    const fishCount = 10; // Increased fish count
    
    for (let i = 0; i < fishCount; i++) {
      // Determine if this fish is a pike (20% chance)
      const isPike = Math.random() < 0.2;
      
      // Fish size distribution:
      // 15% chance of very small fish (10-20)
      // 35% chance of small fish (20-30) 
      // 35% chance of medium fish (30-40)
      // 15% chance of large fish (40-60)
      let fishSize;
      const sizeRoll = Math.random();
      
      if (sizeRoll < 0.15) {
        fishSize = Math.random() * 10 + 10; // Very small: 10-20
      } else if (sizeRoll < 0.50) {
        fishSize = Math.random() * 10 + 20; // Small: 20-30
      } else if (sizeRoll < 0.85) {
        fishSize = Math.random() * 10 + 30; // Medium: 30-40
      } else {
        fishSize = Math.random() * 20 + 40; // Large: 40-60
      }
      
      // Pike are generally larger
      if (isPike) {
        fishSize = Math.max(fishSize, 30); // Ensure pike are at least medium-sized
      }
      
      initialFishes.push({
        id: i,
        x: Math.random() * gameWidth,
        y: Math.random() * (bottomDepth - 200) + 200, // Keep fish above the bottom
        size: fishSize,
        speed: isPike ? Math.random() * 3 + 2 : Math.random() * 2 + 1, // Pike are faster
        direction: Math.random() > 0.5 ? -1 : 1, // Random direction (left or right)
        caught: false,
        type: isPike ? 'pike' : 'normal',
        aggressive: isPike ? true : false,
        aggressionRange: isPike ? 150 : 0, // Pike will detect lure from this distance
        lastDirectionChange: 0 // Track time since last direction change
      });
    }
    
    setFishes(initialFishes);
  }, [gameWidth, bottomDepth]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const movementSpeed = 10;
      
      // Only allow movement if no fish is being reeled in
      if (!isReeling) {
        switch (e.key) {
          case 'ArrowLeft':
            setLurePosition(prev => ({
              ...prev,
              x: Math.max(10, prev.x - movementSpeed)
            }));
            break;
          case 'ArrowRight':
            setLurePosition(prev => ({
              ...prev,
              x: Math.min(gameWidth - 10, prev.x + movementSpeed)
            }));
            break;
          case 'ArrowUp':
            setLurePosition(prev => ({
              ...prev,
              y: Math.max(50, prev.y - movementSpeed)
            }));
            break;
          case 'ArrowDown':
            setLurePosition(prev => ({
              ...prev,
              y: Math.min(bottomDepth - 20, prev.y + movementSpeed)
            }));
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lurePosition, gameWidth, bottomDepth, isReeling, caughtFish]);

  // Move fishes and check for lure catches
  useEffect(() => {
    if (isReeling) {
      return; // Don't move fish while reeling
    }
    
    const fishMovementInterval = setInterval(() => {
      setFishes(currentFishes => {
        return currentFishes.map(fish => {
          if (fish.caught) return fish;
          
          // Check if fish should catch the lure
          const distanceToLure = Math.sqrt(
            Math.pow(fish.x - lurePosition.x, 2) + 
            Math.pow(fish.y - lurePosition.y, 2)
          );
          
          // Pike have a higher chance to catch the lure
          const catchThreshold = fish.type === 'pike' ? fish.size / 2 + 15 : fish.size / 2 + 10;
          
          if (distanceToLure < catchThreshold) {
            setCaughtFish(fish);
            setIsReeling(true); // Start reeling immediately when fish is caught
            return { ...fish, caught: true };
          }
          
          // Move fish
          let newX = fish.x;
          let newDirection = fish.direction;
          let newLastDirectionChange = fish.lastDirectionChange + 1;
          
          // Pike fish will actively seek the lure if within range
          if (fish.aggressive && distanceToLure < fish.aggressionRange) {
            // Calculate direction to lure
            const directionToLure = lurePosition.x > fish.x ? 1 : -1;
            newDirection = directionToLure;
            
            // If pike is close to lure on x-axis, adjust y position to approach lure
            if (Math.abs(fish.x - lurePosition.x) < 100) {
              const newY = fish.y + (lurePosition.y > fish.y ? 1 : -1) * (fish.speed / 2);
              if (newY > 50 && newY < bottomDepth - 20) {
                fish.y = newY;
              }
            }
          } 
          // Regular fish movement with occasional direction changes
          else if (fish.lastDirectionChange > 100 && Math.random() < 0.05) {
            newDirection = -fish.direction;
            newLastDirectionChange = 0;
          }
          
          newX = fish.x + (fish.speed * newDirection);
          
          // Reverse direction if fish hits the boundary
          if (newX < 0 || newX > gameWidth) {
            return {
              ...fish,
              x: fish.x,
              direction: -newDirection,
              lastDirectionChange: 0
            };
          }
          
          return {
            ...fish,
            x: newX,
            direction: newDirection,
            lastDirectionChange: newLastDirectionChange
          };
        });
      });
    }, 50);
    
    return () => clearInterval(fishMovementInterval);
  }, [lurePosition, gameWidth, bottomDepth, isReeling]);

  // Handle reeling
  useEffect(() => {
    if (isReeling && caughtFish) {
      const reelingInterval = setInterval(() => {
        setFishes(currentFishes => {
          return currentFishes.map(fish => {
            if (fish.id === caughtFish.id) {
              const newY = fish.y - 5;
              
              // Check if the fish has been reeled to the top
              if (newY <= 50) {
                clearInterval(reelingInterval);
                setIsReeling(false);
                
                let scaledPoints;
                
                if (fish.type === 'pike') {
                  // Pike give negative points based on size
                  // Make larger pike give significantly more negative points
                  const sizeMultiplier = fish.size / 20;
                  scaledPoints = -Math.round(Math.pow(sizeMultiplier, 3) * 30);
                } else {
                  // Regular fish give positive points
                  // Very small fish (size ~15) will get ~5-10 points
                  // Small fish (size ~25) will get ~15-25 points
                  // Medium fish (size ~35) will get ~40-60 points
                  // Large fish (size ~50) will get ~100-150 points
                  const sizeMultiplier = fish.size / 20; // Base divisor of 20 to normalize size
                  scaledPoints = Math.round(Math.pow(sizeMultiplier, 2.5) * 20);
                }
                
                setScore(score + scaledPoints);
                
                // Show point notification
                setPointNotification({
                  show: true,
                  points: scaledPoints,
                  x: fish.x,
                  y: 50
                });
                
                // Hide notification after 1.5 seconds
                setTimeout(() => {
                  setPointNotification({ show: false, points: 0, x: 0, y: 0 });
                }, 1500);
                
                setCaughtFish(null);
                
                // Determine if the new fish should be a pike (20% chance)
                const isPike = Math.random() < 0.2;
                
                // Remove this fish and add a new one
                return {
                  ...fish,
                  y: Math.random() * (bottomDepth - 200) + 200,
                  x: Math.random() * gameWidth,
                  caught: false,
                  direction: Math.random() > 0.5 ? -1 : 1, // Random direction (left or right)
                  type: isPike ? 'pike' : 'normal',
                  speed: isPike ? Math.random() * 3 + 2 : Math.random() * 2 + 1, // Pike are faster
                  aggressive: isPike ? true : false,
                  aggressionRange: isPike ? 150 : 0,
                  lastDirectionChange: 0
                };
              }
              
              return {
                ...fish,
                y: newY
              };
            }
            return fish;
          });
        });
        
        // Move lure with the fish
        setLurePosition(prev => ({
          ...prev,
          y: Math.max(prev.y - 5, 50)
        }));
      }, 50);
      
      return () => clearInterval(reelingInterval);
    }
  }, [isReeling, caughtFish, bottomDepth, gameWidth, score]);

  return (
    <div className="game-container">
      <div className="score-board">Score: {score}</div>
      <div className="game-content">
        <div className="game-area" style={{ width: gameWidth, height: gameHeight }}>
          <Livescope width={gameWidth} height={gameHeight} bottomDepth={bottomDepth} />
          
          <Lure x={lurePosition.x} y={lurePosition.y} />
          
          {fishes.map(fish => (
            <Fish
              key={fish.id}
              x={fish.x}
              y={fish.y}
              size={fish.size}
              direction={fish.direction}
              caught={fish.caught}
              type={fish.type}
            />
          ))}
          
          {pointNotification.show && (
            <div 
              className={`point-notification ${pointNotification.points < 0 ? 'negative' : ''}`}
              style={{
                left: `${pointNotification.x}px`,
                top: `${pointNotification.y}px`
              }}
            >
              {pointNotification.points > 0 ? '+' : ''}{pointNotification.points}
            </div>
          )}
        </div>
        
        <div className="game-instructions">
          <h2>LiveScope Fishing Game</h2>
          <ul>
            <li><span className="key-command">↑ ↓ ← →</span> Move lure</li>
            <li>Fish are automatically reeled in when caught</li>
            <li>Bigger fish are worth exponentially more points!</li>
            <li>Fish sizes: Small (5-25 pts), Medium (40-60 pts), Large (100-150+ pts)</li>
            <li><span className="warning">Warning!</span> Pikes give negative points and will actively hunt your lure!</li>
            <li>Watch for fish approaching your lure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Game;
