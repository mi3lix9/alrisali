package expo.modules.androidalerts.adhan

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/** The armed alarm is due: starts the adhan service, then arms the next alarm. */
class AdhanAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_FIRE) return
    val store = AdhanStore(context)
    val now = System.currentTimeMillis()
    val (due, later) = store.alarms().partition { it.fireAt <= now + TOLERANCE_MS }
    store.saveAlarms(later)
    // If several are due (the device slept), only the latest is worth playing.
    val alarm = due.filter { now - it.fireAt <= STALE_ALARM_MS }.maxByOrNull { it.fireAt }
    if (alarm != null) {
      try {
        val start = AdhanService.playIntent(context, alarm)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(start)
        } else {
          context.startService(start)
        }
      } catch (error: Exception) {
        Log.e("AdhanAlarmReceiver", "The adhan service could not start", error)
      }
    }
    AdhanScheduler.arm(context)
  }

  companion object {
    const val ACTION_FIRE = "expo.modules.androidalerts.adhan.FIRE"
    private const val TOLERANCE_MS = 1000L
  }
}

/** Alarms do not survive a reboot, a clock change or an app update: arms them again. */
class AdhanRearmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_MY_PACKAGE_REPLACED -> AdhanScheduler.arm(context)
    }
  }
}
