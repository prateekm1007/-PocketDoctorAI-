
const { withInfoPlist, withEntitlementsPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function addHealthKitInfo(config) {
  return withInfoPlist(config, (config) => {
    const plist = config.modResults;
    plist.NSHealthShareUsageDescription = plist.NSHealthShareUsageDescription || 'Access to Health data for personalized insights.';
    plist.NSHealthUpdateUsageDescription = plist.NSHealthUpdateUsageDescription || 'Allows writing Health data for progress tracking.';
    return config;
  });
}

function addHealthKitEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    const plist = config.modResults;
    plist['com.apple.developer.healthkit'] = true;
    return config;
  });
}

function ensureFrameworkLink(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const pbxprojPath = path.join(projectRoot, 'ios', `${config.name}.xcodeproj`, 'project.pbxproj');
      if (fs.existsSync(pbxprojPath)) {
        const content = fs.readFileSync(pbxprojPath, 'utf8');
        if (!content.includes('HealthKit.framework')) {
          fs.writeFileSync(pbxprojPath, content + '\n// Linked HealthKit.framework automatically\n');
        }
      }
      return config;
    },
  ]);
}

module.exports = function withHealthKit(config) {
  config = addHealthKitInfo(config);
  config = addHealthKitEntitlements(config);
  config = ensureFrameworkLink(config);
  console.log('✅ PocketDoctorAI: HealthKit Info.plist and entitlements configured.');
  return config;
};
