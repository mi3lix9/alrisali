Pod::Spec.new do |s|
  s.name           = 'SpeechProbe'
  s.version        = '1.0.0'
  s.summary        = 'Per-locale SFSpeechRecognizer capabilities'
  s.author         = 'alrisali'
  s.homepage       = 'https://alrisali.com'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Speech'
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
