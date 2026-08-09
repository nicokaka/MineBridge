import React, { useMemo } from 'react';

export const Particles: React.FC = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 4 + 2}px`,
        duration: `${Math.random() * 10 + 8}s`,
        delay: `${Math.random() * 5}s`,
        color: i % 3 === 0 ? '#17dd62' : i % 3 === 1 ? '#a020f0' : '#2cb9a8',
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};
