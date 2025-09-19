import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AddMedicationModal } from "./AddMedicationModal";
import { useState } from "react";

export function MedicationList() {
  const medications = useQuery(api.medications.list) || [];
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Medications</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Medication
        </button>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No medications yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add your first medication to start tracking your health journey
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Add Your First Medication
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {medications.map((medication) => (
            <MedicationCard key={medication._id} medication={medication} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMedicationModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function MedicationCard({ medication }: { medication: any }) {
  const adherenceStats = useQuery(api.medications.getAdherenceStats, {
    medicationId: medication._id,
  });

  const getQuantityStatus = () => {
    const percentage = (medication.currentQuantity / medication.initialQuantity) * 100;
    if (percentage <= 20) return { color: "text-red-600 dark:text-red-400", status: "Low" };
    if (percentage <= 50) return { color: "text-yellow-600 dark:text-yellow-400", status: "Medium" };
    return { color: "text-green-600 dark:text-green-400", status: "Good" };
  };

  const quantityStatus = getQuantityStatus();

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{medication.name}</h3>
          <p className="text-gray-600 dark:text-gray-400">{medication.dosage} • {medication.form}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">{medication.frequency}</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
          <p className={`font-semibold ${quantityStatus.color}`}>
            {medication.currentQuantity} / {medication.initialQuantity}
          </p>
        </div>
      </div>

      {adherenceStats && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">7-day adherence</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {adherenceStats.adherencePercentage}%
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Doses taken</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {adherenceStats.takenDoses} / {adherenceStats.totalDoses}
              </p>
            </div>
          </div>

          {medication.fdaData && (
            <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
              View Insights
            </button>
          )}
        </div>
      )}

      {medication.currentQuantity <= 7 && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Refill needed - Only {medication.currentQuantity} doses remaining
            </p>
          </div>
          <button className="mt-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-md transition-colors">
            Request Refill
          </button>
        </div>
      )}
    </div>
  );
}
