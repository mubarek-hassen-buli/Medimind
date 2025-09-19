import { useState } from "react";
import { AddMedicationModal } from "./AddMedicationModal";

export function QuickActions() {
  const [showAddModal, setShowAddModal] = useState(false);

  const actions = [
    {
      id: "add-medication",
      title: "Add Medication",
      description: "Scan or manually add a new medication",
      icon: "💊",
      color: "bg-blue-500 hover:bg-blue-600",
      action: () => setShowAddModal(true),
    },
    {
      id: "log-symptom",
      title: "Log Symptom",
      description: "Track how you're feeling today",
      icon: "📝",
      color: "bg-green-500 hover:bg-green-600",
      action: () => console.log("Log symptom"),
    },
    {
      id: "add-vitals",
      title: "Add Vitals",
      description: "Record blood pressure, weight, etc.",
      icon: "❤️",
      color: "bg-red-500 hover:bg-red-600",
      action: () => console.log("Add vitals"),
    },
    {
      id: "export-report",
      title: "Export Report",
      description: "Generate PDF health report",
      icon: "📊",
      color: "bg-purple-500 hover:bg-purple-600",
      action: () => console.log("Export report"),
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`p-4 ${action.color} text-white rounded-lg transition-colors text-left`}
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
              <p className="text-xs opacity-90">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddMedicationModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
