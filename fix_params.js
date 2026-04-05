const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/api');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  if (content.includes('const { roomId } = params;')) {
    content = content.replace(/\{ params \}: \{ params: \{ roomId: string \} \}/g, '{ params }: { params: Promise<{ roomId: string }> | { roomId: string } }');
    content = content.replace('const { roomId } = params;', 'const { roomId } = await params;');
    modified = true;
  }
  if (content.includes('const { controllerId } = params;')) {
    content = content.replace(/\{ params \}: \{ params: \{ controllerId: string \} \}/g, '{ params }: { params: Promise<{ controllerId: string }> | { controllerId: string } }');
    content = content.replace('const { controllerId } = params;', 'const { controllerId } = await params;');
    modified = true;
  }
  if (modified) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
