/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/search/:query",
        destination: "/?search=:query",
      },
    ];
  },
};

module.exports = nextConfig;
