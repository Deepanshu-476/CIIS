import { ESLint } from 'eslint';

// Focused runtime-reference check, independent of unrelated style warnings.
const eslint = new ESLint({ overrideConfig: { rules: { 'no-undef': 'error' } } });
const results = await eslint.lintFiles(['src']);
const failures = results.flatMap(result => result.messages
  .filter(message => message.fatal || message.ruleId === 'no-undef')
  .map(message => `${result.filePath}:${message.line}:${message.column} ${message.message}`));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${results.length} source files: no undefined references or parse errors.`);
}
