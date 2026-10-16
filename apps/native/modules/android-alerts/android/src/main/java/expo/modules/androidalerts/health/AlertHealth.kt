package expo.modules.androidalerts.health

import android.app.AlarmManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

/** A phone maker's own autostart / background-launch settings screen. */
private data class AutostartScreen(val manufacturers: List<String>, val components: List<ComponentName>)

/**
 * The Alert Health checks that need Android APIs the JS layer lacks. Notification
 * permission and exact alarms are also readable through expo-notifications;
 * `canScheduleExactAlarms` is here so the screen can read all checks from one place.
 */
object AlertHealth {
  // Component names the makers ship; none is a public API, so each is tried in
  // turn and the app details screen is the fallback.
  private val screens = listOf(
    AutostartScreen(
      listOf("xiaomi", "redmi", "poco"),
      listOf(ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")),
    ),
    AutostartScreen(
      listOf("huawei", "honor"),
      listOf(
        ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
        ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"),
      ),
    ),
    AutostartScreen(
      listOf("oppo", "realme", "oneplus"),
      listOf(
        ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
        ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"),
        ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"),
      ),
    ),
    AutostartScreen(
      listOf("vivo", "iqoo"),
      listOf(
        ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
        ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"),
      ),
    ),
    AutostartScreen(
      listOf("samsung"),
      listOf(ComponentName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity")),
    ),
    AutostartScreen(
      listOf("asus"),
      listOf(ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.autostart.AutoStartActivity")),
    ),
    AutostartScreen(
      listOf("letv"),
      listOf(ComponentName("com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity")),
    ),
  )

  private fun screenFor(manufacturer: String) =
    screens.firstOrNull { screen -> screen.manufacturers.any { manufacturer.lowercase().contains(it) } }

  fun manufacturer(): String = Build.MANUFACTURER.lowercase()

  /** Whether this phone maker has an autostart screen we know how to open. */
  fun hasAutostartScreen(): Boolean = screenFor(Build.MANUFACTURER) != null

  /** Always true before Android 12 (no permission), otherwise the real answer. */
  fun canScheduleExactAlarms(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()

  fun isIgnoringBatteryOptimizations(context: Context): Boolean =
    context.getSystemService(PowerManager::class.java).isIgnoringBatteryOptimizations(context.packageName)

  fun openExactAlarmSettings(context: Context) {
    val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
    } else {
      appDetails(context)
    }
    open(context, listOf(intent), appDetails(context))
  }

  /** The battery optimisation list (the per-app prompt needs a Play-restricted permission). */
  fun openBatteryOptimizationSettings(context: Context) {
    open(
      context,
      listOf(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)),
      appDetails(context),
    )
  }

  /** The maker's autostart screen, else the app's own details. */
  fun openAutostartSettings(context: Context) {
    val candidates = screenFor(Build.MANUFACTURER)?.components.orEmpty()
      .map { Intent().setComponent(it) }
    open(context, candidates, appDetails(context))
  }

  private fun prefs(context: Context) =
    context.getSharedPreferences("alert-health", Context.MODE_PRIVATE)

  /** Whether the Believer said they allowed autostart (Android cannot tell). */
  fun isAutostartConfirmed(context: Context): Boolean =
    prefs(context).getBoolean("autostartConfirmed", false)

  fun setAutostartConfirmed(context: Context, confirmed: Boolean) {
    prefs(context).edit().putBoolean("autostartConfirmed", confirmed).apply()
  }

  private fun appDetails(context: Context) =
    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))

  /** Starts the first intent the phone accepts, then the fallback. */
  private fun open(context: Context, candidates: List<Intent>, fallback: Intent) {
    for (intent in candidates + fallback) {
      try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return
      } catch (_: Exception) {
        // not installed, not exported, or the maker removed it: try the next
      }
    }
  }
}
