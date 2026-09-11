const fs = require('fs');
const path = require('path');

const expoNotificationsDir = path.join(__dirname, '..', 'node_modules', 'expo-notifications');

let patched = false;

// 1. Patch warnOfExpoGoPushUsage so it doesn't throw
const warnFiles = [
  path.join(expoNotificationsDir, 'build', 'warnOfExpoGoPushUsage.js'),
  path.join(expoNotificationsDir, 'src', 'warnOfExpoGoPushUsage.ts'),
];

warnFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('throw new Error(message);')) {
      content = content.replace('throw new Error(message);', 'console.warn(message); didWarn = true;');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[Patch] Successfully patched warnOfExpoGoPushUsage: ${filePath}`);
      patched = true;
    }
  }
});

// 2. Patch TopicSubscriptionModule.android.js (Cannot find native module 'ExpoTopicSubscriptionModule')
const topicModulePath = path.join(expoNotificationsDir, 'build', 'TopicSubscriptionModule.android.js');
if (fs.existsSync(topicModulePath)) {
  let content = fs.readFileSync(topicModulePath, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    content = content.replace(
      "import { requireNativeModule } from 'expo-modules-core';",
      "import { requireOptionalNativeModule } from 'expo-modules-core';"
    );
    content = content.replace(
      "requireNativeModule('ExpoTopicSubscriptionModule')",
      "requireOptionalNativeModule('ExpoTopicSubscriptionModule') || {}"
    );
    fs.writeFileSync(topicModulePath, content, 'utf8');
    console.log(`[Patch] Successfully patched TopicSubscriptionModule.android.js`);
    patched = true;
  }
}

// 3. Patch PushTokenManager.native.js
const pushTokenManagerPath = path.join(expoNotificationsDir, 'build', 'PushTokenManager.native.js');
if (fs.existsSync(pushTokenManagerPath)) {
  let content = fs.readFileSync(pushTokenManagerPath, 'utf8');
  if (content.includes("requireNativeModule('ExpoPushTokenManager')")) {
    content = content.replace(
      "import { requireNativeModule } from 'expo-modules-core';",
      "import { requireOptionalNativeModule } from 'expo-modules-core';"
    );
    content = content.replace(
      "requireNativeModule('ExpoPushTokenManager')",
      "requireOptionalNativeModule('ExpoPushTokenManager') || { addListener: () => ({ remove: () => {} }), removeListeners: () => {} }"
    );
    fs.writeFileSync(pushTokenManagerPath, content, 'utf8');
    console.log(`[Patch] Successfully patched PushTokenManager.native.js`);
    patched = true;
  }
}

// 4. Patch ServerRegistrationModule.native.js
const serverRegPath = path.join(expoNotificationsDir, 'build', 'ServerRegistrationModule.native.js');
if (fs.existsSync(serverRegPath)) {
  let content = fs.readFileSync(serverRegPath, 'utf8');
  if (content.includes("requireNativeModule('NotificationsServerRegistrationModule')")) {
    content = content.replace(
      "import { requireNativeModule } from 'expo-modules-core';",
      "import { requireOptionalNativeModule } from 'expo-modules-core';"
    );
    content = content.replace(
      "requireNativeModule('NotificationsServerRegistrationModule')",
      "requireOptionalNativeModule('NotificationsServerRegistrationModule') || {}"
    );
    fs.writeFileSync(serverRegPath, content, 'utf8');
    console.log(`[Patch] Successfully patched ServerRegistrationModule.native.js`);
    patched = true;
  }
}

// 5. Patch DevicePushTokenAutoRegistration.fx.js
const fxFile = path.join(expoNotificationsDir, 'build', 'DevicePushTokenAutoRegistration.fx.js');
if (fs.existsSync(fxFile)) {
  let content = fs.readFileSync(fxFile, 'utf8');
  if (content.includes('addPushTokenListener(async (token) => {') && !content.includes('try { addPushTokenListener')) {
    content = content.replace(
      'addPushTokenListener(async (token) => {',
      'try { addPushTokenListener(async (token) => {'
    );
    content = content.replace(
      'ServerRegistrationModule.getRegistrationInfoAsync().then(',
      '} catch(e) { console.warn(e); }\nServerRegistrationModule?.getRegistrationInfoAsync?.()?.then?.('
    );
    fs.writeFileSync(fxFile, content, 'utf8');
    console.log(`[Patch] Successfully patched DevicePushTokenAutoRegistration.fx.js`);
    patched = true;
  }
}

console.log('[Patch] Complete.');
