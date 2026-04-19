export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate URL to prevent SSRF attacks
    const validUrl = new URL(url);
    if (!validUrl.protocol.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // Block private IP ranges for security
    const hostname = validUrl.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return res.status(403).json({ error: 'Access to local addresses is forbidden' });
    }

    // Fetch the image from the external server
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Minecraft-Face-Viewer/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");

    // Send the image
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    if (error.code === 'ENOTFOUND') {
      res.status(404).json({ error: 'Domain not found' });
    } else {
      res.status(500).json({ error: 'Failed to proxy image: ' + error.message });
    }
  }
}
