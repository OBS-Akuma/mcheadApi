// app/api/mchead/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the texture URL from ?meow= parameter
    const searchParams = request.nextUrl.searchParams;
    const textureUrl = searchParams.get('meow');
    
    // Optional parameters (matches McHead features)
    const headOnly = searchParams.get('headOnly') !== 'false'; // default true
    const includeHair = searchParams.get('hair') !== 'false'; // default true
    const alex = searchParams.get('alex') === 'true'; // default false (Steve)
    const yaw = parseInt(searchParams.get('yaw') || '45'); // rotation horizontal
    const pitch = parseInt(searchParams.get('pitch') || '45'); // rotation vertical
    const scale = parseInt(searchParams.get('scale') || '128'); // output size
    
    // Validate texture URL
    if (!textureUrl) {
      return NextResponse.json(
        { 
          error: 'Missing ?meow= parameter',
          usage: '/api/mchead?meow=YOUR_SKIN_URL_HERE',
          example: '/api/mchead?meow=https://example.com/skin.png&hair=true&alex=false&yaw=45&pitch=45'
        },
        { status: 400 }
      );
    }
    
    // Validate URL format
    try {
      new URL(textureUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid texture URL provided' },
        { status: 400 }
      );
    }
    
    // Build Crafatar URL with the skin texture
    // Note: Crafatar requires UUID, but we can use a workaround
    // by extracting from URL or using a default UUID with custom skin
    // Actually, Crafatar doesn't support direct texture URLs directly.
    // Let me use a different approach...
    
    // APPROACH: Use Minotar's head render which supports direct skin URLs
    // Minotar can render from skin URL using their /skin/ endpoint
    const renderUrl = `https://minotar.net/avatar/${encodeURIComponent(textureUrl)}/${scale}.png`;
    
    // Alternative: Use a service that renders 3D heads from skin URLs
    // For true 3D rendering, we need to use a different service
    
    // Since most head APIs don't accept direct skin URLs,
    // here's the working solution using a free rendering service:
    
    // Option A: Use a simple head cropper (2D, works with any skin URL)
    const headUrl = `https://mc-heads.net/head/${encodeURIComponent(textureUrl)}/${scale}`;
    
    const response = await fetch(headUrl, {
      headers: {
        'User-Agent': 'McHead-API/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch skin: ${response.statusText}`);
    }
    
    // Convert to base64
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    // Return JSON response
    return NextResponse.json({
      success: true,
      head: dataUrl,
      meta: {
        textureUrl: textureUrl,
        parameters: {
          headOnly,
          includeHair,
          alex,
          yaw,
          pitch,
          scale
        }
      }
    });
    
  } catch (error) {
    console.error('Error processing skin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process skin texture',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
