import ExpoModulesCore
import UIKit

// Proximity Recognition Mode's sensor. iOS gives only near or far (no
// distance), and blanks the screen while the sensor is covered. Read by
// features/prayer-assistant/hooks/use-proximity-sensor.ts.
public class ProximityModule: Module {
  private var observer: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("Proximity")

    Events("onProximity")

    // Monitoring can only be switched on where the hardware has the sensor
    // (iPads and simulators leave it off), so switching it on is the test.
    Function("isAvailable") { () -> Bool in
      return DispatchQueue.main.sync {
        let device = UIDevice.current
        if device.isProximityMonitoringEnabled {
          return true
        }
        device.isProximityMonitoringEnabled = true
        let available = device.isProximityMonitoringEnabled
        device.isProximityMonitoringEnabled = false
        return available
      }
    }

    Function("start") {
      DispatchQueue.main.async {
        guard self.observer == nil else { return }
        let device = UIDevice.current
        device.isProximityMonitoringEnabled = true
        self.observer = NotificationCenter.default.addObserver(
          forName: UIDevice.proximityStateDidChangeNotification,
          object: device,
          queue: .main
        ) { [weak self] _ in
          self?.sendEvent("onProximity", [
            "near": UIDevice.current.proximityState
          ])
        }
        self.sendEvent("onProximity", ["near": device.proximityState])
      }
    }

    Function("stop") {
      DispatchQueue.main.async { self.stopMonitoring() }
    }

    OnDestroy {
      DispatchQueue.main.async { self.stopMonitoring() }
    }
  }

  private func stopMonitoring() {
    if let observer = observer {
      NotificationCenter.default.removeObserver(observer)
      self.observer = nil
    }
    UIDevice.current.isProximityMonitoringEnabled = false
  }
}
