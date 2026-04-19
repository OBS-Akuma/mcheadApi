import { useState } from 'react';
import Head from 'next/head';
import MinecraftFaceViewer from '../components/MinecraftFaceViewer';

export default function Home() {
  const [textureUrl, setTextureUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');

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
    } catch (e) {
      setError('Invalid URL. Please enter a valid image URL');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLoadTexture();
    }
  };

  // Example skin URLs for testing
  const exampleSkins = [
    { name: 'Steve (Normal)', url: 'https://minotar.net/skin/steve', model: 'normal' },
    { name: 'Alex (Slim)', url: 'https://minotar.net/skin/alex', model: 'slim' },
    { name: 'Herobrine', url: 'https://minotar.net/skin/Herobrine', model: 'normal' },
    { name: 'Creeper', url: 'https://minotar.net/skin/Creeper', model: 'normal' },
  ];

  return (
    <>
      <Head>
        <title>Minecraft Skin Face Viewer | Extract Face from Texture</title>
        <meta name="description" content="Extract and display just the face from any Minecraft skin texture URL" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🎮 Minecraft Face Viewer</h1>
          <p>Extract the face from any Minecraft skin texture URL</p>
          <p className="subtitle">Supports both Normal (Steve) and Slim (Alex) models</p>
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
              Show Face
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="examples-section">
          <p className="examples-label">📸 Try these examples:</p>
          <div className="example-buttons">
            {exampleSkins.map((skin) => (
              <button
                key={skin.name}
                onClick={() => {
                  setTextureUrl(skin.url);
                  setCurrentUrl(skin.url);
                  setError('');
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
            </>
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon">👤</div>
              <p>Enter a skin texture URL above to see the face</p>
              <p className="hint">Works with any direct PNG/JPG Minecraft skin image</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>ℹ️ How it works</h3>
          <ul>
            <li>Extracts the 8x8 face region from standard Minecraft skins (64x32 or 64x64)</li>
            <li>Supports both classic and modern skin formats</li>
            <li>Automatically detects Slim (Alex) vs Normal (Steve) model when possible</li>
            <li>Preserves the pixelated Minecraft aesthetic</li>
            <li>Works with any direct skin texture URL (minotar.net, namemc.com, custom URLs)</li>
          </ul>
          <div className="note">
            <strong>Note:</strong> For best results, use direct image URLs ending in .png or .jpg. 
            Some sites may block CORS - use a proxy if needed.
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
          min-height: 300px;
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
        }
        
        .face-container {
          display: flex;
          justify-content: center;
          align-items: center;
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
        }
      `}</style>
    </>
  );
}
