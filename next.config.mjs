const isDevelopment = process.env.NODE_ENV === 'development';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "media-src 'self'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
].join('; ');

const browserSecurityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
];

const credentialGenerationAssets = [
  './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
  './node_modules/notosans-fontface/fonts/NotoSans-Thin.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-ExtraLight.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-Light.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-Regular.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-Medium.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-SemiBold.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-Bold.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-ExtraBold.ttf',
  './node_modules/notosans-fontface/fonts/NotoSans-Black.ttf',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/v1/admin/credentials/**': credentialGenerationAssets,
    '/api/v1/admin/credential-generation-batches/**': credentialGenerationAssets,
  },
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: '/:path*', headers: browserSecurityHeaders }];
  },
};

export default nextConfig;
