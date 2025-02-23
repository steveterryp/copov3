const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Base SVG icon - a simple "P" for PoV Manager
const baseSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1976D2"/>
  <path d="M160 128h96c44.183 0 80 35.817 80 80s-35.817 80-80 80h-96V128zm32 128h64c26.51 0 48-21.49 48-48s-21.49-48-48-48h-64v96z" fill="white"/>
</svg>
`;

// Ensure the icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save the base SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), baseSvg);

// Generate PNG icons in different sizes
async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    await sharp(Buffer.from(baseSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error);
