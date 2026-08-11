import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const outputDirectory = 'public/experts';
const experts = [
  {
    input: 'assets/source/experts/nataliia-kholodenko/portrait-original.jpg',
    output: 'nataliia-kholodenko.webp',
  },
  {
    input: 'assets/source/experts/dmytro-shevchuk/portrait-original.png',
    output: 'dmytro-shevchuk.webp',
  },
  {
    input: 'assets/source/experts/alina-yudina/portrait-original.jpeg',
    output: 'alina-yudina.webp',
  },
];

await mkdir(outputDirectory, { recursive: true });

for (const expert of experts) {
  await sharp(expert.input)
    .rotate()
    .toColourspace('srgb')
    .resize({ width: 900, height: 1125, fit: 'cover', position: 'attention' })
    .webp({ quality: 88, smartSubsample: true })
    .toFile(`${outputDirectory}/${expert.output}`);
}

console.log(`Generated ${experts.length} approved expert web portraits.`);
