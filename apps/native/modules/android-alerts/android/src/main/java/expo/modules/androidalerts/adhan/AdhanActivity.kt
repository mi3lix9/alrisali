package expo.modules.androidalerts.adhan

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The opt-in full-screen adhan: shows over the lock screen with the Prayer
 * Time's title and a Stop button, and closes when the adhan ends.
 */
class AdhanActivity : Activity() {
  private val stopped = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      finish()
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val padding = (24 * resources.displayMetrics.density).toInt()
    val column = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(padding, padding, padding, padding)
      setBackgroundColor(Color.BLACK)
    }
    column.addView(
      TextView(this).apply {
        text = intent.getStringExtra(EXTRA_TITLE)
        textSize = 28f
        gravity = Gravity.CENTER
        setTextColor(Color.WHITE)
      }
    )
    column.addView(
      TextView(this).apply {
        text = intent.getStringExtra(EXTRA_BODY)
        textSize = 16f
        gravity = Gravity.CENTER
        setTextColor(Color.LTGRAY)
        setPadding(0, padding / 2, 0, padding)
      }
    )
    column.addView(
      Button(this).apply {
        text = intent.getStringExtra(EXTRA_STOP_LABEL)
        setOnClickListener {
          startService(AdhanService.stopIntent(this@AdhanActivity))
          finish()
        }
      },
      ViewGroup.LayoutParams.WRAP_CONTENT,
      ViewGroup.LayoutParams.WRAP_CONTENT,
    )
    setContentView(column)
    val filter = IntentFilter(AdhanService.ACTION_STOPPED)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(stopped, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag") registerReceiver(stopped, filter)
    }
  }

  override fun onDestroy() {
    unregisterReceiver(stopped)
    super.onDestroy()
  }

  companion object {
    private const val EXTRA_TITLE = "title"
    private const val EXTRA_BODY = "body"
    private const val EXTRA_STOP_LABEL = "stopLabel"

    fun pendingIntent(context: Context, alarm: AdhanAlarm): PendingIntent =
      PendingIntent.getActivity(
        context,
        3,
        Intent(context, AdhanActivity::class.java)
          .putExtra(EXTRA_TITLE, alarm.title)
          .putExtra(EXTRA_BODY, alarm.body)
          .putExtra(EXTRA_STOP_LABEL, alarm.stopLabel)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
  }
}
