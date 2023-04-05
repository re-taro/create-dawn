import { join } from 'node:path';
import { execaCommandSync } from 'execa';
import fs from 'fs-extra';
import { afterEach, beforeEach, expect, test } from 'vitest';
import type { ExecaSyncReturnValue, SyncOptions } from 'execa';

const CLI_PATH = join(__dirname, '..');

const projectName = 'test-app';
const genPath = join(__dirname, projectName);

const run = (
  args: string[],
  options: SyncOptions = {},
): ExecaSyncReturnValue => {
  return execaCommandSync(`node ${CLI_PATH} ${args.join(' ')}`, options);
};

const createNonEmptyDir = () => {
  fs.mkdirpSync(genPath);

  const pkgJson = join(genPath, 'package.json');
  fs.writeFileSync(pkgJson, '{ "foo": "bar" }');
};

const templateFiles = fs
  .readdirSync(join(CLI_PATH, 'template-react-emotion'))
  .map((filePath: string) =>
    filePath === '_gitignore' ? '.gitignore' : filePath,
  )
  .sort();

beforeEach(() => fs.ensureDir(genPath));
afterEach(() => fs.remove(genPath));

test('prompts for the project name if none supplied', () => {
  const { stdout } = run([]);
  expect(stdout).toContain('Project name:');
});

test('prompts for the framework if none supplied when target dir is current directory', () => {
  fs.mkdirpSync(genPath);
  const { stdout } = run(['.'], { cwd: genPath });
  expect(stdout).toContain('Select a framework:');
});

test('prompts for the framework if none supplied', () => {
  const { stdout } = run([projectName]);
  expect(stdout).toContain('Select a framework:');
});

test('prompts for the framework on not supplying a value for --template', () => {
  const { stdout } = run([projectName, '--template']);
  expect(stdout).toContain('Select a framework:');
});

test('prompts for the framework on supplying an invalid template', () => {
  const { stdout } = run([projectName, '--template', 'unknown']);
  expect(stdout).toContain(
    '"unknown" isn\'t a valid template. Please choose from below:',
  );
});

test('asks to overwrite non-empty target directory', () => {
  createNonEmptyDir();
  const { stdout } = run([projectName], { cwd: __dirname });
  expect(stdout).toContain(`Target directory "${projectName}" is not empty.`);
});

test('asks to overwrite non-empty current directory', () => {
  createNonEmptyDir();
  const { stdout } = run(['.'], { cwd: genPath });
  expect(stdout).toContain('Current directory is not empty.');
});

test('successfully scaffolds a project based on react starter template', () => {
  const { stdout } = run([projectName, '--template', 'react-emotion'], {
    cwd: __dirname,
  });
  const generatedFiles = fs.readdirSync(genPath).sort();

  expect(stdout).toContain(`Scaffolding project in ${genPath}`);
  expect(templateFiles).toEqual(generatedFiles);
});

test('works with the -t alias', () => {
  const { stdout } = run([projectName, '-t', 'react-emotion'], {
    cwd: __dirname,
  });
  const generatedFiles = fs.readdirSync(genPath).sort();

  expect(stdout).toContain(`Scaffolding project in ${genPath}`);
  expect(templateFiles).toEqual(generatedFiles);
});
