import type { NextConfig } from "next";
import { pickLanIp } from "./scripts/pick-lan-ip.mjs";

// Detect the LAN IP at config-evaluation time so dev resources
// (HMR socket, source maps, etc.) accept requests from a phone on
// the same Wi-Fi. Re-detected on every `npm run dev` restart, so
// switching networks "just works" without editing this file.
const lanIp = pickLanIp();

const nextConfig: NextConfig = {
  allowedDevOrigins: lanIp ? [lanIp] : [],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
    ],
  },
};

export default nextConfig;
