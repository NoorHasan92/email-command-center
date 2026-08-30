const fs = require('fs');
const file = 'e:/Projects/AI-Email-Checker/email-command-center/app/(main)/admin/AdminClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// The script replaces all hardcoded dark mode utility classes with semantic classes.

const replacements = [
  // Gradients
  ['to-indigo-950/20', 'dark:to-indigo-950/20 to-indigo-500/5'],
  
  // Backgrounds
  ['bg-black/40', 'bg-secondary'],
  ['bg-black/20', 'bg-secondary/50'],
  
  // White backgrounds
  ['bg-white/5', 'bg-foreground/5'],
  ['bg-white/10', 'bg-foreground/10'],
  ['hover:bg-white/[0.02]', 'hover:bg-secondary/80'],
  
  // Borders
  ['border-white/5', 'border-border/60'],
  ['border-white/10', 'border-border'],
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});

fs.writeFileSync(file, content);
console.log('Done');
