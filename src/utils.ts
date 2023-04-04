import fs from 'node:fs';
import path from 'node:path';

export const copy = (src: string, dest: string) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      const srcFile = path.resolve(src, file);
      const destFile = path.resolve(dest, file);
      copy(srcFile, destFile);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
};

export const formatTargetDir = (targetDir: string | undefined) => {
  // eslint-disable-next-line redos/no-vulnerable
  return targetDir?.trim().replace(/\/+$/g, '');
};

export const isValidPackageName = (projectName: string) => {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
};

export const toValidPackageName = (projectName: string) => {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-');
};

export const isEmpty = (path: string) => {
  const files = fs.readdirSync(path);

  return files.length === 0 || (files.length === 1 && files[0] === '.git');
};

export const emptyDir = (dir: string) => {
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') continue;

    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
};

export const pkgFromUserAgent = (userAgent: string | undefined) => {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');

  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
};
