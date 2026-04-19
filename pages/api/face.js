import { createCanvas, loadImage } from 'canvas';

export default async function handler(req, res) {
  const { texture } = req.query;

  if (!texture) {
    return res.status(400).json({ error: 'Texture URL parameter is required' });
  }

  try {
    // Validate URL
    const validUrl = new URL(texture);
    if (!validUrl.protocol.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // Fetch the image via proxy to avoid CORS
    const proxyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/proxy-image?url=${encodeURIComponent(texture)}`;
    
    // Load the image using node-canvas
    const image = await loadImage(proxyUrl);
    
    const skinWidth = image.width;
    const skinHeight = image.height;
    
    // Create canvas for face extraction
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    
    // Face coordinates
    const faceX = 8;
    const faceY = 8;
    const faceW = 8;
    const faceH = 8;
    
    // Draw base face
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, faceX, faceY, faceW, faceH, 0, 0, 64, 64);
    
    // Handle hat layer for 64x64 skins
    if (skinHeight === 64 && skinWidth === 64) {
      const hatX = 40;
      const hatY = 8;
      
      // Create temporary canvas for hat overlay
      const hatCanvas = createCanvas(64, 64);
      const hatCtx = hatCanvas.getContext('2d');
      hatCtx.imageSmoothingEnabled = false;
      hatCtx.drawImage(image, hatX, hatY, faceW, faceH, 0, 0, 64, 64);
      
      // Composite hat layer
      ctx.drawImage(hatCanvas, 0, 0);
    }
    
    // Detect model type (simple detection)
    let modelType = 'normal';
    if (skinWidth === 64 && skinHeight === 64) {
      // Check arm width indicator
      const armCanvas = createCanvas(1, 1);
      const armCtx = armCanvas.getContext('2d');
      armCtx.drawImage(image, 42, 20, 1, 1, 0, 0, 1, 1);
      const pixelData = armCtx.getImageData(0, 0, 1, 1).data;
      if (pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0 && pixelData[3] < 10) {
        modelType = 'slim';
      }
    }
    
    // Convert to base64
    const base64Data = canvas.toDataURL('image/png');
    
    // Return JSON response
    res.status(200).json({
      success: true,
      data: base64Data,
      model: modelType,
      textureUrl: texture,
      format: 'png',
      size: 64
    });
    
  } catch (error) {
    console.error('Face extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract face: ' + error.message,
      textureUrl: texture
    });
  }
}
