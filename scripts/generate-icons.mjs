// Run: node scripts/generate-icons.mjs <path-to-transparent-logo.png>
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets', 'images');
const SOURCE = process.argv[2] ?? path.join(ASSETS, 'logo-transparent.png');


async function main() {
  const logo = sharp(SOURCE).resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

  // 1. icon.png — logo on white background (iOS rounds corners automatically)
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: await logo.clone().toBuffer(), blend: 'over' }])
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('✓ icon.png');

  // 2. android-icon-foreground.png — logo with safe-zone padding (~15%), transparent bg
  const padded = Math.round(1024 * 0.15);
  const foreSize = 1024 - padded * 2;
  await sharp(SOURCE)
    .resize(foreSize, foreSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: padded, bottom: padded, left: padded, right: padded, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png');

  // 3. android-icon-background.png — solid #208AEF
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: { r: 32, g: 138, b: 239 } } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png');

  // 4. android-icon-monochrome.png — white silhouette on transparent bg
  const { data, info } = await sharp(SOURCE)
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mono = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < mono.length; i += 4) {
    mono[i] = 255;     // R — white
    mono[i + 1] = 255; // G
    mono[i + 2] = 255; // B
    mono[i + 3] = data[i + 3]; // keep original alpha
  }
  await sharp(mono, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png');

  // 5. splash-icon.png — white silhouette, 200×200, transparent bg
  const splashSize = 200;
  const splashMono = Buffer.alloc(splashSize * splashSize * 4);
  const { data: splashData } = await sharp(SOURCE)
    .resize(splashSize, splashSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < splashMono.length; i += 4) {
    splashMono[i] = 255;
    splashMono[i + 1] = 255;
    splashMono[i + 2] = 255;
    splashMono[i + 3] = splashData[i + 3];
  }
  await sharp(splashMono, { raw: { width: splashSize, height: splashSize, channels: 4 } })
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✓ splash-icon.png');

  console.log('\nTüm ikonlar assets/images/ klasörüne yazıldı.');
}

main().catch((e) => { console.error(e); process.exit(1); });
