const fs = require('fs');
const file = 'e:/Projects/AI-Email-Checker/email-command-center/app/(main)/settings/SettingsClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace onClick for handleFontChange
content = content.replace(/onClick=\{\(\) \=\> handleFontChange\(\"font\-/g, 'onClick={() => setDraftFont(\"font-');

// replace font === 'font-
content = content.replace(/font === \'font\-/g, "activeFontSelection === 'font-");

fs.writeFileSync(file, content);
