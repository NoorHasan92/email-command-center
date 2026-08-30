const fs = require('fs');
const file = 'e:/Projects/AI-Email-Checker/email-command-center/app/(main)/admin/AdminClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // Search input
  ['bg-black/40 border-white/10', 'bg-secondary border-border/50'],
  
  // Select filter
  ['border border-white/10 bg-black/40', 'border border-border/50 bg-secondary'],
  
  // Clear filter button
  ['border border-white/10 bg-secondary/50', 'border border-border/50 bg-secondary/50'],
  ['hover:bg-white/10', 'hover:bg-foreground/10'],
  
  // Table head
  ['bg-black/40 text-muted-foreground border-b border-white/10', 'bg-secondary/60 text-muted-foreground border-b border-border/50'],
  ['border-b border-white/10', 'border-b border-border/50'],
  
  // Badges
  ['bg-white/5', 'bg-foreground/5'],
  ['border-white/10', 'border-border/50'],
  
  // Mismatches / Errors
  ['border-white/5', 'border-border/50'],
  
  // Additional leftover black/40
  ['bg-black/40', 'bg-secondary'],
  ['bg-black/20', 'bg-secondary/50'],
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});

fs.writeFileSync(file, content);
console.log('Done');
