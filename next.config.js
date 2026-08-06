/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow LIFF to work within LINE's WebView
  async headers() {
    return [
      {
        source: '/liff/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://liff.line.me https://line.me",
          },
        ],
      },
    ]
  },
  allowedDevOrigins: ['5663-223-205-220-144.ngrok-free.app'],
}

module.exports = nextConfig
