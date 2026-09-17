import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const imagesDir = path.resolve('public/images');
const files = [
  'auth_slide_2.png',
  'food_ingredients_banner.png',
  'smak-auth-food-banner.jpg',
  'cooking_banner_bg.png',
  'mobile_hero_dark_dish.jpg',
  'og-image.png',
  'pexels-dhiraj-jain-207743066-12737657.jpg',
  'logo.png'
];

// Clean any leftover temp files
for (const f of fs.readdirSync(imagesDir)) {
  if (f.startsWith('_temp_')) {
    fs.unlinkSync(path.join(imagesDir, f));
  }
}

console.log('Optimizing images in:', imagesDir);

for (const file of files) {
  const fullPath = path.join(imagesDir, file);
  if (!fs.existsSync(fullPath)) continue;

  const originalBuffer = fs.readFileSync(fullPath);
  const originalSize = originalBuffer.length;

  // 1. Generate WebP
  const webpName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const webpPath = path.join(imagesDir, webpName);

  let quality = 80;
  if (file === 'mobile_hero_dark_dish.jpg' || file === 'smak-auth-food-banner.jpg') {
    quality = 80;
  } else if (file === 'og-image.png' || file === 'logo.png') {
    quality = 85;
  }

  const webpBuffer = await sharp(originalBuffer)
    .webp({ quality, effort: 6, smartSubsample: true })
    .toBuffer();

  fs.writeFileSync(webpPath, webpBuffer);

  console.log(`✓ ${file}: ${(originalSize / 1024).toFixed(1)} KB -> WebP: ${(webpBuffer.length / 1024).toFixed(1)} KB (-${(100 - (webpBuffer.length / originalSize) * 100).toFixed(1)}%)`);

  // 2. Also optimize JPGs with progressive mozjpeg so baseline scanlines are replaced by smooth progressive rendering
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    const jpgBuffer = await sharp(originalBuffer)
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(fullPath, jpgBuffer);
    console.log(`  └ Progressive JPG updated: ${(jpgBuffer.length / 1024).toFixed(1)} KB (-${(100 - (jpgBuffer.length / originalSize) * 100).toFixed(1)}%)`);
  }
}

console.log('\nAll images successfully optimized!');
