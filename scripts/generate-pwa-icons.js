import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG Logo template with high-end financial & ministry reloading theme
const createSvg = (size, isMaskable = false) => {
  // Safe zone for maskable icon is center 80% (padding 10% on each side)
  const scale = isMaskable ? 0.72 : 0.85;
  const offset = (size * (1 - scale)) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size * 0.02}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)"/>

  <!-- Inner Content container scaled -->
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <!-- Subtle circular ring (Reload motif) -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" fill="none" stroke="url(#accentGrad)" stroke-width="${size * 0.03}" stroke-dasharray="${size * 0.25} ${size * 0.08}" opacity="0.85"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.33}" fill="#1e293b" fill-opacity="0.6"/>

    <!-- Central Monogram & Peso Symbol / Reload Spark -->
    <!-- Reload Arrow Spark -->
    <path d="M${size * 0.42} ${size * 0.22} L${size * 0.58} ${size * 0.22} L${size * 0.5} ${size * 0.14} Z" fill="url(#goldGrad)"/>
    
    <!-- Text BCC -->
    <text x="${size / 2}" y="${size * 0.48}" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-weight="900" 
          font-size="${size * 0.19}" 
          fill="#ffffff" 
          text-anchor="middle" 
          letter-spacing="${size * 0.01}">BCC</text>

    <!-- Subtitle RELOAD -->
    <rect x="${size * 0.26}" y="${size * 0.56}" width="${size * 0.48}" height="${size * 0.14}" rx="${size * 0.07}" fill="url(#accentGrad)"/>
    <text x="${size / 2}" y="${size * 0.665}" 
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          font-weight="800" 
          font-size="${size * 0.085}" 
          fill="#ffffff" 
          text-anchor="middle" 
          letter-spacing="${size * 0.02}">RELOAD</text>

    <!-- Financial dot accent (₱) -->
    <circle cx="${size * 0.5}" cy="${size * 0.77}" r="${size * 0.028}" fill="url(#goldGrad)"/>
  </g>
</svg>`;
};

async function generate() {
  console.log('Generating PWA icons...');
  
  // Favicon / standard SVG
  const svg512 = createSvg(512, false);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg512);

  // 192x192 PNG
  await sharp(Buffer.from(createSvg(192, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('pwa-192x192.png generated');

  // 512x512 PNG
  await sharp(Buffer.from(createSvg(512, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('pwa-512x512.png generated');

  // 512x512 Maskable PNG
  await sharp(Buffer.from(createSvg(512, true)))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('pwa-maskable-512x512.png generated');

  // Apple Touch Icon 180x180 PNG (no transparency for iOS)
  await sharp(Buffer.from(createSvg(180, false)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png generated');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
