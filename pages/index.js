import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

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
          
          // Face coordinates in Minecraft skin
          let faceX = 8;
          let faceY = 8;
          let faceW = 8;
          let faceH = 8;
          
          const targetSize = 64; // Scale 8x8 to 64x64 for better quality
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          // Disable smoothing to keep pixelated look
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            img,
            faceX, faceY, faceW, faceH,
            0, 0, targetSize, targetSize
          );
          
          // Handle hat/helmet layer for 64x64 skins
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
            
            // Composite hat layer over the base face
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
          
          // Simple detection for slim vs normal model
          // Check arm width indicator in the texture
          if (img.width === 64 && img.height === 64) {
            // Check a pixel that would be transparent in slim models
            const pixelData = ctx.getImageData(42, 20, 1, 1).data;
            // If the pixel is transparent or very dark, it might be slim
            if (pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0 && pixelData[3] < 10) {
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

export default function Home() {
  const router = useRouter();
  const [textureUrl, setTextureUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');

  // Read texture URL from query parameter
  useEffect(() => {
    const { texture } = router.query;
    if (texture && typeof texture === 'string') {
      setTextureUrl(texture);
      setCurrentUrl(texture);
      setError('');
    }
  }, [router.query]);

  const handleLoadTexture = () => {
    if (!textureUrl.trim()) {
      setError('Please enter a texture URL');
      return;
    }
    
    try {
      // Validate URL
      new URL(textureUrl);
      setError('');
      setCurrentUrl(textureUrl);
      
      // Update URL query parameter without reload
      router.push(`/?texture=${encodeURIComponent(textureUrl)}`, undefined, { shallow: true });
    } catch (e) {
      setError('Invalid URL. Please enter a valid image URL (http:// or https://)');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLoadTexture();
    }
  };

  // Example skin URLs for testing
  const exampleSkins = [
    { name: 'Steve (Normal)', url: 'https://minotar.net/skin/steve' },
    { name: 'Alex (Slim)', url: 'https://minotar.net/skin/alex' },
    { name: 'Herobrine', url: 'https://minotar.net/skin/Herobrine' },
    { name: 'Creeper', url: 'https://minotar.net/skin/Creeper' },
    { name: 'Kirka Texture', url: 'https://kirka.io/assets/img/texture.74c78eb8.webp' },
  ];

  return (
    <>
      <Head>
        <title>Minecraft Skin Face Viewer | Extract Face from Texture URL</title>
        <meta name="description" content="Extract and display just the face from any Minecraft skin texture URL. Supports both Normal (Steve) and Slim (Alex) models." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Minecraft Skin Face Viewer" />
        <meta property="og:description" content="Extract faces from any Minecraft skin texture" />
        <meta property="og:type" content="website" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🎮 Minecraft Face Viewer</h1>
          <p>Extract the face from any Minecraft skin texture URL</p>
          <p className="subtitle">Supports both Normal (Steve) and Slim (Alex) models • CORS-free with proxy</p>
        </header>

        <div className="input-section">
          <label htmlFor="texture-url">Skin Texture URL:</label>
          <div className="input-group">
            <input
              id="texture-url"
              type="text"
              value={textureUrl}
              onChange={(e) => setTextureUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://example.com/skin.png or https://minotar.net/skin/username"
              className="url-input"
            />
            <button onClick={handleLoadTexture} className="load-btn">
              🔍 Show Face
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="examples-section">
          <p className="examples-label">📸 Try these examples (CORS-free via proxy):</p>
          <div className="example-buttons">
            {exampleSkins.map((skin) => (
              <button
                key={skin.name}
                onClick={() => {
                  setTextureUrl(skin.url);
                  setCurrentUrl(skin.url);
                  setError('');
                  router.push(`/?texture=${encodeURIComponent(skin.url)}`, undefined, { shallow: true });
                }}
                className="example-btn"
              >
                {skin.name}
              </button>
            ))}
          </div>
        </div>

        <div className="viewer-section">
          {currentUrl ? (
            <>
              <div className="current-url">
                <strong>Current texture:</strong>
                <code>{currentUrl}</code>
              </div>
              <div className="face-container">
                <MinecraftFaceViewer textureUrl={currentUrl} size={160} />
              </div>
              <div className="info-note">
                💡 The face is extracted and displayed using a server-side proxy to avoid CORS issues
              </div>
            </>
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon">👤</div>
              <p>Enter a skin texture URL above to see the face</p>
              <p className="hint">Works with any direct PNG/JPG/WebP Minecraft skin image</p>
              <p className="hint">🔧 CORS issues are automatically handled by our proxy</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>ℹ️ How it works</h3>
          <ul>
            <li><strong>Server-side Proxy:</strong> Images are fetched through our API to bypass CORS restrictions</li>
            <li><strong>Face Extraction:</strong> Extracts the 8x8 face region from standard Minecraft skins (64x32 or 64x64)</li>
            <li><strong>Hat Layer Support:</strong> Properly composites the helmet/hat overlay for modern 64x64 skins</li>
            <li><strong>Model Detection:</strong> Automatically detects Slim (Alex) vs Normal (Steve) models</li>
            <li><strong>Pixel Perfect:</strong> Preserves the authentic Minecraft pixelated aesthetic</li>
            <li><strong>URL Parameter:</strong> Use <code>?texture=URL</code> to load any texture directly</li>
          </ul>
          
          <div className="note">
            <strong>✨ Pro tip:</strong> You can bookmark URLs with the texture parameter:<br />
            <code>https://mcheadapi.vercel.app/?texture=https://minotar.net/skin/alex</code>
          </div>
          
          <div className="note warning">
            <strong>⚠️ Note:</strong> Some websites may block our proxy. For best results, use direct image URLs from public CDNs or Minecraft skin APIs.
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .header h1 {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }
        
        .header p {
          color: #666;
          font-size: 1.1rem;
        }
        
        .subtitle {
          font-size: 0.9rem;
          color: #888;
          margin-top: 0.25rem;
        }
        
        .input-section {
          background: #f5f5f5;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        
        .input-section label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .input-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .url-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 0.9rem;
          font-family: monospace;
          transition: border-color 0.2s;
        }
        
        .url-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .load-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        
        .load-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .load-btn:active {
          transform: translateY(0);
        }
        
        .error-message {
          margin-top: 0.75rem;
          color: #e74c3c;
          font-size: 0.85rem;
        }
        
        .examples-section {
          margin-bottom: 2rem;
        }
        
        .examples-label {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .example-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .example-btn {
          padding: 0.5rem 1rem;
          background: #e0e0e0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
        }
        
        .example-btn:hover {
          background: #d0d0d0;
        }
        
        .viewer-section {
          background: #fafafa;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .current-url {
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          background: #fff;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          word-break: break-all;
        }
        
        .current-url code {
          background: #f0f0f0;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          margin-left: 0.5rem;
          font-size: 0.8rem;
        }
        
        .face-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 1rem 0;
        }
        
        .info-note {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: #666;
          background: #e8e8e8;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }
        
        .placeholder {
          text-align: center;
          color: #999;
        }
        
        .placeholder-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }
        
        .hint {
          font-size: 0.8rem;
          margin-top: 0.5rem;
          color: #bbb;
        }
        
        .info-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 12px;
        }
        
        .info-section h3 {
          margin-bottom: 0.75rem;
          color: #333;
        }
        
        .info-section ul {
          margin-left: 1.5rem;
          color: #666;
          line-height: 1.6;
        }
        
        .note {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #856404;
        }
        
        .note code {
          background: #fff3cd;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        
        .warning {
          background: #f8d7da;
          border-left-color: #dc3545;
          color: #721c24;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 1rem;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .example-buttons {
            justify-content: center;
          }
          
          .header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </>
  );
}
