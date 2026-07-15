const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file === 'route.js' || file === 'route.ts') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allRoutes = getAllFiles(API_DIR);

const IGNORE_PATHS = [
  path.join(API_DIR, 'auth'),
  path.join(API_DIR, 'register', 'route.js'),
  path.join(API_DIR, 'register', 'route.ts')
];

let modifiedCount = 0;

for (const filePath of allRoutes) {
  if (IGNORE_PATHS.some(ignorePath => filePath.startsWith(ignorePath))) {
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const authImport = `import { requireAuth } from "@/lib/requireAuth";\n`;
  if (!content.includes('requireAuth')) {
    content = authImport + content;
    modified = true;
  }

  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  for (const method of methods) {
    // Regex to find: export async function POST(req, ...) {
    // We want to insert our auth check right after the {
    const regex = new RegExp(`(export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{)`, 'g');
    
    content = content.replace(regex, (match) => {
      // Avoid injecting if it already exists in the file for this function
      // A simple heuristic is check if `requireAuth` is used later, but it's safer to just inject a unique variable.
      // We will check if `_auth.error` is already in the file right after this function.
      // But simpler: just check if `_authResult` is in the match block - wait, replace only gives us the match.
      
      const injection = `\n  const _authResult = await requireAuth({ roles: ["admin", "user", "moderator"] });\n  if (_authResult.error) return _authResult.error;\n`;
      modified = true;
      return match + injection;
    });
  }

  if (modified) {
    // Only write back if it doesn't already have _authResult to prevent double injection
    const originalContent = fs.readFileSync(filePath, 'utf8');
    if (!originalContent.includes('_authResult')) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedCount++;
    }
  }
}

console.log(`Modified ${modifiedCount} files.`);
