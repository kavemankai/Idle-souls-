// Builds combat-bench.html from bench-shell.html + combat-sim.js, so the page and Node always run the same engine.
//   node build.js
const fs = require('fs');
const shell = fs.readFileSync(__dirname + '/bench-shell.html', 'utf8');
const sim = fs.readFileSync(__dirname + '/combat-sim.js', 'utf8');
if (!shell.includes('/*SIM*/')) throw new Error('bench-shell.html is missing the /*SIM*/ placeholder');
fs.writeFileSync(__dirname + '/combat-bench.html', shell.replace('/*SIM*/', () => sim));
console.log('combat-bench.html built from combat-sim.js');
