// Shared LAN-IP picker used by `scripts/dev.mjs` (for the printed banner
// + Next bind) and `next.config.ts` (for `allowedDevOrigins`, so HMR
// works from phones/tablets on the same Wi-Fi without manual config
// when the laptop's IP changes).
//
// Returns the first IPv4 address that:
//   - is on a real physical adapter (not VPN / virtual / loopback)
//   - has a real DHCP lease (not APIPA 169.254.*)
//   - is not in Tailscale's CGNAT range (100.64.0.0/10)
// or `null` if nothing usable was found.

import os from 'node:os';

export function pickLanIp() {
  const ifaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(ifaces)) {
    if (/tailscale|vEthernet|VMware|VirtualBox|WSL|Hyper-V|Loopback/i.test(name)) continue;
    for (const a of addrs ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue; // APIPA
      if (a.address.startsWith('100.')) continue;     // Tailscale CGNAT
      return a.address;
    }
  }
  return null;
}
