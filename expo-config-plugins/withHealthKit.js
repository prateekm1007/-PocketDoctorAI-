// withHealthKit - Expo config plugin to add HealthKit entitlements and Info.plist keys
// Usage: add to app.json under 'plugins': ['./expo-config-plugins/withHealthKit.js']
// Then run `expo prebuild` and `eas build`
// The plugin will:
//  - Add NSHealthShareUsageDescription and NSHealthUpdateUsageDescription to Info.plist
//  - Add HealthKit capability (entitlements) scaffold in ios/ directory
const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

function addHealthKitInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    config.modResults = config.modResults || {};
    if (!config.modResults.NSHealthShareUsageDescription) {
      config.modResults.NSHealthShareUsageDescription = 'PocketDoctorAI requires Health data to provide personalized insights.';
    }
    if (!config.modResults.NSHealthUpdateUsageDescription) {
      config.modResults.NSHealthUpdateUsageDescription = 'PocketDoctorAI may write health data to HealthKit to store user metrics.';
    }
    return config;
  });
}

function addHealthKitEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults = config.modResults || {};
    if (!config.modResults['com.apple.developer.healthkit']) {
      config.modResults['com.apple.developer.healthkit'] = true;
    }
    // Optionally include read/write types - developers should configure these in Xcode after prebuild
    return config;
  });
}

module.exports = function withHealthKit(config) {
  config = addHealthKitInfoPlist(config);
  config = addHealthKitEntitlements(config);
  return config;
};
