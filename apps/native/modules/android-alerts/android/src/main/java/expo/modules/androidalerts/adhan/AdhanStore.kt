package expo.modules.androidalerts.adhan

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** The armed alarms and the settings, kept across reboots in the app's private storage. */
class AdhanStore(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences(NAME, Context.MODE_PRIVATE)

  fun settings(): AdhanSettings =
    AdhanSettings(
      stream = prefs.getString(STREAM, null)?.takeIf { it == "alarm" || it == "media" }
        ?: AdhanSettings.DEFAULT.stream,
      playDuringDnd = prefs.getBoolean(PLAY_DURING_DND, AdhanSettings.DEFAULT.playDuringDnd),
      fullScreen = prefs.getBoolean(FULL_SCREEN, AdhanSettings.DEFAULT.fullScreen),
    )

  fun saveSettings(settings: AdhanSettings) {
    prefs.edit()
      .putString(STREAM, settings.stream)
      .putBoolean(PLAY_DURING_DND, settings.playDuringDnd)
      .putBoolean(FULL_SCREEN, settings.fullScreen)
      .apply()
  }

  fun alarms(): List<AdhanAlarm> {
    val json = prefs.getString(ALARMS, null) ?: return emptyList()
    return try {
      val array = JSONArray(json)
      (0 until array.length()).map { toAlarm(array.getJSONObject(it)) }
    } catch (_: Exception) {
      emptyList()
    }
  }

  fun saveAlarms(alarms: List<AdhanAlarm>) {
    val array = JSONArray()
    alarms.forEach { array.put(toJson(it)) }
    prefs.edit().putString(ALARMS, array.toString()).apply()
  }

  private fun toJson(alarm: AdhanAlarm) =
    JSONObject()
      .put("id", alarm.id)
      .put("fireAt", alarm.fireAt)
      .put("title", alarm.title)
      .put("body", alarm.body)
      .put("file", alarm.file)
      .put("stopLabel", alarm.stopLabel)
      .put("channelName", alarm.channelName)

  private fun toAlarm(json: JSONObject) =
    AdhanAlarm(
      id = json.getString("id"),
      fireAt = json.getLong("fireAt"),
      title = json.getString("title"),
      body = json.getString("body"),
      file = json.getString("file"),
      stopLabel = json.getString("stopLabel"),
      channelName = json.getString("channelName"),
    )

  private companion object {
    const val NAME = "android_alerts_adhan"
    const val ALARMS = "alarms"
    const val STREAM = "stream"
    const val PLAY_DURING_DND = "playDuringDnd"
    const val FULL_SCREEN = "fullScreen"
  }
}
