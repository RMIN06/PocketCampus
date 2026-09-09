const fs = require("node:fs");
fs.writeFileSync("public/version.json", JSON.stringify({version: new Date().toISOString()}));
