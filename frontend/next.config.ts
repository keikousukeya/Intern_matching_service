import type { NextConfig } from "next";

// Rails API の接続先。Docker Compose 内ではサービス名 backend で解決する
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ブラウザからは同一オリジンの /api/* を叩き、Next.js が Rails に中継する。
  // これによりセッション Cookie を CORS なし・SameSite=Lax のまま扱える。
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
