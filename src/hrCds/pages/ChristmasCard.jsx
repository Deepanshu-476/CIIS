import React, { useState, useEffect, useRef } from 'react';

const ChristmasPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCardOpened, setIsCardOpened] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const musicRef = useRef(null);
  
  
  useEffect(() => {
    const checkAndShowPopup = () => {
      const lastShown = localStorage.getItem('christmasPopupLastShown');
      const today = new Date().toDateString();
      
      
      if (lastShown !== today) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem('christmasPopupLastShown', today);
        }, 2000); 
        return timer;
      }
      return null;
    };
    
    const timer = checkAndShowPopup();
    return () => timer && clearTimeout(timer);
  }, []);
  
  
  useEffect(() => {
    if (isOpen) {
      createSnowfall();
      createChristmasLights();
      createReindeer();
      
      
      const timer = setTimeout(() => {
        if (!isCardOpened) handleOpenCard();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const createSnowfall = () => {
    const snowfallContainer = document.getElementById('snowfall');
    if (!snowfallContainer) return;
    
    
    snowfallContainer.innerHTML = '';
    
    for (let i = 0; i < 150; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      const size = Math.random() * 10 + 5;
      snowflake.style.width = size + 'px';
      snowflake.style.height = size + 'px';
      snowflake.style.left = Math.random() * 100 + '%';
      snowflake.style.top = Math.random() * -20 + 'px';
      snowflake.style.opacity = Math.random() * 0.7 + 0.3;
      snowfallContainer.appendChild(snowflake);

      const duration = Math.random() * 10 + 10;
      const horizontalDrift = (Math.random() - 0.5) * 200;
      
      const animation = snowflake.animate([
        { transform: 'translate(0, 0)', opacity: snowflake.style.opacity },
        { transform: `translate(${horizontalDrift}px, 100vh)`, opacity: 0 }
      ], {
        duration: duration * 1000,
        easing: 'linear',
        delay: Math.random() * 5 * 1000
      });
      
      animation.onfinish = () => {
        snowflake.style.top = '-20px';
        snowflake.style.left = Math.random() * 100 + '%';
        
        snowflake.animate([
          { transform: 'translate(0, 0)', opacity: snowflake.style.opacity },
          { transform: `translate(${horizontalDrift}px, 100vh)`, opacity: 0 }
        ], {
          duration: duration * 1000,
          easing: 'linear'
        });
      };
    }
  };
  
  const createChristmasLights = () => {
    const lightsContainer = document.getElementById('christmasLights');
    if (!lightsContainer) return;
    
    
    lightsContainer.innerHTML = '';
    
    const colors = ['#ff3333', '#2e7d32', '#ffeb3b', '#2196f3', '#9c27b0', '#ff9800'];
    
    for (let i = 0; i < 20; i++) {
      const light = document.createElement('div');
      light.className = 'light';
      light.style.backgroundColor = colors[i % colors.length];
      light.style.left = (i * 5) + '%';
      lightsContainer.appendChild(light);
    }
  };
  
  const createReindeer = () => {
    
    document.querySelectorAll('.reindeer').forEach(el => el.remove());
    
    const reindeers = ['🦌', '🦌', '🦌', '🦌'];
    
    reindeers.forEach((reindeerEmoji, index) => {
      const deer = document.createElement('div');
      deer.className = 'reindeer';
      deer.textContent = reindeerEmoji;
      deer.style.fontSize = (Math.random() * 2 + 2) + 'rem';
      deer.style.top = Math.random() * 70 + 10 + '%';
      deer.style.animationDelay = index * 5 + 's';
      deer.style.animationDuration = (Math.random() * 10 + 15) + 's';
      document.body.appendChild(deer);
    });
  };
  
  const createConfetti = () => {
    const confettiContainer = document.getElementById('confettiContainer');
    if (!confettiContainer) return;
    
    const colors = ['#ff3333', '#2e7d32', '#ffeb3b', '#2196f3', '#ff9800', '#9c27b0'];
    
    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 15 + 10;
      
      confetti.style.width = size + 'px';
      confetti.style.height = size + 'px';
      confetti.style.backgroundColor = color;
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      
      confettiContainer.appendChild(confetti);

      const duration = Math.random() * 3 + 2;
      const horizontalDrift = (Math.random() - 0.5) * 300;
      const rotation = Math.random() * 720 - 360;

      const animation = confetti.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${horizontalDrift}px, 100vh) rotate(${rotation}deg)`, opacity: 0 }
      ], {
        duration: duration * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        delay: Math.random() * 1000
      });
      
      animation.onfinish = () => confetti.remove();
    }
  };
  
  const createParticleBurst = (x, y) => {
    const particles = 30;
    
    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
      particle.style.zIndex = '1000';
      particle.style.pointerEvents = 'none';
      document.body.appendChild(particle);

      const angle = (i / particles) * Math.PI * 2;
      const distance = Math.random() * 150 + 50;
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      const size = Math.random() * 8 + 4;

      particle.animate([
        { 
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 1,
          width: '0px',
          height: '0px'
        },
        { 
          transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) scale(1)`,
          opacity: 0.7,
          width: `${size}px`,
          height: `${size}px`
        },
        { 
          transform: `translate(calc(-50% + ${endX * 1.2}px), calc(-50% + ${endY * 1.2}px)) scale(0)`,
          opacity: 0,
          width: '0px',
          height: '0px'
        }
      ], {
        duration: 1200,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => particle.remove();
    }
  };
  
  const handleToggleMusic = () => {
    if (musicRef.current) {
      if (isMusicPlaying) {
        musicRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        musicRef.current.play().catch(e => {
          void 0;
          alert("Click the music button again to play Christmas music!");
        });
        setIsMusicPlaying(true);
      }
    }
  };
  
  const handleOpenCard = () => {
    if (isCardOpened) return;
    setIsCardOpened(true);

    setTimeout(() => {
      createConfetti();
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          createParticleBurst(x, y);
        }, i * 400);
      }
    }, 800);

    setTimeout(() => {
      handleToggleMusic();
    }, 1000);
  };
  
  const handleResetCard = () => {
    setIsCardOpened(false);
    if (isMusicPlaying) {
      handleToggleMusic();
    }
  };
  
  const handleCardClick = (e) => {
    if (!isCardOpened) {
      handleOpenCard();
      createParticleBurst(e.clientX, e.clientY);
    }
  };
  
  const handleClosePopup = () => {
    if (isMusicPlaying) {
      handleToggleMusic();
    }
    
    document.querySelectorAll('.reindeer').forEach(el => el.remove());
    const snowfallEl = document.getElementById('snowfall');
    const lightsEl = document.getElementById('christmasLights');
    if (snowfallEl) snowfallEl.innerHTML = '';
    if (lightsEl) lightsEl.innerHTML = '';
    
    setIsOpen(false);
    setIsCardOpened(false);
  };
  
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClosePopup();
      }
      if ((e.key === ' ' || e.key === 'm') && isOpen) {
        handleToggleMusic();
      }
      if (e.key === 'Enter' && isOpen && !isCardOpened) {
        handleOpenCard();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCardOpened]);
  
  
  const ornaments = [
    { top: '20px', left: '-10px', backgroundColor: '#ff3333', animationDelay: '0s' },
    { top: '30px', right: '-15px', backgroundColor: '#ffeb3b', animationDelay: '0.2s' },
    { top: '60px', left: '-25px', backgroundColor: '#2196f3', animationDelay: '0.4s' },
    { top: '70px', right: '-5px', backgroundColor: '#9c27b0', animationDelay: '0.6s' },
    { top: '100px', left: '0px', backgroundColor: '#ff9800', animationDelay: '0.8s' },
    { top: '110px', right: '-30px', backgroundColor: '#00bcd4', animationDelay: '1s' },
  ];
  
  
  const giftBoxColors = [
    'linear-gradient(135deg, #ff3333, #c62828)',
    'linear-gradient(135deg, #2e7d32, #1b5e20)',
    'linear-gradient(135deg, #2196f3, #0d47a1)',
    'linear-gradient(135deg, #ffeb3b, #fbc02d)',
  ];
  
  const giftBoxAnimations = ['0s', '0.3s', '0.6s', '0.9s'];

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
        /* Christmas Popup Styles */
        .christmas-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Snowfall */
        .snowfall {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        
        .snowflake {
          position: absolute;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
          filter: drop-shadow(0 0 5px white);
        }
        
        /* Northern Lights Effect */
        .northern-lights {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 40%;
          background: linear-gradient(180deg, 
              rgba(94, 198, 157, 0.3) 0%, 
              rgba(92, 177, 214, 0.4) 20%, 
              rgba(168, 113, 207, 0.3) 40%, 
              rgba(241, 92, 128, 0.2) 60%,
              transparent 100%);
          opacity: 0.7;
          z-index: 0;
          animation: aurora 20s ease-in-out infinite alternate;
        }
        
        @keyframes aurora {
          0% { filter: hue-rotate(0deg); transform: scaleY(1); }
          50% { filter: hue-rotate(30deg); transform: scaleY(1.1); }
          100% { filter: hue-rotate(-30deg); transform: scaleY(1); }
        }
        
        /* Christmas Lights */
        .christmas-lights {
          position: fixed;
          top: 20px;
          left: 0;
          width: 100%;
          height: 30px;
          z-index: 100;
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        
        .light {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          position: relative;
          animation: lightTwinkle 1.5s infinite alternate;
        }
        
        .light:nth-child(odd) { animation-delay: 0.5s; }
        .light:nth-child(3n) { animation-delay: 1s; }
        
        .light::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 10px;
          background: #333;
        }
        
        @keyframes lightTwinkle {
          0% { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 20px currentColor; }
        }
        
        /* Main Container */
        .main-container {
          position: relative;
          z-index: 10;
          perspective: 1500px;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 800px;
        }
        
        /* Click Hint */
        .click-hint {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          color: #fff;
          font-size: 1.2rem;
          text-align: center;
          animation: bounce 1s infinite, glow 2s infinite alternate;
          opacity: 1;
          transition: opacity 0.5s;
          z-index: 100;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
          font-family: 'Mountains of Christmas', cursive;
          font-size: 1.5rem;
        }
        
        .click-hint.hidden {
          opacity: 0;
          pointer-events: none;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        
        @keyframes glow {
          0% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.7), 0 0 20px rgba(255, 255, 255, 0.5); }
          100% { text-shadow: 0 0 20px #ff3333, 0 0 30px #ff3333, 0 0 40px #ff3333; }
        }
        
        /* Christmas Card Container */
        .card-wrapper {
          position: relative;
          width: 380px;
          height: 500px;
          cursor: pointer;
          transition: transform 0.3s;
          margin-top: 50px;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5));
        }
        
        @media (min-width: 768px) {
          .card-wrapper {
            width: 700px;
            height: 450px;
          }
        }
        
        .card-wrapper:hover {
          transform: scale(1.02) translateY(-5px);
        }
        
        .card-wrapper.opened {
          pointer-events: none;
        }
        
        /* Closed Card (Looks like a present) */
        .card-closed {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #c62828 0%, #b71c1c 100%);
          border-radius: 15px;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4), 0 20px 60px rgba(183, 28, 28, 0.6);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          z-index: 20;
          transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-wrapper.opened .card-closed {
          transform: rotateY(180deg) scale(0.8);
          opacity: 0;
          pointer-events: none;
        }
        
        /* Present Ribbon */
        .present-ribbon {
          position: absolute;
          width: 100%;
          height: 60px;
          background: linear-gradient(90deg, #2e7d32 0%, #4caf50 50%, #2e7d32 100%);
          z-index: 21;
        }
        
        .present-ribbon.horizontal {
          top: 50%;
          transform: translateY(-50%);
        }
        
        .present-ribbon.vertical {
          width: 60px;
          height: 100%;
          left: 50%;
          transform: translateX(-50%);
        }
        
        /* Present Bow */
        .present-bow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 22;
          width: 100px;
          height: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .bow-center {
          width: 50px;
          height: 50px;
          background: linear-gradient(145deg, #ffeb3b 0%, #fbc02d 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(45deg);
          box-shadow: 0 5px 30px rgba(251, 192, 45, 0.8);
          animation: bowPulse 2s infinite;
        }
        
        @keyframes bowPulse {
          0%, 100% { transform: rotate(45deg) scale(1); }
          50% { transform: rotate(45deg) scale(1.2); }
        }
        
        .bow-loop {
          position: absolute;
          width: 40px;
          height: 60px;
          background: linear-gradient(145deg, #2e7d32 0%, #4caf50 100%);
          border-radius: 50%;
        }
        
        .bow-loop.left {
          left: 0;
          transform: rotate(-45deg);
        }
        
        .bow-loop.right {
          right: 0;
          transform: rotate(45deg);
        }
        
        /* Card Content (Inside) */
        .card-content {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #1b5e20 0%, #2e7d32 30%, #388e3c 70%, #1b5e20 100%);
          border-radius: 15px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5);
          opacity: 0;
          transform: rotateY(-180deg) scale(0.8);
          transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 19;
          overflow: hidden;
        }
        
        .card-wrapper.opened .card-content {
          opacity: 1;
          transform: rotateY(0deg) scale(1);
        }
        
        /* Card Top Border */
        .card-top-border {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 12px;
          background: linear-gradient(90deg, #c62828, #2e7d32, #ffeb3b, #2e7d32, #c62828);
          background-size: 200% 100%;
          animation: gradientMove 3s linear infinite;
          z-index: 1;
        }
        
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        
        /* Christmas Tree */
        .christmas-tree {
          position: relative;
          margin: 20px 0;
          animation: treeFloat 4s ease-in-out infinite;
        }
        
        @keyframes treeFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          75% { transform: translateY(5px) rotate(-1deg); }
        }
        
        .tree {
          position: relative;
          width: 0;
          height: 0;
          border-left: 60px solid transparent;
          border-right: 60px solid transparent;
          border-bottom: 100px solid #2e7d32;
          margin-bottom: 10px;
        }
        
        .tree::before {
          content: '';
          position: absolute;
          top: 30px;
          left: -45px;
          width: 0;
          height: 0;
          border-left: 45px solid transparent;
          border-right: 45px solid transparent;
          border-bottom: 80px solid #388e3c;
        }
        
        .tree::after {
          content: '';
          position: absolute;
          top: 60px;
          left: -30px;
          width: 0;
          height: 0;
          border-left: 30px solid transparent;
          border-right: 30px solid transparent;
          border-bottom: 60px solid #43a047;
        }
        
        .tree-trunk {
          width: 20px;
          height: 30px;
          background: #8d6e63;
          margin: 0 auto;
        }
        
        /* Tree Ornaments */
        .ornament {
          position: absolute;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          animation: ornamentGlow 2s infinite alternate;
        }
        
        @keyframes ornamentGlow {
          0% { transform: scale(1); box-shadow: 0 0 10px currentColor; }
          100% { transform: scale(1.3); box-shadow: 0 0 20px currentColor; }
        }
        
        /* Tree Star */
        .tree-star {
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          color: #ffeb3b;
          font-size: 2.5rem;
          animation: starSpin 3s linear infinite, starGlow 2s infinite alternate;
          text-shadow: 0 0 20px #ffeb3b;
          z-index: 2;
        }
        
        @keyframes starSpin {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
        
        @keyframes starGlow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.5); }
        }
        
        /* Christmas Title */
        .christmas-title {
          font-family: 'Mountains of Christmas', cursive;
          font-size: 3.5rem;
          background: linear-gradient(135deg, #ff3333 0%, #2e7d32 25%, #ffeb3b 50%, #2e7d32 75%, #ff3333 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine 3s linear infinite, titleFloat 4s ease-in-out infinite;
          margin: 10px 0;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes shine {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        /* Christmas Message */
        .christmas-message {
          font-size: 1.1rem;
          color: #fff;
          line-height: 1.6;
          margin: 15px 0;
          text-align: center;
          max-width: 80%;
          opacity: 0;
          animation: fadeInUp 1s ease-out 1s forwards, messageFloat 5s ease-in-out infinite 2s;
          font-family: 'Great Vibes', cursive;
          font-size: 1.5rem;
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes messageFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        /* Santa */
        .santa-container {
          position: absolute;
          bottom: 20px;
          right: 20px;
          animation: santaFloat 5s ease-in-out infinite;
        }
        
        @keyframes santaFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(-5px); }
          75% { transform: translateY(5px) translateX(5px); }
        }
        
        .santa {
          font-size: 3rem;
          filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5));
        }
        
        /* Snowman */
        .snowman-container {
          position: absolute;
          bottom: 20px;
          left: 20px;
          animation: snowmanFloat 6s ease-in-out infinite;
        }
        
        @keyframes snowmanFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(3deg); }
          75% { transform: translateY(5px) rotate(-3deg); }
        }
        
        .snowman {
          font-size: 3rem;
          filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5));
        }
        
        /* Gift Boxes */
        .gift-boxes {
          position: absolute;
          bottom: -100px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
          opacity: 0;
          transition: all 1s ease-out;
        }
        
        .card-wrapper.opened .gift-boxes {
          opacity: 1;
          bottom: 50px;
        }
        
        .gift-box {
          width: 60px;
          height: 60px;
          position: relative;
          animation: giftFloat 3s ease-in-out infinite;
          filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
        }
        
        .gift-box::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          top: 10px;
        }
        
        .gift-box::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          left: 20px;
        }
        
        @keyframes giftFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        /* Confetti */
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 15px;
          height: 15px;
          top: -20px;
          opacity: 0;
        }
        
        /* Fireplace */
        .fireplace {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 100px;
          background: linear-gradient(180deg, #8d6e63 0%, #5d4037 100%);
          border-radius: 10px 10px 0 0;
          overflow: hidden;
          z-index: 2;
        }
        
        .fire {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 150px;
          height: 80px;
          background: linear-gradient(180deg, #ff9800 0%, #ff5722 50%, #d84315 100%);
          border-radius: 50% 50% 0 0;
          animation: fireFlicker 0.3s infinite alternate;
          filter: blur(5px);
        }
        
        @keyframes fireFlicker {
          0% { height: 70px; opacity: 0.9; }
          100% { height: 90px; opacity: 1; }
        }
        
        /* Music Button */
        .music-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.8rem;
          color: white;
          transition: all 0.3s;
          z-index: 200;
          backdrop-filter: blur(10px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        
        .music-btn:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }
        
        /* Close Button */
        .close-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          width: 60px;
          height: 60px;
          border-radius: '50%';
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.8rem;
          color: white;
          transition: all 0.3s;
          z-index: 200;
          opacity: 0;
          pointer-events: none;
          backdrop-filter: blur(10px);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }
        
        .close-btn.visible {
          opacity: 1;
          pointer-events: auto;
          animation: btnPulse 2s infinite;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: rotate(90deg) scale(1.1);
        }
        
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3); }
          50% { box-shadow: 0 5px 30px rgba(255, 255, 255, 0.5); }
        }
        
        /* Reindeer */
        .reindeer {
          position: fixed;
          font-size: 3rem;
          opacity: 0.8;
          z-index: 5;
          animation: flyAcross 20s linear infinite;
        }
        
        @keyframes flyAcross {
          0% { transform: translateX(-100px) translateY(100px); }
          100% { transform: translateX(calc(100vw + 100px)) translateY(-100px); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .card-wrapper {
            width: 340px;
            height: 500px;
          }
        
          .christmas-title {
            font-size: 2.5rem;
          }
        
          .christmas-message {
            font-size: 1.3rem;
            max-width: 90%;
          }
        
          .tree {
            border-left: 40px solid transparent;
            border-right: 40px solid transparent;
            border-bottom: 70px solid #2e7d32;
          }
        
          .tree::before {
            left: -30px;
            border-left: 30px solid transparent;
            border-right: 30px solid transparent;
            border-bottom: 50px solid #388e3c;
          }
        
          .tree::after {
            left: -20px;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-bottom: 40px solid #43a047;
          }
        
          .santa-container, .snowman-container {
            position: relative;
            bottom: auto;
            right: auto;
            left: auto;
            margin: 10px;
          }
        
          .gift-box {
            width: 50px;
            height: 50px;
          }
        }
        `}
      </style>

      <div className="christmas-popup-overlay">
        
        <div className="northern-lights"></div>

        
        <div id="snowfall" className="snowfall"></div>

        
        <div id="christmasLights" className="christmas-lights"></div>

        
        <div id="confettiContainer" className="confetti-container"></div>

        
        <div className="main-container">
          <div className={`click-hint ${isCardOpened ? 'hidden' : ''}`} id="clickHint">
            🎁 Click to Open Your Christmas Gift! 🎁
          </div>

          <div 
            className={`card-wrapper ${isCardOpened ? 'opened' : ''}`}
            id="cardWrapper"
            onClick={handleCardClick}
            onMouseEnter={(e) => {
              if (!isCardOpened) {
                e.currentTarget.style.transform = 'scale(1.02) translateY(-5px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCardOpened) {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
              }
            }}
          >
            
            <div className="gift-boxes">
              {giftBoxColors.map((color, index) => (
                <div 
                  key={index}
                  className="gift-box"
                  style={{
                    background: color,
                    animationDelay: giftBoxAnimations[index],
                  }}
                ></div>
              ))}
            </div>

            
            <div className="card-content">
              <div className="card-top-border"></div>
              
              
              <div className="christmas-tree">
                <div className="tree-star">★</div>
                <div className="tree">
                  {ornaments.map((ornament, index) => (
                    <div 
                      key={index}
                      className="ornament"
                      style={ornament}
                    ></div>
                  ))}
                </div>
                <div className="tree-trunk"></div>
              </div>

              
              <h1 className="christmas-title">Merry Christmas!</h1>

              
              <p className="christmas-message">
                May your holidays be filled with joy, laughter, and all the warmth of the season. 
                Wishing you peace, happiness, and love this Christmas and throughout the coming year! 
                🎄✨
              </p>

              
              <div className="santa-container">
                <div className="santa">🎅</div>
              </div>
              <div className="snowman-container">
                <div className="snowman">⛄</div>
              </div>

              
              <div className="fireplace">
                <div className="fire"></div>
              </div>
            </div>

            
            <div className="card-closed">
              <div className="present-ribbon horizontal"></div>
              <div className="present-ribbon vertical"></div>
              <div className="present-bow">
                <div className="bow-loop left"></div>
                <div className="bow-center"></div>
                <div className="bow-loop right"></div>
              </div>
            </div>
          </div>
        </div>

        
        <button 
          className={`close-btn ${isCardOpened ? 'visible' : ''}`}
          onClick={handleClosePopup}
          id="closeBtn"
        >
          ✕
        </button>

        
        <button 
          className="music-btn"
          onClick={handleToggleMusic}
          id="musicBtn"
        >
          <i className={isMusicPlaying ? "fas fa-pause" : "fas fa-music"}></i>
        </button>

        
        <audio 
          ref={musicRef}
          id="christmasMusic" 
          loop
        >
          <source src="https://assets.mixkit.co/music/preview/mixkit-jingle-bells-311.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </>
  );
};

export default ChristmasPopup;