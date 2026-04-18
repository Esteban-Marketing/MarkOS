#!/usr/bin/env node
// Phase 202 Plan 10 Task 1: Generate 512x512 MarkOS marketplace icon.
// Uses sharp (preferred — present in deps) or canvas as fallback.
// M3 revision: hard-fails if neither generator is available (no 1x1 placeholder).

import { writeFileSync } from 'node:fs';

async function generateViaSharp() {
  const sharpMod = await import('sharp');
  const sharp = sharpMod.default || sharpMod;
  const svg = Buffer.from(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
    <rect width='512' height='512' fill='#0d9488'/>
    <text x='256' y='256' font-family='sans-serif' font-weight='bold' font-size='96' fill='#ffffff' text-anchor='middle' dominant-baseline='central'>MarkOS</text>
  </svg>`);
  await sharp(svg).png().toFile('public/mcp-icon.png');
  console.log('generated via sharp');
}

async function generateViaCanvas() {
  const canvasMod = await import('canvas');
  const { createCanvas } = canvasMod.default || canvasMod;
  const c = createCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MarkOS', 256, 256);
  writeFileSync('public/mcp-icon.png', c.toBuffer('image/png'));
  console.log('generated via canvas');
}

try {
  await generateViaSharp();
} catch (e1) {
  console.error('sharp failed:', e1.message);
  try {
    await generateViaCanvas();
  } catch (e2) {
    console.error('FATAL: neither sharp nor canvas is installable. Marketplace cert requires real 512x512 PNG.');
    console.error('sharp error:', e1.message);
    console.error('canvas error:', e2.message);
    process.exit(1);
  }
}
