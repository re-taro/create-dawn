import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';
import {
  cyan,
  gray,
  lightCyan,
  lightGreen,
  lightMagenta,
  lightRed,
  magenta,
  red,
  reset,
  yellow,
} from 'kolorist';
import prompts from 'prompts';
import {
  copy,
  emptyDir,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  pkgFromUserAgent,
  toValidPackageName,
} from './utils';
import type { Framework } from './model';
import type { Answers } from 'prompts';

const argv = minimist<{
  t?: string
  template?: string
}>(process.argv.slice(2), { string: ['_'] });

const cwd = process.cwd();

const frameworks = [
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'emotion',
        display: 'Emotion',
        color: lightMagenta,
      },
      {
        name: 'vanilla-extract',
        display: 'vanilla-extract',
        color: lightCyan,
      },
      {
        name: 'ecsstatic',
        display: 'ecsstatic',
        color: lightRed,
      },
      {
        name: 'chakra-ui',
        display: 'Chakra UI',
        color: lightGreen,
      },
    ],
  },
  {
    name: 'react-bff',
    display: 'React with BFF',
    color: cyan,
    variants: [
      {
        name: 'emotion',
        display: 'Emotion',
        color: lightMagenta,
      },
      {
        name: 'vanilla-extract',
        display: 'vanilla-extract',
        color: lightCyan,
      },
      {
        name: 'ecsstatic',
        display: 'ecsstatic',
        color: lightRed,
      },
      {
        name: 'chakra-ui',
        display: 'Chakra UI',
        color: lightGreen,
      },
    ],
  },
  {
    name: 'preact',
    display: 'Preact',
    color: magenta,
    variants: [
      {
        name: 'emotion',
        display: 'Emotion',
        color: lightMagenta,
      },
      {
        name: 'vanilla-extract',
        display: 'vanilla-extract',
        color: lightCyan,
      },
      {
        name: 'ecsstatic',
        display: 'ecsstatic',
        color: lightRed,
      },
      {
        name: 'chakra-ui',
        display: 'Chakra UI',
        color: lightGreen,
      },
    ],
  },
  {
    name: 'preact-bff',
    display: 'Preact with BFF',
    color: magenta,
    variants: [
      {
        name: 'emotion',
        display: 'Emotion',
        color: lightMagenta,
      },
      {
        name: 'vanilla-extract',
        display: 'vanilla-extract',
        color: lightCyan,
      },
      {
        name: 'ecsstatic',
        display: 'ecsstatic',
        color: lightRed,
      },
      {
        name: 'chakra-ui',
        display: 'Chakra UI',
        color: lightGreen,
      },
    ],
  },
  {
    name: 'next',
    display: 'Next.js',
    color: gray,
    variants: [
      {
        name: 'emotion',
        display: 'Emotion',
        color: lightMagenta,
      },
      {
        name: 'vanilla-extract',
        display: 'vanilla-extract',
        color: lightCyan,
      },
      {
        name: 'ecsstatic',
        display: 'ecsstatic',
        color: lightRed,
      },
      {
        name: 'chakra-ui',
        display: 'Chakra UI',
        color: lightGreen,
      },
    ],
  },
  {
    name: 'next-app',
    display: 'Next.js (app Dir)',
    color: gray,
    variants: [
      {
        name: 'css-modules',
        display: 'CSS Modules',
        color: yellow,
      },
    ],
  },
] as const satisfies ReadonlyArray<Framework>;

const templates = frameworks
  .map(f => (f.variants && f.variants.map(v => v.name)) || [f.name])
  .reduce((a, b) => a.concat(b), []);

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
};

const defaultTargetDir = 'project';

const init = async() => {
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;

  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () =>
    targetDir === '.' ? path.basename(path.resolve()) : targetDir;

  let result: Answers<
  'projectName' | 'overwrite' | 'packageName' | 'framework' | 'variant'
  > = {
    projectName: defaultTargetDir,
    overwrite: false,
    packageName: () => toValidPackageName(getProjectName()),
    framework: 0,
    variant: null,
  };

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            `${
              targetDir === '.'
                ? 'Current directory'
                : `Target directory "${targetDir}"`
            } is not empty. Remove existing files and continue?`,
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false)
              throw new Error(`${red('✖')} Operation cancelled`);

            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: dir =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type:
            argTemplate
            && templates.includes(argTemplate as (typeof templates)[number])
              ? null
              : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string'
            && !templates.includes(argTemplate as (typeof templates)[number])
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `,
              )
              : reset('Select a framework:'),
          initial: 0,
          choices: frameworks.map((framework) => {
            const frameworkColor = framework.color;
            return {
              title: frameworkColor(framework.display),
              value: framework,
            };
          }),
        },
        {
          type: (framework: Framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: reset('Select a variant:'),
          choices: (framework: Framework) =>
            framework.variants.map((variant) => {
              const variantColor = variant.color;
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name,
              };
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(`${red('✖')} Operation cancelled`);
        },
      },
    );
  } catch (cancelled) {
    if (cancelled instanceof Error) console.log(cancelled.message);
  }

  const { framework, overwrite, packageName, variant } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite) emptyDir(root);
  else if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });

  const template: string = variant || framework.name || argTemplate;

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  console.log(`\nScaffolding project in ${root}...`);

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
    `template-${template}`,
  );

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) fs.writeFileSync(targetPath, content);
    else copy(path.join(templateDir, file), targetPath);
  };

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter(f => f !== 'package.json')) write(file);

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'),
  );

  pkg.name = packageName || getProjectName();

  write('package.json', `${JSON.stringify(pkg, null, 2)}\n`);

  const cdProjectName = path.relative(cwd, root);
  console.log('\nDone. Now run:\n');
  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`,
    );
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn dev');
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }
  console.log();
};

init().catch((e: unknown) => {
  console.error(e);
});
