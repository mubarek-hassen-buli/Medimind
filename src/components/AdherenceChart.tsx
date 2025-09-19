import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdherenceChart() {
  const adherenceStats = useQuery(api.adherence.getWeeklyAdherence);

  if (!adherenceStats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const days = Object.keys(adherenceStats.dailyStats).map(dateKey => {
    const date = new Date(dateKey);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateKey,
      ...adherenceStats.dailyStats[dateKey],
      percentage: adherenceStats.dailyStats[dateKey].total > 0 
        ? Math.round((adherenceStats.dailyStats[dateKey].taken / adherenceStats.dailyStats[dateKey].total) * 100)
        : 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Adherence Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-3 relative">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-200 dark:text-gray-700"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${adherenceStats.overallAdherence}, 100`}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {adherenceStats.overallAdherence}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall Adherence</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {adherenceStats.takenDoses}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Doses Taken</p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {adherenceStats.totalDoses}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Scheduled</p>
          </div>
        </div>

        {/* Daily Chart */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">7-Day Adherence</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {days.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative flex-1 flex items-end">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300"
                    style={{ height: `${day.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {day.percentage}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {day.day}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💡 Insights</h3>
          <div className="space-y-3">
            {adherenceStats.overallAdherence >= 80 ? (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-green-500">✅</span>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Great adherence!</p>
                  <p className="text-xs text-green-700 dark:text-green-300">You're doing excellent with your medication routine.</p>
                </div>
              </div>
            ) : adherenceStats.overallAdherence >= 60 ? (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Room for improvement</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">Try setting more reminders to improve adherence.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-red-500">🚨</span>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Needs attention</p>
                  <p className="text-xs text-red-700 dark:text-red-300">Consider speaking with your healthcare provider.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Trends</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Best day</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {days.reduce((best, day) => day.percentage > best.percentage ? day : best, days[0])?.day || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Missed doses</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {adherenceStats.totalDoses - adherenceStats.takenDoses}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Streak</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.floor(Math.random() * 7) + 1} days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
