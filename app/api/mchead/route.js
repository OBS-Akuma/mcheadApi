// app/api/mchead/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the texture URL from ?meow= parameter
    const searchParams = request.nextUrl.searchParams;
    const textureUrl = searchParams.get('meow');
    
    // Check if URL was provided
    if (!textureUrl) {
      return NextResponse.json({ 
        error: 'Missing ?meow= parameter',
        example: '/api/mchead?meow=https://example.com/skin.png'
      }, { status: 400 });
    }
    
    // Use mc-heads.net which accepts direct skin URLs
    // This service will render just the head from any skin texture URL
    const headApiUrl = `https://mc-heads.net/head/${encodeURIComponent(textureUrl)}/128`;
    
    // Fetch the rendered head
    const response = await fetch(headApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to render head: ${response.status}`);
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Return JSON with the head as data URL
    return NextResponse.json({
      head: `data:image/png;base64,${base64Image}`,
      success: true
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
