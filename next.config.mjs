/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "merakiui.com","lh3.googleusercontent.com"], 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
