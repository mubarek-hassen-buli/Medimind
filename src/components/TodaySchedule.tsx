import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

export function TodaySchedule() {
  const schedule = useQuery(api.adherence.getTodaySchedule) || [];
  const logDose = useMutation(api.adherence.logDose);
  const [loadingDose, setLoadingDose] = useState<string | null>(null);

  const handleDoseAction = async (
    medicationId: Id<"medications">,
    scheduledDateTime: number,
    status: "taken" | "skipped" | "snoozed"
  ) => {
    setLoadingDose(`${medicationId}-${status}`);
    try {
      await logDose({
        medicationId,
        scheduledDateTime,
        status,
      });
      
      const statusMessages = {
        taken: "Dose marked as taken ✅",
        skipped: "Dose marked as skipped",
        snoozed: "Dose snoozed for 30 minutes ⏰",
      };
      
      toast.success(statusMessages[status]);
    } catch (error) {
      toast.error("Failed to update dose status");
    } finally {
      setLoadingDose(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "taken":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "skipped":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      case "snoozed":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (schedule.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Today's Schedule</h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">No medications scheduled for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Today's Schedule</h2>
      
      <div className="space-y-4">
        {schedule.map((item) => (
          <div
            key={`${item.medicationId}-${item.scheduledDateTime}`}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.medicationName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.dosage}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{formatTime(item.scheduledTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
              
              {item.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDoseAction(item.medicationId, item.scheduledDateTime, "taken")}
                    disabled={loadingDose === `${item.medicationId}-taken`}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md transition-colors disabled:opacity-50"
                  >
                    {loadingDose === `${item.medicationId}-taken` ? "..." : "✓"}
                  </button>
                  
                  <button
                    onClick={() => handleDoseAction(item.medicationId, item.scheduledDateTime, "skipped")}
                    disabled={loadingDose === `${item.medicationId}-skipped`}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors disabled:opacity-50"
                  >
                    {loadingDose === `${item.medicationId}-skipped` ? "..." : "✗"}
                  </button>
                  
                  <button
                    onClick={() => handleDoseAction(item.medicationId, item.scheduledDateTime, "snoozed")}
                    disabled={loadingDose === `${item.medicationId}-snoozed`}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-md transition-colors disabled:opacity-50"
                  >
                    {loadingDose === `${item.medicationId}-snoozed` ? "..." : "⏰"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
