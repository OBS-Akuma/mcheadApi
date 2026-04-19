import React, { useState, useEffect, useRef } from 'react';

const MinecraftFaceViewer = ({ textureUrl, size = 128, className = '' }) => {
  const [faceImageUrl, setFaceImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelType, setModelType] = useState(null);

  // Function to get proxied URL
  const getProxiedUrl = (url) => {
    if (!url) return null;
    // Use relative path for API route
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // Extract face from skin using proxy
  const extractFaceFromSkin = async (url, isSlim = false) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Use proxied URL to avoid CORS
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const skinWidth = img.width;
          const skinHeight = img.height;
          
          let faceX = 8;
          let faceY = 8;
          let faceW = 8;
          let faceH = 8;
          
          const targetSize = 64;
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            img,
            faceX, faceY, faceW, faceH,
            0, 0, targetSize, targetSize
          );
          
          // Handle hat layer for 64x64 skins
          if (skinHeight === 64 && skinWidth === 64) {
            const hatX = 40;
            const hatY = 8;
            
            const hatCanvas = document.createElement('canvas');
            hatCanvas.width = targetSize;
            hatCanvas.height = targetSize;
            const hatCtx = hatCanvas.getContext('2d');
            hatCtx.imageSmoothingEnabled = false;
            hatCtx.drawImage(
              img,
              hatX, hatY, faceW, faceH,
              0, 0, targetSize, targetSize
            );
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(hatCanvas, 0, 0);
          }
          
          resolve(canvas.toDataURL());
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load skin texture - CORS or invalid image'));
      };
      
      // Use proxied URL
      img.src = getProxiedUrl(url);
    });
  };

  const detectSkinModel = async (url) => {
    // For now, return normal as default
    // You can enhance this to detect from the proxied image
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Simple detection logic
          if (img.width === 64 && img.height === 64) {
            // Check for slim arm indicator (approximate)
            const pixelData = ctx.getImageData(42, 20, 1, 1).data;
            if (pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0) {
              resolve('slim');
            } else {
              resolve('normal');
            }
          } else {
            resolve('normal');
          }
        } catch (e) {
          resolve('normal');
        }
      };
      
      img.onerror = () => resolve('normal');
      img.src = getProxiedUrl(url);
    });
  };

  const loadFace = async () => {
    if (!textureUrl) {
      setFaceImageUrl(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const model = await detectSkinModel(textureUrl);
      setModelType(model);
      
      const faceDataUrl = await extractFaceFromSkin(textureUrl, model === 'slim');
      setFaceImageUrl(faceDataUrl);
    } catch (err) {
      console.error('Error loading face:', err);
      setError(err.message || 'Failed to load skin texture');
      setFaceImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (textureUrl) {
      loadFace();
    } else {
      setFaceImageUrl(null);
      setError(null);
      setModelType(null);
    }
  }, [textureUrl]);

  return (
    <div className={`minecraft-face-viewer ${className}`}>
      {isLoading && (
        <div className="face-loading">
          <div className="loading-spinner"></div>
          <span>Loading skin...</span>
        </div>
      )}
      
      {error && (
        <div className="face-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {faceImageUrl && !isLoading && (
        <div className="face-display">
          <img 
            src={faceImageUrl} 
            alt="Minecraft Skin Face"
            width={size}
            height={size}
            style={{ 
              imageRendering: 'pixelated',
              imageRendering: 'crisp-edges',
              width: size,
              height: size
            }}
          />
          {modelType && (
            <div className="model-badge">
              {modelType === 'slim' ? '👧 Alex (Slim)' : '👨 Steve (Normal)'}
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .minecraft-face-viewer {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .face-loading, .face-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
        }
        
        .face-error {
          background: rgba(220, 50, 50, 0.9);
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .face-display {
          position: relative;
          display: inline-block;
        }
        
        .face-display img {
          display: block;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          background: #2a2a2a;
        }
        
        .model-badge {
          position: absolute;
          bottom: -8px;
          right: -8px;
          background: #1a1a1a;
          color: #ffd966;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 1px solid #ffd966;
        }
      `}</style>
    </div>
  );
};

export default MinecraftFaceViewer;
