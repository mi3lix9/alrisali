import ExpoModulesCore
import Speech

// expo-speech-recognition's supportsOnDeviceRecognition() asks
// SFSpeechRecognizer() for the device locale, so it cannot say whether Arabic
// runs on the device. This asks for one locale. Read by
// shared/lib/speech/speech-recognition.ts.
public class SpeechProbeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SpeechProbe")

    Function("probe") { (localeId: String) -> [String: Any] in
      guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: localeId)) else {
        return ["recognizer": false]
      }
      return [
        "recognizer": true,
        "isAvailable": recognizer.isAvailable,
        "supportsOnDeviceRecognition": recognizer.supportsOnDeviceRecognition,
      ]
    }
  }
}
