'use client';
import { useStore } from '@/store/useStore';

export default function AlertsPage() {
  const { alerts, markAlertRead, activeUserId } = useStore();
  const myAlerts = alerts.filter(a => !a.recipientIds || a.recipientIds.includes(activeUserId));

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-sans font-bold text-dark">Activity Feed</h1>
        <div className="font-sans text-sm text-gray-500 mt-1">System alerts & triggers</div>
      </div>
      
      <div className="flex flex-col gap-4">
        {myAlerts.length === 0 && (
          <div className="card-soft font-sans text-center py-12 text-gray-500">
            No alerts recorded.
          </div>
        )}
        
        {myAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`card-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${!alert.read ? 'border-signal-red/20 bg-red-50/30' : ''}`}
          >
            <div>
              <div className="font-mono text-xs mb-2 text-gray-400">
                {new Date(alert.timestamp).toLocaleString()}
              </div>
              <div className={`font-sans text-lg font-medium ${!alert.read ? 'text-signal-red font-bold' : 'text-dark'}`}>
                {alert.message}
              </div>
            </div>
            {!alert.read && (
              <button 
                onClick={() => markAlertRead(alert.id)}
                className="btn-pill bg-white border border-gray-200 text-dark hover:bg-gray-50 text-sm py-2"
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
