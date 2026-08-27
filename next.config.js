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
  allowedDevOrigins: ['d454-223-27-246-210.ngrok-free.app'],
}

module.exports = nextConfig
