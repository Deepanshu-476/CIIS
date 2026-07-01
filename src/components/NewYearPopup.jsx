import React, { useState, useEffect, useRef } from 'react';

const NewYearPopup = () => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const fireworksRef = useRef(null);
  const confettiRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  
  const keyframes = `
    @keyframes popupAppear {
      0% { transform: scale(0.8); opacity: 0; }
      70% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes yearGlow {
      0% { text-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 140, 0, 0.3); }
      100% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 140, 0, 0.5), 0 0 40px rgba(255, 0, 128, 0.3); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes celebrateButton {
      0% { transform: scale(1); }
      100% { transform: scale(1.1); }
    }
    
    @keyframes fireworkLaunch {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(var(--firework-top, 50%)) scale(1); opacity: 1; }
    }
    
    @keyframes confettiFall {
      0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
  `;

  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const nextYear = currentYear < 2026 ? 2026 : currentYear + 1;
      const targetDate = new Date(`January 1, ${nextYear} 00:00:00`);
      const timeDiff = targetDate - now;

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  
  const createFireworks = () => {
    if (!fireworksRef.current) return;
    
    const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff8c00'];
    
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const firework = document.createElement('div');
        firework.style.position = 'absolute';
        firework.style.width = '8px';
        firework.style.height = '8px';
        firework.style.borderRadius = '50%';
        firework.style.boxShadow = '0 0 15px currentColor';
        firework.style.left = `${Math.random() * 100}%`;
        firework.style.top = `${Math.random() * 100}%`;
        firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        firework.style.animation = 'fireworkLaunch 1s ease-out forwards';
        
        fireworksRef.current.appendChild(firework);

        
        createParticles(firework);

        
        setTimeout(() => {
          if (firework.parentNode) {
            firework.parentNode.removeChild(firework);
          }
        }, 1000);
      }, i * 200);
    }
  };

  
  const createParticles = (firework) => {
    const particles = 20;
    const color = firework.style.backgroundColor;
    const fireworkRect = firework.getBoundingClientRect();
    
    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = color;
      particle.style.left = `${fireworkRect.left}px`;
      particle.style.top = `${fireworkRect.top}px`;
      particle.style.pointerEvents = 'none';
      
      fireworksRef.current.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 3;
      let vx = Math.cos(angle) * velocity;
      let vy = Math.sin(angle) * velocity;

      let posX = 0;
      let posY = 0;
      const duration = 1000 + Math.random() * 500;

      const animateParticle = (startTime) => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed < duration) {
          posX += vx;
          posY += vy;
          
          
          vy += 0.05;
          
          
          const opacity = 1 - (posY / 200);
          
          particle.style.transform = `translate(${posX}px, ${posY}px)`;
          particle.style.opacity = opacity > 0 ? opacity : 0;
          
          requestAnimationFrame(() => animateParticle(startTime));
        } else {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }
      };

      requestAnimationFrame(() => animateParticle(Date.now()));
    }
  };

  
  const createConfetti = () => {
    if (!confettiRef.current) return;
    
    const colors = ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff8c00'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.opacity = '0.8';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 5 + 3}px`;
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear infinite`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      
      confettiRef.current.appendChild(confetti);
      
      
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 5000);
    }
  };

  
  const handleCelebrate = () => {
    setIsCelebrating(true);
    createFireworks();
    createConfetti();
    
    
    setTimeout(() => {
      setIsCelebrating(false);
    }, 5000);
  };

  
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  
  useEffect(() => {
    if (showPopup) {
      createFireworks();
      createConfetti();
      
      const fireworksInterval = setInterval(() => {
        createFireworks();
        createConfetti();
      }, 3000);
      
      return () => clearInterval(fireworksInterval);
    }
  }, [showPopup]);

  if (!showPopup) return null;

  
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)',
    },
    fireworksContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1,
    },
    confettiContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 2,
    },
    popupContainer: {
      position: 'relative',
      width: '90%',
      maxWidth: '800px',
      zIndex: 10000,
    },
    newYearPopup: {
      background: 'rgba(10, 10, 40, 0.95)',
      borderRadius: '20px',
      padding: '40px 30px',
      textAlign: 'center',
      boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), 0 0 100px rgba(255, 215, 0, 0.2)',
      position: 'relative',
      overflow: 'hidden',
      border: '2px solid rgba(255, 215, 0, 0.3)',
      animation: 'popupAppear 1.5s ease-out forwards',
      transform: 'scale(0.8)',
      opacity: 0,
    },
    popupDecoration: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: -1,
    },
    decorationCircle1: {
      position: 'absolute',
      borderRadius: '50%',
      border: '2px solid rgba(255, 215, 0, 0.2)',
      width: '120px',
      height: '120px',
      top: '-50px',
      left: '-50px',
      animation: 'rotate 20s linear infinite',
    },
    decorationCircle2: {
      position: 'absolute',
      borderRadius: '50%',
      border: '2px solid rgba(255, 215, 0, 0.2)',
      width: '80px',
      height: '80px',
      bottom: '-30px',
      right: '-30px',
      animation: 'rotate 15s linear infinite reverse',
    },
    popupHeader: {
      marginBottom: '25px',
    },
    yearText: {
      fontSize: '5rem',
      fontWeight: 800,
      background: 'linear-gradient(to right, #ffd700, #ff8c00, #ff0080)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
      letterSpacing: '3px',
      animation: 'yearGlow 2s infinite alternate',
    },
    message: {
      fontSize: '3.2rem',
      marginBottom: '25px',
      fontWeight: 700,
      color: '#ffd700',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      position: 'relative',
      display: 'inline-block',
    },
    messageAfter: {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: '4px',
      background: 'linear-gradient(to right, transparent, #ffd700, transparent)',
      bottom: '-10px',
      left: 0,
    },
    subMessage: {
      fontSize: '1.2rem',
      marginBottom: '35px',
      color: '#aaa',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
      lineHeight: 1.6,
    },
    countdown: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '40px',
      flexWrap: 'wrap',
    },
    countdownItem: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '15px 10px',
      minWidth: '80px',
      backdropFilter: 'blur(5px)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      animation: 'pulse 2s infinite',
    },
    countdownValue: {
      fontSize: '2.2rem',
      fontWeight: 700,
      color: '#ffd700',
      display: 'block',
    },
    countdownLabel: {
      fontSize: '0.9rem',
      color: '#ccc',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    closeBtn: {
      background: isCelebrating 
        ? 'linear-gradient(to right, #00ff00, #00ffff)' 
        : 'linear-gradient(to right, #ff8c00, #ff0080)',
      color: 'white',
      border: 'none',
      padding: '15px 40px',
      fontSize: '1.2rem',
      borderRadius: '50px',
      cursor: 'pointer',
      fontWeight: 600,
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      boxShadow: '0 5px 15px rgba(255, 140, 0, 0.4)',
      transform: isCelebrating ? 'scale(1.1)' : (isHovered ? 'translateY(-3px) scale(1)' : 'scale(1)'),
      animation: isCelebrating ? 'celebrateButton 0.5s infinite alternate' : 'none',
      marginTop: '20px',
    },
    closePopupBtn: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      color: '#fff',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.2rem',
      zIndex: 100,
      transition: 'all 0.3s ease',
    },
  };

  return (
    <div style={styles.overlay}>
      <style>{keyframes}</style>
      
      
      <div style={styles.fireworksContainer} ref={fireworksRef}></div>
      <div style={styles.confettiContainer} ref={confettiRef}></div>
      
      
      <div style={styles.popupContainer}>
        <button 
          style={styles.closePopupBtn} 
          onClick={handleClosePopup}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          ✕
        </button>
        
        <div style={styles.newYearPopup}>
          
          <div style={styles.popupDecoration}>
            <div style={styles.decorationCircle1}></div>
            <div style={styles.decorationCircle2}></div>
          </div>
          
          
          <div style={styles.popupHeader}>
            <h1 style={styles.yearText}>2026</h1>
          </div>
          
          
          <h2 style={styles.message}>
            Happy New Year!
            <span style={styles.messageAfter}></span>
          </h2>
          
          
          <p style={styles.subMessage}>
            May this new year bring you joy, success, and prosperity. 
            Wishing you a year filled with new opportunities and wonderful moments!
          </p>
          
          
          <div style={styles.countdown}>
            <div style={styles.countdownItem}>
              <span style={styles.countdownValue}>{countdown.days.toString().padStart(2, '0')}</span>
              <span style={styles.countdownLabel}>Days</span>
            </div>
            <div style={styles.countdownItem}>
              <span style={styles.countdownValue}>{countdown.hours.toString().padStart(2, '0')}</span>
              <span style={styles.countdownLabel}>Hours</span>
            </div>
            <div style={styles.countdownItem}>
              <span style={styles.countdownValue}>{countdown.minutes.toString().padStart(2, '0')}</span>
              <span style={styles.countdownLabel}>Minutes</span>
            </div>
            <div style={styles.countdownItem}>
              <span style={styles.countdownValue}>{countdown.seconds.toString().padStart(2, '0')}</span>
              <span style={styles.countdownLabel}>Seconds</span>
            </div>
          </div>
          
          
          <button 
            style={styles.closeBtn}
            onClick={handleCelebrate}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isCelebrating ? '🎉 Celebrating 2026! 🎉' : 'Celebrate 2026!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewYearPopup;