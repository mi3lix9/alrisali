package expo.modules.androidalerts

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.androidalerts.adhan.AdhanAlarm
import expo.modules.androidalerts.adhan.AdhanScheduler
import expo.modules.androidalerts.adhan.AdhanService
import expo.modules.androidalerts.adhan.AdhanSettings
import expo.modules.androidalerts.adhan.AdhanStore
import expo.modules.androidalerts.health.AlertHealth
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AdhanAlarmRecord : Record {
  @Field val id: String = ""
  @Field val fireAt: Double = 0.0
  @Field val title: String = ""
  @Field val body: String = ""
  @Field val file: String = ""
  @Field val stopLabel: String = ""
  @Field val channelName: String = ""
}

class AdhanSettingsRecord : Record {
  @Field val stream: String = "alarm"
  @Field val playDuringDnd: Boolean = false
  @Field val fullScreen: Boolean = false
}

/**
 * Android-only alert plumbing the JS notification layer cannot do. Today the
 * adhan service (`adhan/`) and the Alert Health checks (`health/`).
 */
class AndroidAlertsModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AndroidAlerts")

    // Replaces every armed full-adhan alarm with these (an empty list cancels all).
    Function("scheduleAdhanAlarms") { alarms: List<AdhanAlarmRecord> ->
      AdhanScheduler.replace(
        context,
        alarms.map {
          AdhanAlarm(it.id, it.fireAt.toLong(), it.title, it.body, it.file, it.stopLabel, it.channelName)
        },
      )
    }

    Function("cancelAdhanAlarms") { AdhanScheduler.cancelAll(context) }

    // Stops the adhan now if it is playing.
    Function("stopAdhan") {
      context.startService(AdhanService.stopIntent(context))
    }

    Function("getAdhanSettings") {
      val settings = AdhanStore(context).settings()
      mapOf(
        "stream" to settings.stream,
        "playDuringDnd" to settings.playDuringDnd,
        "fullScreen" to settings.fullScreen,
      )
    }

    Function("setAdhanSettings") { settings: AdhanSettingsRecord ->
      AdhanStore(context).saveSettings(
        AdhanSettings(
          stream = if (settings.stream == "media") "media" else "alarm",
          playDuringDnd = settings.playDuringDnd,
          fullScreen = settings.fullScreen,
        )
      )
    }

    // Whether the full-screen adhan may open over the lock screen (a permission from Android 14).
    Function("canUseFullScreenIntent") {
      AdhanService.canUseFullScreenIntent(context.getSystemService(NotificationManager::class.java))
    }

    Function("openFullScreenIntentSettings") {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // Alert Health: each check reads the real state, each fix opens the system screen.
    Function("canScheduleExactAlarms") { AlertHealth.canScheduleExactAlarms(context) }
    Function("openExactAlarmSettings") { AlertHealth.openExactAlarmSettings(context) }
    Function("isIgnoringBatteryOptimizations") { AlertHealth.isIgnoringBatteryOptimizations(context) }
    Function("openBatteryOptimizationSettings") { AlertHealth.openBatteryOptimizationSettings(context) }
    // Android cannot say whether autostart is on, so this only names the maker.
    Function("getAutostartInfo") {
      mapOf("manufacturer" to AlertHealth.manufacturer(), "hasScreen" to AlertHealth.hasAutostartScreen())
    }
    Function("openAutostartSettings") { AlertHealth.openAutostartSettings(context) }
  }
}
