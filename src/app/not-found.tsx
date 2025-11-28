"use client";

import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';

export default function NotFound() {
  const [position, setPosition] = useState(0);
  const [jumping, setJumping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleJump = () => {
    setJumping(true);
    setTimeout(() => setJumping(false), 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated clouds */}
      <div className="absolute top-10 left-0 w-full">
        <div 
          className="absolute bg-white rounded-full w-24 h-12 opacity-70"
          style={{ 
            left: `${position}%`,
            transition: 'left 0.05s linear'
          }}
        />
        <div 
          className="absolute bg-white rounded-full w-32 h-14 opacity-60 top-20"
          style={{ 
            left: `${(position + 30) % 100}%`,
            transition: 'left 0.05s linear'
          }}
        />
        <div 
          className="absolute bg-white rounded-full w-28 h-10 opacity-50 top-40"
          style={{ 
            left: `${(position + 60) % 100}%`,
            transition: 'left 0.05s linear'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* LEGO-style characters */}
        <div className="flex justify-center items-end gap-8 mb-8">
          {/* Left character - animated bounce */}
          <div 
            className="animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '2s' }}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg mb-1 mx-auto shadow-lg" />
              <div className="w-16 h-20 bg-red-500 rounded-lg shadow-lg" />
              <div className="w-16 h-24 bg-blue-600 rounded-lg mt-1 shadow-lg" />
              <div className="absolute top-3 left-4 w-2 h-2 bg-black rounded-full" />
              <div className="absolute top-3 right-4 w-2 h-2 bg-black rounded-full" />
              <div className="absolute top-6 left-3 w-6 h-1 bg-black rounded-full" />
            </div>
          </div>

          {/* Center 404 text */}
          <div className="relative">
            <h1 
              className="text-9xl font-bold text-yellow-400 drop-shadow-2xl"
              style={{
                textShadow: '4px 4px 0px #ef4444, 8px 8px 0px #3b82f6',
                transform: jumping ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                transition: 'transform 0.3s ease'
              }}
            >
              404
            </h1>
          </div>

          {/* Right character - animated bounce */}
          <div 
            className="animate-bounce"
            style={{ animationDelay: '1s', animationDuration: '2s' }}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-yellow-400 rounded-lg mb-1 mx-auto shadow-lg" />
              <div className="w-16 h-20 bg-green-500 rounded-lg shadow-lg" />
              <div className="w-16 h-24 bg-orange-500 rounded-lg mt-1 shadow-lg" />
              <div className="absolute top-3 left-4 w-2 h-2 bg-black rounded-full" />
              <div className="absolute top-3 right-4 w-2 h-2 bg-black rounded-full" />
              <div className="absolute top-7 left-5 w-4 h-2 bg-black rounded-full" />
            </div>
          </div>
        </div>

        {/* Text content */}
        <div className="bg-white bg-opacity-90 rounded-3xl p-8 shadow-2xl max-w-md mx-auto backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Oops! Brick Not Found
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            Looks like this page got lost in the toy box! Let's build you a way back home.
          </p>
          
          <button
            onClick={handleJump}
            className="group bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center gap-3 mx-auto"
          >
            <Home className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Return Home
          </button>
        </div>

        {/* LEGO studs decoration */}
        <div className="flex justify-center gap-4 mt-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 bg-red-500 rounded-full shadow-lg animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom bricks decoration */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-gray-800 to-transparent" />
    </div>
  );
}