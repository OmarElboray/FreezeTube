#!/usr/bin/env node
// generate-icons.js
// Run once with Node.js to create the icons/ directory with PNG files.
// Requires: npm install canvas
//
// Usage: node generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Red circle background
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // White snowflake
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.56)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('❄', size / 2, size / 2 + Math.round(size * 0.04));

  const outPath = path.join(outDir, `icon${size}.png`);
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buf);
  console.log(`✓ icons/icon${size}.png`);
}

console.log('Icons generated.');