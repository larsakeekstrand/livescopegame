import React from 'react';
import '../styles/Fish.css';

const Fish = ({ x, y, size, direction, caught, type = 'normal' }) => {
  const fishStyle = {
    left: `${x}px`,
    top: `${y}px`,
    width: `${size * 1.5}px`, // More elongated body for pike-perch
    height: `${size / 2.5}px`, // Slimmer height for pike-perch
    transform: `scaleX(${direction}) rotate(180deg)`, // Added 180 degree rotation
    filter: caught ? 'brightness(1.5)' : 'none'
  };

  return (
    <div className={`fish ${caught ? 'caught' : ''} ${type}`} style={fishStyle}>
      <div className="fish-body">
        <div className="fish-eye"></div>
        <div className="fish-dorsal-fin"></div>
        <div className="fish-pelvic-fin"></div>
        <div className="fish-tail"></div>
        {type === 'pike' && <div className="fish-pike-snout"></div>}
        <div className="fish-pattern"></div>
      </div>
    </div>
  );
};

export default Fish;
