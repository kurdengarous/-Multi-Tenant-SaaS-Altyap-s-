/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Browser → backend base URL. In Docker the browser still talks to localhost:4000
  // because the request leaves the host machine.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001/api',
  },
};
