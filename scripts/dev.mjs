// Starts `next dev` bound to all interfaces, and prints a banner
// with the LAN IP so you can reach the dev server from your phone.
// Wired up via `package.json` -> "dev": "node scripts/dev.mjs"

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { pickLanIp } from './pick-lan-ip.mjs';

const require = createRequire(import.meta.url);

const ip = pickLanIp();
const port = process.env.PORT ?? '3000';

// Bind to 0.0.0.0 so both `localhost` and the LAN IP work.
// We print our own banner with the correct phone URL — ignore
// the "Network" URL Next prints below, it just echoes the bind flag.
console.log('\n────────────────────────────────────────');
console.log(`  Local   →  http://localhost:${port}`);
if (ip) {
  console.log(`  Phone   →  http://${ip}:${port}`);
} else {
  console.log(`  Phone   →  (no LAN IP detected — check ipconfig)`);
}
console.log('────────────────────────────────────────\n');

// Resolve Next's actual JS entrypoint and run it with the current
// Node binary. This avoids spawning a shell (which Node 22+ flags
// as a security risk via DEP0190) and works the same on Windows / macOS / Linux.
const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0'], {
  stdio: 'inherit',
});

child.on('exit', code => process.exit(code ?? 0));
