const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'warnOfExpoGoPushUsage.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'warnOfExpoGoPushUsage.ts'),
];

let patched = false;

targetFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('throw new Error(message);')) {
      content = content.replace('throw new Error(message);', 'console.warn(message); didWarn = true;');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[Patch] Successfully patched: ${filePath}`);
      patched = true;
    }
  }
});

// Also patch DevicePushTokenAutoRegistration.fx.js to avoid calling push listener in Expo Go on Android
const fxFile = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'DevicePushTokenAutoRegistration.fx.js');
if (fs.existsSync(fxFile)) {
  let content = fs.readFileSync(fxFile, 'utf8');
  if (content.includes('addPushTokenListener(async (token) => {')) {
    content = content.replace(
      'addPushTokenListener(async (token) => {',
      'try { addPushTokenListener(async (token) => {'
    );
    content = content.replace(
      'ServerRegistrationModule.getRegistrationInfoAsync().then(',
      '} catch(e) { console.warn(e); }\nServerRegistrationModule.getRegistrationInfoAsync().then('
    );
    fs.writeFileSync(fxFile, content, 'utf8');
    console.log(`[Patch] Successfully patched: ${fxFile}`);
    patched = true;
  }
}

if (!patched) {
  console.log('[Patch] Files already patched or not found.');
}
