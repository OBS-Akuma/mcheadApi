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

    // Return HTML that will extract the face client-side and redirect with data URL
    // This is a clever workaround for Vercel's limitations
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Extracting face...</title>
          <script>
            const textureUrl = ${JSON.stringify(texture)};
            const proxyUrl = '/api/proxy-image?url=' + encodeURIComponent(textureUrl);
            
            async function extractFace() {
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
                
                // Face coordinates
                const faceX = 8;
                const faceY = 8;
                const faceW = 8;
                const faceH = 8;
                const targetSize = 64;
                
                canvas.width = targetSize;
                canvas.height = targetSize;
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, faceX, faceY, faceW, faceH, 0, 0, targetSize, targetSize);
                
                // Handle hat layer for 64x64 skins
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
                
                // Detect model
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
                
                const base64Data = canvas.toDataURL('image/png');
                
                // Send JSON response
                const result = {
                  success: true,
                  data: base64Data,
                  model: modelType,
                  textureUrl: textureUrl,
                  format: 'png',
                  size: 64
                };
                
                // Display JSON or redirect based on format parameter
                const urlParams = new URLSearchParams(window.location.search);
                const format = urlParams.get('format');
                
                if (format === 'raw') {
                  document.body.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                } else {
                  // Return as JSONP or redirect with data
                  window.location.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(result));
                }
              } catch (error) {
                const errorResult = {
                  success: false,
                  error: error.message,
                  textureUrl: textureUrl
                };
                document.body.innerHTML = '<pre>' + JSON.stringify(errorResult, null, 2) + '</pre>';
              }
            }
            
            extractFace();
          </script>
        </head>
        <body style="font-family: monospace; padding: 20px;">
          Extracting face from texture... Please wait.
        </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Face extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request: ' + error.message,
      textureUrl: texture
    });
  }
}
