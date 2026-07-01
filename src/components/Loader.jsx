import React from 'react';
import './Loader.css';

const Loader = ({ 
  size = 'medium', 
  color = '#667eea', 
  message = 'Loading...',
  showMessage = true,
  type = 'modern' 
}) => {
  
  const sizeClasses = {
    small: { barWidth: '6px', barHeight: '30px', container: 'w-20' },
    medium: { barWidth: '8px', barHeight: '40px', container: 'w-24' },
    large: { barWidth: '10px', barHeight: '50px', container: 'w-28' }
  };

  const { barWidth, barHeight, container } = sizeClasses[size];

  return (
    <div className="loader-overlay">
      <div className="loader-container">
        
        {type === 'modern' && (
          <div className={`modern-loader ${container}`}>
            <div 
              className="bar" 
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: color
              }}
            ></div>
            <div 
              className="bar" 
              style={{
                width: barWidth,
                height: barHeight,  
                backgroundColor: color
              }}
            ></div>
            <div 
              className="bar" 
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: color
              }}
            ></div>
          </div>
        )}

        
        {type === 'spinner' && (
          <div 
            className="spinner" 
            style={{
              width: barHeight,
              height: barHeight,
              borderColor: `${color}20`,
              borderTopColor: color
            }}
          ></div>
        )}

        
        {type === 'dots' && (
          <div className="dots-loader">
            <div className="dot" style={{ backgroundColor: color }}></div>
            <div className="dot" style={{ backgroundColor: color }}></div>
            <div className="dot" style={{ backgroundColor: color }}></div>
          </div>
        )}

        
        {showMessage && (
          <p className="loader-text" style={{ color }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;