package expo.modules.proximity

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Proximity Recognition Mode's sensor. Android reports the distance in cm and
// the sensor's range; many phones only ever report 0 or the range, so near is
// any distance below the range (the platform's own convention). Read by
// features/prayer-assistant/hooks/use-proximity-sensor.ts.
class ProximityModule : Module() {
  private var listener: SensorEventListener? = null

  private val sensorManager: SensorManager?
    get() = appContext.reactContext?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  private val sensor: Sensor?
    get() = sensorManager?.getDefaultSensor(Sensor.TYPE_PROXIMITY)

  override fun definition() = ModuleDefinition {
    Name("Proximity")

    Events("onProximity")

    Function("isAvailable") { sensor != null }

    Function("start") {
      val manager = sensorManager
      val proximity = sensor
      if (manager == null || proximity == null || listener != null) {
        return@Function null
      }
      val next = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          val distance = event.values.firstOrNull() ?: return
          sendEvent(
            "onProximity",
            mapOf(
              "near" to (distance < proximity.maximumRange),
              "distance" to distance.toDouble(),
              "maxRange" to proximity.maximumRange.toDouble()
            )
          )
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
      }
      listener = next
      manager.registerListener(next, proximity, SensorManager.SENSOR_DELAY_NORMAL)
    }

    Function("stop") { stopListening() }

    OnDestroy { stopListening() }
  }

  private fun stopListening() {
    listener?.let { sensorManager?.unregisterListener(it) }
    listener = null
  }
}
