import SwiftUI

/// The Move / Exercise / Stand ring trio, matching the phone app's colors.
struct RingsView: View {
    let move: Double
    let exercise: Double
    let stand: Double

    var body: some View {
        ZStack {
            Ring(fraction: move, color: Color(red: 0.98, green: 0.07, blue: 0.31))
            Ring(fraction: exercise, color: Color(red: 0.57, green: 0.91, blue: 0.16))
                .padding(14)
            Ring(fraction: stand, color: Color(red: 0.0, green: 0.83, blue: 0.98))
                .padding(28)
        }
    }
}

private struct Ring: View {
    let fraction: Double
    let color: Color

    var body: some View {
        ZStack {
            Circle().stroke(color.opacity(0.25), lineWidth: 10)
            Circle()
                .trim(from: 0, to: min(fraction, 0.999))
                .stroke(color, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}
