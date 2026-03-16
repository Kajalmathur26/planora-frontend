const fs = require('fs');
const path = require('path');

const directory = './src';

// Very careful, targeted replacements
const replacements = [
  { regex: /text-violet-400/g, replacement: 'text-primary' },
  { regex: /text-violet-300\/80/g, replacement: 'text-primary' },
  { regex: /text-violet-300/g, replacement: 'text-primary' },
  { regex: /bg-violet-600\/10/g, replacement: 'bg-primary/10' },
  { regex: /bg-violet-600\/20/g, replacement: 'bg-primary/20' },
  { regex: /bg-violet-600\/30/g, replacement: 'bg-primary/30' },
  { regex: /bg-violet-500\/5/g, replacement: 'bg-primary/10' },
  { regex: /bg-violet-500\/10/g, replacement: 'bg-primary/20' },
  { regex: /bg-violet-500\/15/g, replacement: 'bg-primary/20' },
  { regex: /bg-violet-500\/20/g, replacement: 'bg-primary/20' },
  { regex: /bg-violet-500\/30/g, replacement: 'bg-primary/30' },
  { regex: /bg-violet-600/g, replacement: 'bg-primary' },
  { regex: /bg-violet-500/g, replacement: 'bg-primary' },
  { regex: /border-violet-500\/10/g, replacement: 'border-primary/20' },
  { regex: /border-violet-500\/20/g, replacement: 'border-primary/20' },
  { regex: /border-violet-500\/30/g, replacement: 'border-primary/30' },
  { regex: /border-violet-500\/50/g, replacement: 'border-primary/50' },
  { regex: /border-t-violet-500/g, replacement: 'border-t-primary' },
  { regex: /border-t-violet-400/g, replacement: 'border-t-primary' },
  { regex: /ring-violet-500/g, replacement: 'ring-primary' },
  { regex: /shadow-violet-500\/20/g, replacement: 'shadow-primary/20' },
  { regex: /shadow-\[0_0_10px_rgba\(139,92,246,0\.3\)\]/g, replacement: 'shadow-[0_0_10px_hsl(var(--primary)/0.3)]' },
  { regex: /shadow-\[0_0_15px_rgba\(139,92,246,0\.3\)\]/g, replacement: 'shadow-[0_0_15px_hsl(var(--primary)/0.3)]' },
  { regex: /shadow-\[0_0_40px_rgba\(139,92,246,0\.4\)\]/g, replacement: 'shadow-[0_0_40px_hsl(var(--primary)/0.4)]' },
  // specific components gradients
  { regex: /from-violet-600 to-indigo-500/g, replacement: 'from-primary to-accent' },
  { regex: /from-violet-600 to-indigo-600/g, replacement: 'from-primary to-accent' },
  { regex: /from-violet-400 via-purple-400 to-indigo-400/g, replacement: 'from-primary via-accent to-primary' },
  { regex: /bg-violet-900\/5/g, replacement: 'bg-primary/5' },
];

function isComponent(filePath) {
  return filePath.endsWith('.jsx') || filePath.endsWith('.js');
}

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (isComponent(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      replacements.forEach(({ regex, replacement }) => {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(directory);
console.log('Color replacement sweep complete.');
