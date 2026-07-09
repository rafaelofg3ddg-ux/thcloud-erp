import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/clinica", destination: "/clinica.html" },
      { source: "/clinica-admin", destination: "/clinica-admin.html" },
    ];
  },
};

export default nextConfig;
