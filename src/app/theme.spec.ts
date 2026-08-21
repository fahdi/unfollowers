import { readFileSync } from 'node:fs';

/**
 * `theme/variables.scss` is where Ionic expects an app's design tokens to live,
 * and the README points contributors at it. A theme file that nothing imports
 * is worse than no theme file: edits to it silently do nothing.
 */
describe('global stylesheet', () => {
  const styles = readFileSync('src/styles.scss', 'utf8');

  it('imports the Ionic theme variables', () => {
    expect(styles).toContain('theme/variables');
  });

  it('imports the required Ionic core stylesheet', () => {
    expect(styles).toContain('@ionic/angular/css/core.css');
  });
});
