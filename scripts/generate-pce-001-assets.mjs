import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const outputDirectory = 'public/partners';

const assets = [
  {
    input: 'assets/source/partners/alfred-nobel-university/logo-purple.png',
    output: 'alfred-nobel-university.webp',
    width: 720,
    height: 300,
  },
  {
    input: 'assets/source/partners/riga-nordic-university/logo-seal-blue.png',
    output: 'riga-nordic-university.webp',
    width: 160,
    height: 160,
  },
  {
    input: 'assets/source/partners/nataliia-kholodenko-psychology-centre/logo-mark.png',
    output: 'nataliia-kholodenko-psychology-centre.webp',
    width: 320,
    height: 320,
  },
  {
    input: 'assets/source/partners/e-launch-online-school/logo-black-square.png',
    output: 'e-launch-online-school.webp',
    width: 640,
    height: 240,
  },
  {
    input: 'assets/source/partners/nobel-mental-health/logo-horizontal-blue.png',
    output: 'nobel-mental-health.webp',
    width: 640,
    height: 260,
  },
];

await mkdir(outputDirectory, { recursive: true });

for (const asset of assets) {
  await sharp(asset.input, { density: 180 })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: asset.width, height: asset.height, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
    .toFile(`${outputDirectory}/${asset.output}`);
}

console.log(`Generated ${assets.length} approved partner web assets.`);
