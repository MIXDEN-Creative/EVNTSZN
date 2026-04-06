import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: [
    "stripe",
    "resend",
    "@supabase/supabase-js",
  ],
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

export default nextConfig;
