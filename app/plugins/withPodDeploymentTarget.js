// Raises every CocoaPods target to the app's iOS deployment target and silences pod warnings.
// Some dependencies (AsyncStorage, SDWebImage) still declare iOS 9-13, which Xcode 27 rejects.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# withPodDeploymentTarget';

module.exports = function withPodDeploymentTarget(config, { target = '15.1' } = {}) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (contents.includes(MARKER)) return cfg;

      const hook = `  post_install do |installer|
    ${MARKER}
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new('${target}')
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}'
        end
        # Third-party pod warnings aren't actionable here; keep the issue list for app code.
        bc.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
        bc.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
      end
    end
`;
      if (!contents.includes('  post_install do |installer|\n')) {
        throw new Error('withPodDeploymentTarget: post_install hook not found in Podfile');
      }
      contents = contents.replace('  post_install do |installer|\n', hook);
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
