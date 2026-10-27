package expo.modules.directsms

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Sends SOS texts straight from the SIM (no SMS composer, no tap).
 * Each recipient's result comes from the radio's "sent" callback, so the app
 * can say honestly who was texted.
 */
class DirectSmsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("DirectSms")

    Function("isAvailable") {
      context.packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)
    }

    Function("hasPermission") {
      ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("sendAsync") { numbers: List<String>, message: String, promise: Promise ->
      // Waiting for the radio can take seconds; never block the modules queue.
      Thread {
        try {
          promise.resolve(numbers.map { sendOne(it, message) })
        } catch (e: Exception) {
          promise.reject("ERR_DIRECT_SMS", e.message ?: "Couldn't send SMS", e)
        }
      }.start()
    }
  }

  private fun smsManager(): SmsManager =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      context.getSystemService(SmsManager::class.java)
    } else {
      @Suppress("DEPRECATION")
      SmsManager.getDefault()
    }

  private fun sendOne(number: String, message: String): Map<String, Any> {
    val sms = smsManager()
    val parts = sms.divideMessage(message)
    val action = "expo.modules.directsms.SENT.${UUID.randomUUID()}"
    val pending = CountDownLatch(parts.size)
    val failure = AtomicInteger(Activity.RESULT_OK)

    val receiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        if (resultCode != Activity.RESULT_OK) failure.compareAndSet(Activity.RESULT_OK, resultCode)
        pending.countDown()
      }
    }
    ContextCompat.registerReceiver(context, receiver, IntentFilter(action), ContextCompat.RECEIVER_NOT_EXPORTED)

    try {
      val sentIntents = ArrayList(parts.indices.map { index ->
        PendingIntent.getBroadcast(
          context,
          index,
          Intent(action).setPackage(context.packageName),
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_ONE_SHOT,
        )
      })
      sms.sendMultipartTextMessage(number, null, parts, sentIntents, null)

      // No callback in time usually means the network is slow; the text is queued.
      val confirmed = pending.await(20, TimeUnit.SECONDS)
      val code = failure.get()
      return when {
        code != Activity.RESULT_OK -> mapOf("number" to number, "ok" to false, "error" to describe(code))
        confirmed -> mapOf("number" to number, "ok" to true)
        else -> mapOf("number" to number, "ok" to true, "queued" to true)
      }
    } catch (e: Exception) {
      return mapOf("number" to number, "ok" to false, "error" to (e.message ?: e.javaClass.simpleName))
    } finally {
      try {
        context.unregisterReceiver(receiver)
      } catch (_: IllegalArgumentException) {
      }
    }
  }

  private fun describe(code: Int): String = when (code) {
    SmsManager.RESULT_ERROR_NO_SERVICE -> "No mobile signal"
    SmsManager.RESULT_ERROR_RADIO_OFF -> "Airplane mode is on"
    SmsManager.RESULT_ERROR_NULL_PDU -> "Invalid message"
    else -> "SMS failed (code $code)"
  }
}
