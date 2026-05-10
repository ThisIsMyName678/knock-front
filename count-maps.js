const fs = require('fs');
const glob = require('glob');

const files = glob.sync('**/*.tsx', { ignore: 'node_modules/**' });
let totalMaps = 0;
let mapInScrollView = 0;
let mapInView = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const maps = (content.match(/\.map\(/g) || []).length;
  totalMaps += maps;
});

console.log(`Total maps: ${totalMaps}`);
