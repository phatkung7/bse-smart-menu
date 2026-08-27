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
  allowedDevOrigins: ['7908-1-47-13-176.ngrok-free.app'],
}

module.exports = nextConfig
