const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'components', 'order');

const replacements = [
  { regex: /text-\[\#26251e\]\/60/g, replacement: 'text-muted-foreground' },
  { regex: /text-\[\#26251e\]\/40/g, replacement: 'text-muted-foreground/70' },
  { regex: /text-\[\#26251e\]\/80/g, replacement: 'text-foreground/80' },
  { regex: /text-\[\#26251e\]/g, replacement: 'text-foreground' },
  { regex: /bg-\[\#f2f1ed\]/g, replacement: 'bg-card' },
  { regex: /bg-\[\#f7f7f4\]/g, replacement: 'bg-background' },
  { regex: /bg-\[\#ebeae5\]/g, replacement: 'bg-accent' },
  { regex: /hover:bg-\[\#ebeae5\]/g, replacement: 'hover:bg-accent' },
  { regex: /bg-\[\#26251e\]\/30/g, replacement: 'bg-foreground/30' },
  { regex: /bg-\[\#26251e\]\/10/g, replacement: 'bg-foreground/10' },
  { regex: /bg-\[\#26251e\]/g, replacement: 'bg-primary' },
  { regex: /hover:bg-\[\#3b3a33\]/g, replacement: 'hover:bg-primary/90' },
  { regex: /text-\[\#f7f7f4\]/g, replacement: 'text-primary-foreground' },
  { regex: /border-\[color-mix\(in_oklab,#26251e_10%,transparent\)\]/g, replacement: 'border-border' },
  { regex: /hover:border-\[color-mix\(in_oklab,#26251e_20%,transparent\)\]/g, replacement: 'hover:border-border/80' },
  { regex: /border-\[\#26251e\]/g, replacement: 'border-foreground' },
  { regex: /bg-\[\#F0FDF4\]/g, replacement: 'bg-green-100 dark:bg-green-950' },
  { regex: /text-\[\#16A34A\]/g, replacement: 'text-green-600 dark:text-green-400' },
  { regex: /border-\[\#BBF7D0\]/g, replacement: 'border-green-200 dark:border-green-800' },
  { regex: /bg-\[\#FEF2F2\]/g, replacement: 'bg-red-100 dark:bg-red-950' },
  { regex: /text-\[\#DC2626\]/g, replacement: 'text-red-600 dark:text-red-400' },
  { regex: /border-\[\#FECACA\]/g, replacement: 'border-red-200 dark:border-red-800' },
  { regex: /bg-\[\#F4F4F5\]/g, replacement: 'bg-zinc-100 dark:bg-zinc-800' },
  { regex: /text-\[\#71717A\]/g, replacement: 'text-zinc-500 dark:text-zinc-400' },
  { regex: /border-\[\#E4E4E7\]/g, replacement: 'border-zinc-200 dark:border-zinc-700' },
  { regex: /bg-white/g, replacement: 'bg-background' },
  { regex: /border-gray-200/g, replacement: 'border-border' },
  { regex: /border-neutral-200/g, replacement: 'border-border' },
  { regex: /border-\[\#00000014\]/g, replacement: 'border-border' }
];

function processDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });
      fs.writeFileSync(fullPath, content);
      console.log(`Processed ${fullPath}`);
    }
  });
}

processDirectory(directoryPath);
