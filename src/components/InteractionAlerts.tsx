import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function InteractionAlerts() {
  const interactions = useQuery(api.interactions.list) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200";
      case "serious":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200";
      case "moderate":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🚨";
      case "serious":
        return "⚠️";
      case "moderate":
        return "⚡";
      default:
        return "ℹ️";
    }
  };

  if (interactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Drug Interactions</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Interactions Detected</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your current medications appear to be safe to take together
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Drug Interactions</h2>
      
      <div className="space-y-4">
        {interactions.map((interaction) => (
          <div
            key={interaction._id}
            className={`p-4 rounded-lg border ${getSeverityColor(interaction.severity)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getSeverityIcon(interaction.severity)}</span>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold capitalize">{interaction.severity}</span>
                  <span className="text-sm opacity-75">•</span>
                  <span className="text-sm">{interaction.source}</span>
                </div>
                
                <h3 className="font-medium mb-2">
                  {interaction.medication1Name} + {interaction.medication2Name}
                </h3>
                
                <p className="text-sm opacity-90">
                  {interaction.description}
                </p>
                
                {interaction.severity === "critical" && (
                  <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200">
                      ⚠️ Consult your healthcare provider immediately
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
