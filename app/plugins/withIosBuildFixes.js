// iOS build fixes applied on every `expo prebuild`, since ios/ is generated:
// - Raises every CocoaPods target to the app's deployment target. Some dependencies
//   (AsyncStorage, SDWebImage) still declare iOS 9-13, which Xcode 27 rejects.
// - Silences warnings inside pods, and the header warnings Expo/React Native headers raise
//   when the app target imports them. Other warnings in the app target still show.
const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# withIosBuildFixes';

// Clang groups that fire only from third-party headers imported into the app target.
const APP_HEADER_WARNING_FLAGS = ['-Wno-nullability-completeness', '-Wno-nonportable-include-path'];

function withPodSettings(config, target) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (contents.includes(MARKER)) return cfg;

      const anchor = '  post_install do |installer|\n';
      if (!contents.includes(anchor)) {
        throw new Error('withIosBuildFixes: post_install hook not found in Podfile');
      }
      contents = contents.replace(
        anchor,
        `${anchor}    ${MARKER}
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new('${target}')
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}'
        end
        bc.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        bc.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
      end
    end
`,
      );
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
}

function withAppTargetWarningFlags(config) {
  return withXcodeProject(config, (cfg) => {
    const configs = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const entry of Object.values(configs)) {
      const settings = entry && entry.buildSettings;
      // Target-level configs of the app have an Info.plist; project-level ones don't.
      if (!settings || !settings.INFOPLIST_FILE) continue;
      settings.WARNING_CFLAGS = [
        '"$(inherited)"',
        ...APP_HEADER_WARNING_FLAGS.map((f) => `"${f}"`),
      ];
    }
    return cfg;
  });
}

module.exports = function withIosBuildFixes(config, { target = '15.1' } = {}) {
  return withAppTargetWarningFlags(withPodSettings(config, target));
};
