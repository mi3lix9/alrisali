package expo.modules.androidalerts.adhan

/** What the service does for one alarm. Mirrors `adhanPlayback` in the domain package. */
sealed interface AdhanPlayback {
  /** Notification only: Do Not Disturb is on and the Believer did not allow the adhan through it. */
  data object Skip : AdhanPlayback

  data class Play(val alarmStream: Boolean) : AdhanPlayback
}

fun adhanPlayback(settings: AdhanSettings, doNotDisturbOn: Boolean): AdhanPlayback =
  when {
    !doNotDisturbOn -> AdhanPlayback.Play(alarmStream = settings.stream == "alarm")
    settings.playDuringDnd -> AdhanPlayback.Play(alarmStream = true)
    else -> AdhanPlayback.Skip
  }
