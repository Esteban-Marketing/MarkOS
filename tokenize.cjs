const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '.agent/markos/templates');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const components = ['RESEARCH', 'MIR', 'MSP'];

components.forEach(comp => {
  const compDir = path.join(TEMPLATES_DIR, comp);
  walkDir(compDir, (filePath) => {
    if (!filePath.endsWith('.md')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const token = `<!-- markos-token: ${comp} -->`;
    const relPath = path.relative(__dirname, filePath).replace(/\\/g, '/');
    const overrideMsg = `\n> [!NOTE] OVERRIDE PATH: Copy this file to .markos-local/${relPath.split('templates/')[1]} to customize it safely.\n`;

    let changed = false;

    // 1. Inject Token
    if (!content.includes(token)) {
      // Find the first top-level header or frontmatter end
      const lines = content.split('\n');
      let injectIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ')) {
          injectIdx = i;
          break;
        }
      }
      
      if (injectIdx !== -1) {
        lines.splice(injectIdx + 1, 0, `\n${token}`);
        content = lines.join('\n');
        changed = true;
      } else {
        // If no H1 found, prepend
        content = `${token}\n\n` + content;
        changed = true;
      }
    }

    // 2. Inject Override instruction conditionally
    const fileName = path.basename(filePath);
    const ignoreList = ['README.md', 'SETUP.md', 'STATE.md', 'CHANGELOG.md', 'PROJECT.md', 'VERIFICATION.md'];
    if (!ignoreList.includes(fileName) && !content.includes('OVERRIDE PATH:')) {
      // Inject after the token
      content = content.replace(token, token + overrideMsg);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${relPath}`);
    }
  });
});

console.log('Tokenization complete.');
