package expo.modules.androidalerts.adhan

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

/**
 * Plays one full adhan as a media foreground service: faded in, on the stream
 * the Believer chose, with a Stop action. It gives way to other audio and
 * stops when it loses audio focus, which an incoming call does.
 */
class AdhanService : Service() {
  private var player: MediaPlayer? = null
  private var focusRequest: AudioFocusRequest? = null
  private val handler = Handler(Looper.getMainLooper())
  private var fadeStartedAt = 0L
  private var ducked = false

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> finish()
      else -> {
        val alarm = intent?.let(::readAlarm)
        if (alarm == null) {
          // Started without an alarm: still owed a foreground notification.
          startForeground(NOTIFICATION_ID, minimalNotification())
          finish()
        } else {
          start(alarm)
        }
      }
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    release()
    super.onDestroy()
  }

  private fun start(alarm: AdhanAlarm) {
    release()
    val settings = AdhanStore(this).settings()
    val manager = getSystemService(NotificationManager::class.java)
    val playback = adhanPlayback(settings, doNotDisturbOn(manager))
    ensureChannel(manager, alarm.channelName)
    if (playback !is AdhanPlayback.Play) {
      // The foreground notification is owed; leave an ordinary one behind.
      startForeground(NOTIFICATION_ID, notification(alarm, ongoing = true, settings, manager))
      stopForegroundAndRemove()
      manager.notify(NOTIFICATION_ID + 1, notification(alarm, ongoing = false, settings, manager))
      stopSelf()
      return
    }
    foreground(notification(alarm, ongoing = true, settings, manager))
    play(alarm, playback.alarmStream)
  }

  private fun play(alarm: AdhanAlarm, alarmStream: Boolean) {
    val attributes = AudioAttributes.Builder()
      .setUsage(if (alarmStream) AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
      .build()
    val audio = getSystemService(AudioManager::class.java)
    val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
      .setAudioAttributes(attributes)
      .setOnAudioFocusChangeListener(::onFocusChange)
      .build()
    // Denied while a call is ringing or active: stay silent.
    if (audio.requestAudioFocus(request) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      finish()
      return
    }
    focusRequest = request
    try {
      val media = MediaPlayer()
      player = media
      media.setAudioAttributes(attributes)
      media.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK)
      setSource(media, alarm.file)
      media.isLooping = false
      media.setOnCompletionListener { finish() }
      media.setOnErrorListener { _, what, extra ->
        Log.e(TAG, "Adhan playback failed: $what/$extra")
        finish()
        true
      }
      media.setVolume(0f, 0f)
      media.prepare()
      media.start()
      fadeStartedAt = System.currentTimeMillis()
      handler.post(fade)
    } catch (error: Exception) {
      Log.e(TAG, "The adhan could not play", error)
      finish()
    }
  }

  private fun setSource(media: MediaPlayer, file: String) {
    if (file.startsWith("/") || file.startsWith("file://")) {
      media.setDataSource(file.removePrefix("file://"))
      return
    }
    val id = resources.getIdentifier(file.substringBeforeLast('.'), "raw", packageName)
    require(id != 0) { "No raw resource named $file" }
    resources.openRawResourceFd(id).use { media.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
  }

  private val fade = object : Runnable {
    override fun run() {
      val media = player ?: return
      val progress = ((System.currentTimeMillis() - fadeStartedAt).toFloat() / FADE_IN_MS).coerceIn(0f, 1f)
      applyVolume(media, progress)
      if (progress < 1f) handler.postDelayed(this, FADE_STEP_MS)
    }
  }

  private fun applyVolume(media: MediaPlayer, level: Float) {
    val volume = if (ducked) level * DUCKED_VOLUME else level
    media.setVolume(volume, volume)
  }

  private fun onFocusChange(change: Int) {
    when (change) {
      // Another app took audio for good, or briefly: a call does the latter.
      // A paused adhan would resume at the wrong time, so it ends.
      AudioManager.AUDIOFOCUS_LOSS, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> finish()
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        ducked = true
        player?.let { applyVolume(it, 1f) }
      }
      AudioManager.AUDIOFOCUS_GAIN -> {
        ducked = false
        player?.let { applyVolume(it, 1f) }
      }
    }
  }

  private fun finish() {
    release()
    stopForegroundAndRemove()
    sendBroadcast(Intent(ACTION_STOPPED).setPackage(packageName))
    stopSelf()
  }

  private fun release() {
    handler.removeCallbacks(fade)
    player?.let {
      try {
        it.stop()
      } catch (_: IllegalStateException) {
      }
      it.release()
    }
    player = null
    focusRequest?.let { getSystemService(AudioManager::class.java).abandonAudioFocusRequest(it) }
    focusRequest = null
    ducked = false
  }

  private fun stopForegroundAndRemove() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION") stopForeground(true)
    }
  }

  private fun foreground(notification: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun doNotDisturbOn(manager: NotificationManager): Boolean =
    when (manager.currentInterruptionFilter) {
      NotificationManager.INTERRUPTION_FILTER_ALL, NotificationManager.INTERRUPTION_FILTER_UNKNOWN -> false
      else -> true
    }

  private fun ensureChannel(manager: NotificationManager, name: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    // The service plays the sound itself, so the channel has none. High
    // importance lets the full-screen intent through.
    val channel = NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_HIGH)
    channel.setSound(null, null)
    channel.enableVibration(false)
    manager.createNotificationChannel(channel)
  }

  @Suppress("DEPRECATION")
  private fun notification(
    alarm: AdhanAlarm,
    ongoing: Boolean,
    settings: AdhanSettings,
    manager: NotificationManager,
  ): Notification {
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      Notification.Builder(this)
    }
    val open = PendingIntent.getActivity(
      this,
      1,
      packageManager.getLaunchIntentForPackage(packageName),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    builder
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle(alarm.title)
      .setContentText(alarm.body)
      .setCategory(Notification.CATEGORY_ALARM)
      .setContentIntent(open)
      .setOngoing(ongoing)
      .setAutoCancel(!ongoing)
    if (ongoing) {
      val stop = PendingIntent.getService(
        this,
        2,
        Intent(this, AdhanService::class.java).setAction(ACTION_STOP),
        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )
      builder.addAction(Notification.Action.Builder(0, alarm.stopLabel, stop).build())
      if (settings.fullScreen && canUseFullScreenIntent(manager)) {
        builder.setFullScreenIntent(AdhanActivity.pendingIntent(this, alarm), true)
      }
    }
    return builder.build()
  }

  private fun minimalNotification(): Notification {
    val name = "Adhan"
    ensureChannel(getSystemService(NotificationManager::class.java), name)
    @Suppress("DEPRECATION")
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      Notification.Builder(this)
    }
    return builder.setSmallIcon(applicationInfo.icon).setContentTitle(name).build()
  }

  private fun readAlarm(intent: Intent): AdhanAlarm? {
    val id = intent.getStringExtra(EXTRA_ID) ?: return null
    return AdhanAlarm(
      id = id,
      fireAt = intent.getLongExtra(EXTRA_FIRE_AT, 0L),
      title = intent.getStringExtra(EXTRA_TITLE) ?: return null,
      body = intent.getStringExtra(EXTRA_BODY) ?: return null,
      file = intent.getStringExtra(EXTRA_FILE) ?: return null,
      stopLabel = intent.getStringExtra(EXTRA_STOP_LABEL) ?: return null,
      channelName = intent.getStringExtra(EXTRA_CHANNEL_NAME) ?: return null,
    )
  }

  companion object {
    private const val TAG = "AdhanService"
    const val CHANNEL_ID = "adhan-service"
    private const val NOTIFICATION_ID = 7301
    private const val FADE_IN_MS = 8000L
    private const val FADE_STEP_MS = 100L
    private const val DUCKED_VOLUME = 0.2f

    const val ACTION_STOP = "expo.modules.androidalerts.adhan.STOP"
    /** Broadcast inside the app when the adhan ends or is stopped. */
    const val ACTION_STOPPED = "expo.modules.androidalerts.adhan.STOPPED"

    private const val EXTRA_ID = "id"
    private const val EXTRA_FIRE_AT = "fireAt"
    private const val EXTRA_TITLE = "title"
    private const val EXTRA_BODY = "body"
    private const val EXTRA_FILE = "file"
    private const val EXTRA_STOP_LABEL = "stopLabel"
    private const val EXTRA_CHANNEL_NAME = "channelName"

    fun playIntent(context: Context, alarm: AdhanAlarm): Intent =
      Intent(context, AdhanService::class.java)
        .putExtra(EXTRA_ID, alarm.id)
        .putExtra(EXTRA_FIRE_AT, alarm.fireAt)
        .putExtra(EXTRA_TITLE, alarm.title)
        .putExtra(EXTRA_BODY, alarm.body)
        .putExtra(EXTRA_FILE, alarm.file)
        .putExtra(EXTRA_STOP_LABEL, alarm.stopLabel)
        .putExtra(EXTRA_CHANNEL_NAME, alarm.channelName)

    fun stopIntent(context: Context): Intent =
      Intent(context, AdhanService::class.java).setAction(ACTION_STOP)

    /** Android 14 turned the full-screen intent into a permission the Believer may revoke. */
    fun canUseFullScreenIntent(manager: NotificationManager): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE || manager.canUseFullScreenIntent()
  }
}
