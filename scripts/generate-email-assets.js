const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createAssets() {
  const publicDir = path.join(__dirname, '..', 'public');
  const logoPath = path.join(publicDir, 'app-logo.png');
  const avatarPath = path.join(publicDir, 'avatar.png');

  const size = 512;
  // Circular badge SVG with subtle radial glow and deep midnight border
  const bgSvg = Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="55%" stop-color="#0f111c" />
          <stop offset="100%" stop-color="#07090e" />
        </radialGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#818cf8" stop-opacity="0.6" />
          <stop offset="50%" stop-color="#4f46e5" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#312e81" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="url(#grad)" stroke="url(#ringGrad)" stroke-width="4" />
    </svg>
  `);

  // Resize falcon to fit nicely inside the circular crop boundary
  const falconSize = 340;
  const falconBuf = await sharp(logoPath)
    .resize(falconSize, falconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const offset = Math.round((size - falconSize) / 2);

  await sharp(bgSvg)
    .composite([
      { input: falconBuf, top: offset, left: offset }
    ])
    .png()
    .toFile(avatarPath);

  console.log('Successfully generated:', avatarPath);
}

createAssets().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
