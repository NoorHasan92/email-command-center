const fs = require('fs');
const file = 'e:/Projects/AI-Email-Checker/email-command-center/app/(main)/admin/AdminClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // Fix text-white
  ['text-white">.env', 'text-foreground">.env'],
  ['text-white">@{telegramBotUsername', 'text-foreground">@{telegramBotUsername'],
  
  // Fix red error cards
  ['border-red-900/30 bg-red-950/20', 'border-destructive/30 bg-destructive/10'],
  ['text-red-100', 'text-foreground font-bold'],
  ['text-red-400/80', 'text-destructive'],
];

replacements.forEach(([search, replace]) => {
  content = content.split(search).join(replace);
});

fs.writeFileSync(file, content);
console.log('Done');
