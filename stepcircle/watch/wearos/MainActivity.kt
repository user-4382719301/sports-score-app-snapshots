// StepCircle Wear OS companion (reference implementation).
// Lives in its own Gradle module (com.stepcircle.wear) built alongside the
// phone app. Requires the ACTIVITY_RECOGNITION permission and the
// androidx.health:health-services-client + Compose for Wear OS dependencies.

package com.stepcircle.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.health.services.client.HealthServices
import androidx.health.services.client.PassiveListenerCallback
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.PassiveListenerConfig
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

private val MOVE = Color(0xFFFA114F)
private val EXERCISE = Color(0xFF92E82A)
private val STAND = Color(0xFF00D3F9)

class MainActivity : ComponentActivity() {
    private val steps = mutableStateOf(0L)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { TodayScreen(steps.value) }
        startPassiveStepUpdates()
    }

    /** Health Services delivers battery-friendly daily step totals. */
    private fun startPassiveStepUpdates() {
        val client = HealthServices.getClient(this).passiveMonitoringClient
        val config = PassiveListenerConfig.builder()
            .setDataTypes(setOf(DataType.STEPS_DAILY))
            .build()
        client.setPassiveListenerCallback(config, object : PassiveListenerCallback {
            override fun onNewDataPointsReceived(dataPoints: androidx.health.services.client.data.DataPointContainer) {
                dataPoints.getData(DataType.STEPS_DAILY).lastOrNull()?.let {
                    steps.value = it.value
                }
            }
        })
    }
}

@Composable
fun TodayScreen(steps: Long, stepGoal: Long = 10_000L) {
    MaterialTheme {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Rings(move = steps.toFloat() / stepGoal)
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "%,d".format(steps), style = MaterialTheme.typography.title1)
                Text(text = "steps", style = MaterialTheme.typography.caption2)
            }
        }
    }
}

/** Simplified ring stack; exercise/stand fractions can be wired to Health Connect reads. */
@Composable
fun Rings(move: Float, exercise: Float = 0f, stand: Float = 0f) {
    val rings = listOf(MOVE to move, EXERCISE to exercise, STAND to stand)
    Canvas(modifier = Modifier.size(150.dp)) {
        val stroke = 12.dp.toPx()
        rings.forEachIndexed { index, (color, fraction) ->
            val inset = index * (stroke + 4.dp.toPx())
            val arcSize = Size(size.width - 2 * inset - stroke, size.height - 2 * inset - stroke)
            val topLeft = Offset(inset + stroke / 2, inset + stroke / 2)
            drawArc(
                color = color.copy(alpha = 0.25f),
                startAngle = 0f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round),
            )
            drawArc(
                color = color,
                startAngle = -90f, sweepAngle = 360f * fraction.coerceIn(0f, 0.999f),
                useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round),
            )
        }
    }
}
