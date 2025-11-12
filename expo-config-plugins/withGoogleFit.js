
// withGoogleFit - Automated Gradle + Manifest plugin
const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

function addActivityRecognitionPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const usesPermissions = manifest.manifest['uses-permission'] || [];
    if (!usesPermissions.some(p => p['$']?.['android:name'] === 'android.permission.ACTIVITY_RECOGNITION')) {
      usesPermissions.push({ $: { 'android:name': 'android.permission.ACTIVITY_RECOGNITION' } });
      manifest.manifest['uses-permission'] = usesPermissions;
    }
    return config;
  });
}

function injectGradleDependency(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    const marker = 'implementation "com.google.android.gms:play-services-fitness:21.0.0"';
    if (!contents.includes(marker)) {
      contents = contents.replace(/dependencies \{/, match => match + "\n    " + marker);
      config.modResults.contents = contents;
    }
    return config;
  });
}

module.exports = function withGoogleFit(config) {
  config = addActivityRecognitionPermission(config);
  config = injectGradleDependency(config);
  console.log('✅ PocketDoctorAI: Google Fit permissions and dependency configured.');
  return config;
};
