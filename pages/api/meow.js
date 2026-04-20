import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const textureUrl = searchParams.get('txt');
    const face = searchParams.get('face') || 'front';

    if (!textureUrl) {
      return NextResponse.json(
        { error: 'Missing txt parameter' },
        { status: 400 }
      );
    }

    // Fetch the texture image
    const response = await fetch(textureUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch texture: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const extractedFace = await extractTextureFace(Buffer.from(imageBuffer), face);

    return NextResponse.json({
      face: face,
      data: extractedFace,
      format: 'data:image/png;base64'
    });

  } catch (error) {
    console.error('Error processing texture:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function extractTextureFace(imageBuffer, faceType) {
  try {
    // Load the image with sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    const { width, height } = metadata;
    
    // Assume standard 2x3 UV texture layout
    const faceWidth = width / 3;
    const faceHeight = height / 2;
    
    let left = 0;
    let top = 0;
    
    // Map face type to coordinates
    switch (faceType.toLowerCase()) {
      case 'right':
        left = 0;
        top = 0;
        break;
      case 'left':
        left = faceWidth;
        top = 0;
        break;
      case 'top':
        left = faceWidth * 2;
        top = 0;
        break;
      case 'bottom':
        left = 0;
        top = faceHeight;
        break;
      case 'front':
        left = faceWidth;
        top = faceHeight;
        break;
      case 'back':
        left = faceWidth * 2;
        top = faceHeight;
        break;
      default:
        left = faceWidth;
        top = faceHeight;
    }
    
    // Extract the specific face region
    const extractedBuffer = await image
      .extract({
        left: Math.floor(left),
        top: Math.floor(top),
        width: Math.floor(faceWidth),
        height: Math.floor(faceHeight)
      })
      .png()
      .toBuffer();
    
    // Convert to base64 data URL
    const base64 = extractedBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
    
  } catch (error) {
    console.error('Error extracting face with sharp:', error);
    throw new Error(`Failed to extract texture face: ${error.message}`);
  }
}
