// withGoogleFit - an Expo config plugin to add Android permissions and gradle dependencies
// NOTE: This plugin is a scaffold. It uses @expo/config-plugins API patterns.
// To use: add to app.json under 'plugins': ['./expo-config-plugins/withGoogleFit.js']
// Then run `expo prebuild` to apply native changes.
//
// The plugin will:
//  - Add ACTIVITY_RECOGNITION permission (Android 10+)
//  - Ensure Google Fit API gradle dependency placeholder is added (developer must edit exact version)
const { withAndroidManifest, AndroidConfig, withAppBuildGradle } = require('@expo/config-plugins');

function addActivityRecognitionPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const manifestUsesPermissions = manifest.manifest['uses-permission'] || [];
    const has = manifestUsesPermissions.some(p => p['$'] && p['$']['android:name'] === 'android.permission.ACTIVITY_RECOGNITION');
    if (!has) {
      manifest.manifest['uses-permission'] = manifestUsesPermissions.concat([ { $: { 'android:name': 'android.permission.ACTIVITY_RECOGNITION' } } ]);
    }
    return config;
  });
}

function addGoogleFitGradle(config) {
  return withAppBuildGradle(config, async (config) => {
    // This is a safe append: developers should verify versions and repositories.
    const buildGradle = config.modResults;
    if (buildGradle.language === 'groovy') {
      let content = buildGradle.contents;
      const marker = '// POCKETDOCTOR_GOOGLE_FIT_DEPENDENCY';
      if (!content.includes(marker)) {
        // Append a comment and a placeholder dependency - replace with actual dependency as needed.
        content += '\n\n// POCKETDOCTOR_GOOGLE_FIT_DEPENDENCY - add Google Fit SDK dependency here\n// implementation "com.google.android.gms:play-services-fitness:21.0.0"\n';
        config.modResults.contents = content;
      }
    }
    return config;
  });
}

module.exports = function withGoogleFit(config) {
  config = addActivityRecognitionPermission(config);
  config = addGoogleFitGradle(config);
  return config;
};
