"use client"
import React from 'react';

export default function RoadAnimation() {
  const roadLines = Array.from({length: 8}, (_, i) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        width: '100px',
        height: '300px',
        backgroundColor: '#FFCC66',
        left: '50%',
        transform: 'translateX(-50%)',
        animation: `moveDown 15s linear infinite`,
        animationDelay: `${i * -5}s`,
        borderRadius: '12px'
      }}
    />
  ));

  return (
    <>
      <style jsx>{`
        @keyframes moveDown {
          0% {
            top: -400px;
          }
          100% {
            top: calc(100vh + 100px);
          }
        }
      `}</style>
      
      {roadLines}
    </>
  );
}