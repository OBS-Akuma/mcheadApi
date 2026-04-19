// app/api/mchead/route.js - REAL 3D VERSION
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request) {
  const textureUrl = request.nextUrl.searchParams.get('meow');
  
  if (!textureUrl) {
    return NextResponse.json({ error: 'Missing ?meow= parameter' }, { status: 400 });
  }
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Load the actual McHead tool
  await page.goto('https://mchorse.github.io/mchead/');
  
  // Inject your texture URL into McHead
  const result = await page.evaluate(async (textureUrl) => {
    // Download the texture from URL
    const response = await fetch(textureUrl);
    const blob = await response.blob();
    const file = new File([blob], 'skin.png', { type: 'image/png' });
    
    // Simulate file upload to McHead
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileInput = document.querySelector('input[name="texture"]');
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Wait for 3D render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the rendered head as data URL
    const canvas = document.querySelector('.renderer');
    return canvas.toDataURL();
  }, textureUrl);
  
  await browser.close();
  
  return NextResponse.json({ head: result });
}
