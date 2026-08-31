import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const width = 1200;
const height = 630;
const outputDirectory = path.join(process.cwd(), 'public', 'brand', 'social');
const logoPath = path.join(process.cwd(), 'public', 'brand', 'nobel-logo-full-horizontal-web.svg');

const assets = [
  ['institutional', 'institutional'],
  ['catalogue', 'catalogue'],
  ['area-business-management', 'business'],
  ['area-technology-innovation', 'technology'],
  ['area-psychology-human', 'psychology'],
  ['programme-format', 'format'],
  ['programme-ai-production', 'ai'],
  ['programme-general-psychology', 'general-psychology'],
  ['programme-child-psychology', 'child-psychology'],
  ['programme-neuroplastic-reconstruction', 'neuroplasticity'],
  ['programme-space-business', 'space'],
  ['verify', 'verify'],
];

const gradients = {
  institutional: ['#0b1028', '#172b58'],
  catalogue: ['#0b122c', '#223f70'],
  business: ['#101530', '#294b73'],
  technology: ['#070d24', '#1c3f75'],
  psychology: ['#16112e', '#4b356d'],
  format: ['#0d1731', '#304d72'],
  ai: ['#08172f', '#26558a'],
  'general-psychology': ['#17102e', '#4a3567'],
  'child-psychology': ['#17132e', '#465179'],
  neuroplasticity: ['#0e1530', '#41548a'],
  space: ['#060b1d', '#193c70'],
  verify: ['#08142c', '#214a76'],
};

function circles(points, colour = '#8bb9ff') {
  return points.map(([cx, cy, radius, opacity = 0.7]) => (
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${colour}" fill-opacity="${opacity}"/>`
  )).join('');
}

function motif(name) {
  switch (name) {
    case 'institutional':
      return `
        <path d="M650 700C720 470 865 330 1235 245" fill="none" stroke="#79a9ef" stroke-opacity=".28" stroke-width="2"/>
        <path d="M590 700C685 410 855 245 1235 165" fill="none" stroke="#79a9ef" stroke-opacity=".16" stroke-width="2"/>
        <circle cx="984" cy="318" r="214" fill="none" stroke="#6f9fe7" stroke-opacity=".2" stroke-width="54"/>
        <circle cx="984" cy="318" r="111" fill="#6f9fe7" fill-opacity=".13"/>`;
    case 'catalogue':
      return `
        <g transform="translate(638 176) rotate(-5 250 160)">
          <rect x="0" y="0" width="152" height="270" rx="20" fill="#ffffff" fill-opacity=".08" stroke="#9fc4ff" stroke-opacity=".28"/>
          <rect x="174" y="38" width="152" height="270" rx="20" fill="#ffffff" fill-opacity=".12" stroke="#9fc4ff" stroke-opacity=".34"/>
          <rect x="348" y="76" width="152" height="270" rx="20" fill="#ffffff" fill-opacity=".08" stroke="#9fc4ff" stroke-opacity=".28"/>
          <path d="M32 62h88M32 92h56M206 100h88M206 130h56M380 138h88M380 168h56" stroke="#b9d4ff" stroke-opacity=".55" stroke-width="8" stroke-linecap="round"/>
        </g>`;
    case 'business':
      return `
        <path d="M640 446L770 320l115 78 170-194" fill="none" stroke="#9cc4ff" stroke-opacity=".62" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
        ${circles([[640,446,13],[770,320,13],[885,398,13],[1055,204,13]])}
        <path d="M630 508h474" stroke="#ffffff" stroke-opacity=".15" stroke-width="2"/>`;
    case 'technology':
      return `
        <g fill="none" stroke="#8ab7fb" stroke-width="3">
          <ellipse cx="903" cy="324" rx="250" ry="118" stroke-opacity=".5" transform="rotate(-20 903 324)"/>
          <ellipse cx="903" cy="324" rx="188" ry="250" stroke-opacity=".26" transform="rotate(38 903 324)"/>
          <ellipse cx="903" cy="324" rx="86" ry="250" stroke-opacity=".18" transform="rotate(73 903 324)"/>
        </g>
        ${circles([[1086,214,12,.9],[715,386,10,.65],[961,492,8,.7]])}
        <circle cx="903" cy="324" r="44" fill="#78a8ed" fill-opacity=".25"/>`;
    case 'psychology':
      return `
        <path d="M886 112c-110 0-198 84-198 190 0 86 56 158 136 183v61h150v-80c67-32 112-98 112-174 0-99-83-180-200-180Z" fill="#ffffff" fill-opacity=".06" stroke="#b9a4e2" stroke-opacity=".42" stroke-width="3"/>
        <path d="M781 280c44-56 130-59 180-11 36 35 45 89 25 133M805 372c33 27 85 31 123 7" fill="none" stroke="#bda8ea" stroke-opacity=".55" stroke-width="10" stroke-linecap="round"/>
        ${circles([[796,270,11,.85],[925,255,9,.7],[995,369,10,.75],[834,389,8,.65]], '#c4aff0')}`;
    case 'format':
      return `
        <g transform="translate(655 160)">
          <rect width="420" height="292" rx="28" fill="#ffffff" fill-opacity=".07" stroke="#9fc4ff" stroke-opacity=".35" stroke-width="3"/>
          <path d="M42 58h196M42 99h316M42 141h275" stroke="#b8d2fa" stroke-opacity=".5" stroke-width="9" stroke-linecap="round"/>
          <rect x="42" y="202" width="96" height="48" rx="24" fill="#6496dd" fill-opacity=".55"/>
          <rect x="154" y="202" width="96" height="48" rx="24" fill="#ffffff" fill-opacity=".09"/>
          <rect x="266" y="202" width="96" height="48" rx="24" fill="#ffffff" fill-opacity=".09"/>
        </g>`;
    case 'ai':
      return `
        <g stroke="#a5caff" stroke-opacity=".5" stroke-width="3">
          <path d="M682 180l133 91 135-76 140 111-120 132-154-47-134 92" fill="none"/>
          <path d="M815 271v120M950 195l20 243M682 180v303M1090 306l-274 85" fill="none" stroke-opacity=".22"/>
        </g>
        ${circles([[682,180,18,.9],[815,271,26,.72],[950,195,14,.75],[1090,306,22,.82],[970,438,16,.75],[816,391,18,.8],[682,483,13,.65]])}`;
    case 'general-psychology':
      return `
        <g transform="translate(890 320)" fill="none" stroke="#c2adee">
          <circle r="198" stroke-opacity=".13" stroke-width="38"/>
          <circle r="126" stroke-opacity=".24" stroke-width="24"/>
          <circle r="64" stroke-opacity=".48" stroke-width="14"/>
        </g>
        <path d="M694 356c57-72 127-108 211-108 78 0 145 29 202 88" fill="none" stroke="#d0bdfa" stroke-opacity=".45" stroke-width="7" stroke-linecap="round"/>`;
    case 'child-psychology':
      return `
        <g transform="translate(665 166) rotate(-4 230 160)">
          <rect x="0" y="170" width="146" height="146" rx="30" fill="#80a9e8" fill-opacity=".34"/>
          <rect x="158" y="82" width="146" height="234" rx="30" fill="#a695db" fill-opacity=".29"/>
          <rect x="316" y="0" width="146" height="316" rx="30" fill="#ffffff" fill-opacity=".1"/>
          <circle cx="73" cy="243" r="26" fill="#c3d8fa" fill-opacity=".58"/>
          <circle cx="231" cy="155" r="26" fill="#d6c9f6" fill-opacity=".55"/>
          <circle cx="389" cy="73" r="26" fill="#d2e2fc" fill-opacity=".5"/>
        </g>`;
    case 'neuroplasticity':
      return `
        <g fill="none" stroke="#aecaff" stroke-width="4" stroke-linecap="round">
          <path d="M672 194c87 13 119 84 133 143 18 75 83 124 171 121 60-2 105-37 132-87" stroke-opacity=".52"/>
          <path d="M684 448c72-1 123-42 143-106 28-91 99-143 212-142" stroke-opacity=".28"/>
          <path d="M756 152c11 86 85 121 147 126 90 8 146 57 174 137" stroke-opacity=".22"/>
        </g>
        ${circles([[672,194,15,.85],[805,337,22,.68],[976,458,14,.72],[1108,371,18,.8],[684,448,12,.65],[827,342,9,.75],[1039,200,16,.72],[756,152,11,.7],[903,278,18,.8],[1077,415,10,.62]])}`;
    case 'space':
      return `
        <circle cx="903" cy="321" r="86" fill="#6f9fe7" fill-opacity=".27"/>
        <ellipse cx="903" cy="321" rx="272" ry="126" fill="none" stroke="#a5c8ff" stroke-opacity=".52" stroke-width="4" transform="rotate(-17 903 321)"/>
        <ellipse cx="903" cy="321" rx="185" ry="265" fill="none" stroke="#a5c8ff" stroke-opacity=".2" stroke-width="3" transform="rotate(39 903 321)"/>
        ${circles([[1128,218,15,.9],[703,431,10,.75],[838,101,6,.7],[1086,472,7,.75]])}
        <path d="M963 256l56-57 12 38 39 12-57 56-39-10Z" fill="#d4e4ff" fill-opacity=".65"/>`;
    case 'verify':
      return `
        <g transform="translate(702 126)">
          <rect x="0" y="0" width="310" height="388" rx="34" fill="#ffffff" fill-opacity=".08" stroke="#9fc4ff" stroke-opacity=".4" stroke-width="3"/>
          <path d="M58 92h194M58 140h138M58 188h162" stroke="#b8d2fa" stroke-opacity=".45" stroke-width="10" stroke-linecap="round"/>
          <circle cx="248" cy="306" r="92" fill="#1e4d7f" stroke="#afd0ff" stroke-opacity=".65" stroke-width="4"/>
          <path d="m204 306 29 29 59-67" fill="none" stroke="#d8e8ff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <path d="M1050 178c45 32 74 84 74 142 0 91-70 166-159 174" fill="none" stroke="#9fc4ff" stroke-opacity=".28" stroke-width="3"/>`;
    default:
      return '';
  }
}

function backgroundSvg(name) {
  const [start, end] = gradients[name];
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${start}"/>
          <stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <radialGradient id="glow" cx="82%" cy="48%" r="55%">
          <stop offset="0" stop-color="#6594dc" stop-opacity=".18"/>
          <stop offset="1" stop-color="#6594dc" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#background)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>
      <path d="M0 566h1200" stroke="#ffffff" stroke-opacity=".08"/>
      ${motif(name)}
    </svg>
  `);
}

await mkdir(outputDirectory, { recursive: true });
const logo = await sharp(logoPath).resize({ width: 350 }).png().toBuffer();

for (const [filename, design] of assets) {
  await sharp(backgroundSvg(design))
    .composite([{ input: logo, left: 72, top: 56 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, `${filename}-1200x630.png`));
}

console.log(`Generated ${assets.length} branded social images in ${outputDirectory}.`);
