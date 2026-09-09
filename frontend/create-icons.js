// Compatibility entry point. Requires Python with Pillow installed.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.env.PYTHON || 'python', [path.join(__dirname, 'scripts/create-icons.py')], {stdio: 'inherit'});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
