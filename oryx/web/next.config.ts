import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "evntszn.com",
    "www.evntszn.com",
    "app.evntszn.com",
    "scanner.evntszn.com",
    "epl.evntszn.com",
    "ops.evntszn.com",
    "hq.evntszn.com",
    "admin.evntszn.com",
  ],
};

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

export default nextConfig;
