package expo.modules.androidalerts.adhan

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Arms the soonest alarm as an alarm clock (exact, and allowed to start the
 * foreground service). Only one is armed at a time: when it fires, the next
 * is armed. [arm] is also what boot, time change and app update call.
 */
object AdhanScheduler {
  private const val TAG = "AdhanScheduler"
  private const val REQUEST_CODE = 3001

  fun replace(context: Context, alarms: List<AdhanAlarm>) {
    AdhanStore(context).saveAlarms(alarms.sortedBy { it.fireAt })
    arm(context)
  }

  fun arm(context: Context) {
    val store = AdhanStore(context)
    val now = System.currentTimeMillis()
    // Alarms missed by more than the stale window are not played late.
    val pending = store.alarms().filter { now - it.fireAt <= STALE_ALARM_MS }.sortedBy { it.fireAt }
    if (pending.size != store.alarms().size) {
      store.saveAlarms(pending)
    }
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val operation = fireIntent(context)
    val next = pending.firstOrNull()
    if (next == null) {
      manager.cancel(operation)
      return
    }
    val show = PendingIntent.getActivity(
      context,
      REQUEST_CODE,
      context.packageManager.getLaunchIntentForPackage(context.packageName),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    try {
      manager.setAlarmClock(AlarmManager.AlarmClockInfo(next.fireAt, show), operation)
    } catch (error: SecurityException) {
      Log.e(TAG, "The adhan alarm could not be armed", error)
    }
  }

  fun cancelAll(context: Context) {
    AdhanStore(context).saveAlarms(emptyList())
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(fireIntent(context))
  }

  private fun fireIntent(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      Intent(context, AdhanAlarmReceiver::class.java).setAction(AdhanAlarmReceiver.ACTION_FIRE),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}
