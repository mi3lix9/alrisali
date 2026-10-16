package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** The armed moment is due: draws the widgets again, then arms the next moment. */
class WidgetRefreshReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_FIRE) return
    WidgetRefreshScheduler.reloadWidgets(context)
    WidgetRefreshScheduler.arm(context)
  }

  companion object {
    const val ACTION_FIRE = "expo.modules.widgetrefresh.FIRE"
  }
}

/** Alarms do not survive a reboot, a clock change or an app update: arms them again. */
class WidgetRefreshRearmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_MY_PACKAGE_REPLACED -> {
        WidgetRefreshScheduler.reloadWidgets(context)
        WidgetRefreshScheduler.arm(context)
      }
    }
  }
}
