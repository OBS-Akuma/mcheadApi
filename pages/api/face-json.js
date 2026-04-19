export default async function handler(req, res) {
  const { texture, callback } = req.query;

  if (!texture) {
    return res.status(400).json({ error: 'Texture URL parameter is required' });
  }

  try {
    // Validate URL
    const validUrl = new URL(texture);
    if (!validUrl.protocol.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // Return JavaScript that will extract and return the face
    const javascript = `
      (async function() {
        const textureUrl = ${JSON.stringify(texture)};
        const proxyUrl = '/api/proxy-image?url=' + encodeURIComponent(textureUrl);
        
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = proxyUrl;
          });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const skinWidth = img.width;
          const skinHeight = img.height;
          
          const faceX = 8;
          const faceY = 8;
          const faceW = 8;
          const faceH = 8;
          const targetSize = 64;
          
          canvas.width = targetSize;
          canvas.height = targetSize;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, faceX, faceY, faceW, faceH, 0, 0, targetSize, targetSize);
          
          if (skinHeight === 64 && skinWidth === 64) {
            const hatX = 40;
            const hatY = 8;
            
            const hatCanvas = document.createElement('canvas');
            hatCanvas.width = targetSize;
            hatCanvas.height = targetSize;
            const hatCtx = hatCanvas.getContext('2d');
            hatCtx.imageSmoothingEnabled = false;
            hatCtx.drawImage(img, hatX, hatY, faceW, faceH, 0, 0, targetSize, targetSize);
            
            ctx.drawImage(hatCanvas, 0, 0);
          }
          
          let modelType = 'normal';
          if (skinHeight === 64 && skinWidth === 64) {
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 1;
            testCanvas.height = 1;
            const testCtx = testCanvas.getContext('2d');
            testCtx.drawImage(img, 42, 20, 1, 1, 0, 0, 1, 1);
            const pixelData = testCtx.getImageData(0, 0, 1, 1).data;
            if (pixelData[0] === 0 && pixelData[1] === 0 && pixelData[2] === 0 && pixelData[3] < 10) {
              modelType = 'slim';
            }
          }
          
          const result = {
            success: true,
            data: canvas.toDataURL('image/png'),
            model: modelType,
            textureUrl: textureUrl,
            format: 'png',
            size: 64
          };
          
          ${callback ? `${callback}(result);` : `console.log(JSON.stringify(result)); document.body.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';`}
        } catch (error) {
          const errorResult = {
            success: false,
            error: error.message,
            textureUrl: textureUrl
          };
          ${callback ? `${callback}(errorResult);` : `console.error(errorResult); document.body.innerHTML = '<pre>' + JSON.stringify(errorResult, null, 2) + '</pre>';`}
        }
      })();
    `;
    
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(javascript);
  } catch (error) {
    console.error('Face extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request: ' + error.message,
      textureUrl: texture
    });
  }
}
