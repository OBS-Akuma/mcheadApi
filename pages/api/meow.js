// app/api/extract-face/route.js (App Router)
// or pages/api/extract-face.js (Pages Router)

import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const textureUrl = searchParams.get('txt');
    const face = searchParams.get('face') || 'front'; // front, back, top, bottom, left, right

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
    const imageData = Buffer.from(imageBuffer);

    // Load image and extract face
    const extractedFace = await extractTextureFace(imageData, face);

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

async function extractTextureFace(imageData, faceType) {
  // This requires a canvas-like environment
  // For Node.js/Next.js server, we'll use 'sharp' library
  const sharp = require('sharp');

  // Load the image and get metadata
  const image = sharp(imageData);
  const metadata = await image.metadata();
  
  const { width, height } = metadata;
  
  // Assume texture is a 2x3 grid (typical UV mapping)
  // Face layout: 
  // Row 1: Right, Left, Top
  // Row 2: Bottom, Front, Back
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
  
  // Convert to data URL
  const base64 = extractedBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

// Alternative: If you want to use canvas in browser environment
// This version runs on client-side or in browser API routes
export async function extractFaceClientSide(textureUrl, faceType = 'front') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const { width, height } = img;
      const faceWidth = width / 3;
      const faceHeight = height / 2;
      
      let sx = 0, sy = 0;
      
      switch (faceType.toLowerCase()) {
        case 'right':
          sx = 0;
          sy = 0;
          break;
        case 'left':
          sx = faceWidth;
          sy = 0;
          break;
        case 'top':
          sx = faceWidth * 2;
          sy = 0;
          break;
        case 'bottom':
          sx = 0;
          sy = faceHeight;
          break;
        case 'front':
          sx = faceWidth;
          sy = faceHeight;
          break;
        case 'back':
          sx = faceWidth * 2;
          sy = faceHeight;
          break;
        default:
          sx = faceWidth;
          sy = faceHeight;
      }
      
      canvas.width = faceWidth;
      canvas.height = faceHeight;
      
      ctx.drawImage(
        img,
        sx, sy, faceWidth, faceHeight,
        0, 0, faceWidth, faceHeight
      );
      
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    };
    
    img.onerror = reject;
    img.src = textureUrl;
  });
}
