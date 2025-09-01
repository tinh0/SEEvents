const fs = require('fs').promises;

const { readFile, writeFile, copyFile } = fs;

console.log('Starting compatibility fix for react-native-maps');

async function reactNativeMaps() {
    const chalk = await import('chalk');
    console.log(chalk.default.green('Starting compatibility fix for react-native-maps'));

    console.log(chalk.default.yellow('[react-native-maps]'), 'Creating web compatibility for react-native-maps');
    const modulePath = 'node_modules/react-native-maps';

    await writeFile(`${modulePath}/lib/index.web.js`, 'module.exports = {}', 'utf-8');
    await copyFile(`${modulePath}/lib/index.d.ts`, `${modulePath}/lib/index.web.d.ts`);

    const pkg = JSON.parse(await readFile(`${modulePath}/package.json`, 'utf-8'));
    pkg['react-native'] = 'lib/index.js';
    pkg['main'] = 'lib/index.web.js';

    await writeFile(`${modulePath}/package.json`, JSON.stringify(pkg, null, 2), 'utf-8');
    console.log(chalk.default.green('Compatibility script executed successfully!'));
}

reactNativeMaps();