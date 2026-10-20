package expo.modules.widgetrefresh

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Re-renders the home-screen widgets at the moments the app listed (every
 * Prayer Time and midnight), so the next-Salah widget switches on time with
 * the app closed. Android has no widget timeline: a widget draws the view in
 * force when it renders, and this makes it render then.
 *
 * Only the soonest moment is armed; when it fires the next is armed. [arm] is
 * also what boot, time change and app update call.
 */
object WidgetRefreshScheduler {
  private const val TAG = "WidgetRefresh"
  private const val REQUEST_CODE = 4401
  private const val PREFERENCES = "widget-refresh"
  private const val KEY_TIMES = "times"

  /** Replaces every armed moment with these epoch milliseconds (empty cancels all). */
  fun replace(context: Context, times: List<Long>) {
    preferences(context).edit().putString(KEY_TIMES, times.sorted().joinToString(",")).apply()
    arm(context)
  }

  fun arm(context: Context) {
    val now = System.currentTimeMillis()
    val pending = times(context).filter { it > now }
    val manager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val operation = fireIntent(context)
    val next = pending.firstOrNull()
    if (next == null) {
      manager.cancel(operation)
      return
    }
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || manager.canScheduleExactAlarms()) {
        manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, operation)
      } else {
        // Without exact-alarm access the system may run it a few minutes late.
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, operation)
      }
    } catch (error: SecurityException) {
      Log.e(TAG, "The widget refresh could not be armed", error)
    }
  }

  /** The widgets draw again now: the system re-runs each provider's update. */
  fun reloadWidgets(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    for (info in manager.getInstalledProvidersForPackage(context.packageName, null)) {
      val ids = manager.getAppWidgetIds(info.provider)
      if (ids.isEmpty()) continue
      context.sendBroadcast(
        Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
          .setComponent(info.provider)
          .putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids),
      )
    }
  }

  private fun times(context: Context): List<Long> =
    preferences(context).getString(KEY_TIMES, "")
      .orEmpty()
      .split(",")
      .mapNotNull { it.toLongOrNull() }
      .sorted()

  private fun preferences(context: Context) =
    context.applicationContext.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)

  private fun fireIntent(context: Context): PendingIntent =
    PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      Intent(context, WidgetRefreshReceiver::class.java).setAction(WidgetRefreshReceiver.ACTION_FIRE),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}
