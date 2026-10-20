package expo.modules.androidalerts.adhan

/**
 * An At-Time Alert that plays the full adhan. `id` is the planner's alert id
 * (date, Prayer Time, kind); `file` is the installed recording's file name
 * (a raw resource, as expo-notifications copies sounds) or an absolute path.
 */
data class AdhanAlarm(
  val id: String,
  val fireAt: Long,
  val title: String,
  val body: String,
  val file: String,
  val stopLabel: String,
  val channelName: String,
)

/** How the adhan service plays. Mirrors `adhanServiceSettingsSchema`. */
data class AdhanSettings(
  val stream: String,
  val playDuringDnd: Boolean,
  val fullScreen: Boolean,
) {
  companion object {
    val DEFAULT = AdhanSettings(stream = "alarm", playDuringDnd = false, fullScreen = false)
  }
}

/** An alarm delivered later than this after its time (device off) is dropped, as the planner does. */
const val STALE_ALARM_MS = 30L * 60L * 1000L
