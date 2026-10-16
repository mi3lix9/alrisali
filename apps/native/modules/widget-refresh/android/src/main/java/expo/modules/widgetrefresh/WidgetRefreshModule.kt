package expo.modules.widgetrefresh

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Android-only: re-renders the home-screen widgets at the given moments, with
 * the app closed (see [WidgetRefreshScheduler]).
 */
class WidgetRefreshModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("WidgetRefresh")

    // Replaces every armed refresh with these moments, in epoch milliseconds.
    Function("scheduleRefreshes") { times: List<Double> ->
      WidgetRefreshScheduler.replace(context, times.map { it.toLong() })
    }
  }
}
