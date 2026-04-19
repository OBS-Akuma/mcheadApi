// pages/api/minecraft-face.js

const cooldownMap = new Map();

// Extract face from Minecraft skin
async function extractMinecraftFace(imageUrl) {
  // Use a headless browser or canvas library on server-side
  // Since we're in Next.js API route, we need to use node-canvas or similar
  const { createCanvas, loadImage } = require('canvas');
  
  try {
    // Load the image from URL
    const image = await loadImage(imageUrl);
    
    const skinWidth = image.width;
    const skinHeight = image.height;
    
    // Face coordinates in Minecraft skin
    const faceX = 8;
    const faceY = 8;
    const faceW = 8;
    const faceH = 8;
    
    const targetSize = 64;
    const canvas = createCanvas(targetSize, targetSize);
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, faceX, faceY, faceW, faceH, 0, 0, targetSize, targetSize);
    
    // Handle hat/helmet layer for 64x64 skins
    if (skinHeight === 64 && skinWidth === 64) {
      const hatX = 40;
      const hatY = 8;
      
      const hatCanvas = createCanvas(targetSize, targetSize);
      const hatCtx = hatCanvas.getContext('2d');
      hatCtx.imageSmoothingEnabled = false;
      hatCtx.drawImage(image, hatX, hatY, faceW, faceH, 0, 0, targetSize, targetSize);
      
      ctx.drawImage(hatCanvas, 0, 0);
    }
    
    // Return as base64
    return canvas.toDataURL();
    
  } catch (error) {
    throw new Error(`Failed to extract face: ${error.message}`);
  }
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get texture URL from query parameter
  const { texture } = req.query;

  if (!texture) {
    return res.status(400).json({ error: 'texture parameter is required' });
  }

  // Validate URL
  try {
    new URL(texture);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Check if it's the Kirka texture - return as regular image, not Minecraft face
  if (texture === 'https://kirka.io/assets/img/texture.6abb46ca.png') {
    try {
      const response = await fetch(texture);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = response.headers.get('content-type') || 'image/png';
      
      return res.status(200).json({
        success: true,
        textureUrl: texture,
        isMinecraftSkin: false,
        contentType: contentType,
        size: buffer.length,
        data: `data:${contentType};base64,${base64}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch Kirka texture' });
    }
  }

  // Cooldown check
  const now = Date.now();
  const lastRequest = cooldownMap.get(texture);
  
  if (lastRequest && (now - lastRequest) < 1000) {
    const timeLeft = Math.ceil((1000 - (now - lastRequest)) / 1000);
    return res.status(429).json({ 
      error: 'Too many requests',
      message: `Please wait ${timeLeft} second`,
      retryAfter: 1000 - (now - lastRequest)
    });
  }
  
  cooldownMap.set(texture, now);

  try {
    // Extract just the face from the Minecraft skin
    const faceDataUrl = await extractMinecraftFace(texture);
    
    // Return JSON with only the face
    return res.status(200).json({
      success: true,
      textureUrl: texture,
      isMinecraftSkin: true,
      faceData: faceDataUrl,
      faceSize: 64,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error extracting face:', error);
    return res.status(500).json({ 
      error: 'Failed to extract Minecraft face',
      message: error.message 
    });
  }
}
