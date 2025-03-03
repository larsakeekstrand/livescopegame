import React from 'react';
import '../styles/Lure.css';

const Lure = ({ x, y }) => {
  return (
    <div className="lure-container" style={{ left: `${x}px`, top: `${y}px` }}>
      <div className="fishing-line"></div>
      <div className="lure-body">
        <div className="lure-top"></div>
        <div className="lure-middle"></div>
        <div className="lure-bottom"></div>
        <div className="treble-hook"></div>
      </div>
    </div>
  );
};

export default Lure;
