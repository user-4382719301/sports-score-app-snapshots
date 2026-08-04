// StepCircle watchOS companion (reference implementation).
// Add via Xcode: File > New > Target > watchOS App, then include these files.
// Requires the HealthKit capability on the watch target.

import SwiftUI
import HealthKit

@main
struct StepCircleWatchApp: App {
    var body: some Scene {
        WindowGroup {
            TodayView()
        }
    }
}

struct TodayView: View {
    @StateObject private var model = TodayModel()

    var body: some View {
        VStack(spacing: 8) {
            RingsView(move: model.moveFraction,
                      exercise: model.exerciseFraction,
                      stand: model.standFraction)
                .frame(width: 110, height: 110)
            Text("\(model.steps)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
            Text("steps")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .task { await model.start() }
    }
}

@MainActor
final class TodayModel: ObservableObject {
    @Published var steps = 0
    @Published var exerciseMinutes = 0.0
    @Published var standHours = 0.0

    let stepGoal = 10_000.0
    let exerciseGoal = 30.0
    let standGoal = 12.0

    var moveFraction: Double { Double(steps) / stepGoal }
    var exerciseFraction: Double { exerciseMinutes / exerciseGoal }
    var standFraction: Double { standHours / standGoal }

    private let store = HKHealthStore()

    func start() async {
        let types: Set<HKQuantityType> = [
            HKQuantityType(.stepCount),
            HKQuantityType(.appleExerciseTime),
        ]
        try? await store.requestAuthorization(toShare: [], read: types)
        await refresh()

        // Refresh whenever HealthKit receives new step samples (e.g. from the
        // paired phone or workouts recorded on the watch).
        let query = HKObserverQuery(sampleType: HKQuantityType(.stepCount), predicate: nil) {
            [weak self] _, completion, _ in
            Task { await self?.refresh() }
            completion()
        }
        store.execute(query)
    }

    func refresh() async {
        let start = Calendar.current.startOfDay(for: .now)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: .now)

        steps = Int(await sum(.stepCount, unit: .count(), predicate: predicate))
        exerciseMinutes = await sum(.appleExerciseTime, unit: .minute(), predicate: predicate)
        standHours = await activeHourCount(dayStart: start)
    }

    /// Hours today with at least 250 steps — StepCircle's Stand-ring analog.
    private func activeHourCount(dayStart: Date) async -> Double {
        var active = 0.0
        var hourStart = dayStart
        while hourStart < .now {
            let hourEnd = min(hourStart.addingTimeInterval(3600), .now)
            let predicate = HKQuery.predicateForSamples(withStart: hourStart, end: hourEnd)
            if await sum(.stepCount, unit: .count(), predicate: predicate) >= 250 { active += 1 }
            hourStart = hourEnd
        }
        return active
    }

    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, predicate: NSPredicate) async -> Double {
        await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(quantityType: HKQuantityType(id),
                                          quantitySamplePredicate: predicate,
                                          options: .cumulativeSum) { _, stats, _ in
                continuation.resume(returning: stats?.sumQuantity()?.doubleValue(for: unit) ?? 0)
            }
            store.execute(query)
        }
    }
}
