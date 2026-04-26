'use client';
import { useStore } from '@/store/useStore';

export default function PartnersPage() {
  const { userRole, activeUserId, partners, subscriptions, subscribeToPartner, unsubscribeFromPartner } = useStore();

  const targetRole = userRole === 'Retailer' ? 'Distributor' : userRole === 'Distributor' ? 'Manufacturer' : null;

  const availablePartners = partners.filter(p => p.role === targetRole);
  
  const isSubscribed = (targetId: string) => {
    return subscriptions.some(s => s.subscriberId === activeUserId && s.targetId === targetId);
  };

  const mySubscribers = userRole === 'Manufacturer' 
    ? subscriptions
        .filter(s => s.targetId === activeUserId)
        .map(s => partners.find(p => p.id === s.subscriberId))
        .filter(Boolean) as typeof partners
    : [];

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-sans font-bold text-dark">{userRole === 'Manufacturer' ? 'Subscribers' : 'Partner Discovery'}</h1>
        <div className="font-sans text-sm text-gray-500 mt-1">
          {userRole === 'Manufacturer' ? 'Distributors subscribed to your inventory' : 'Connect with supply chain partners'}
        </div>
      </div>
      
      {userRole === 'Manufacturer' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySubscribers.map(sub => (
              <div key={sub.id} className="card-soft flex flex-col gap-4">
                <div>
                  <h3 className="font-sans font-bold text-lg text-dark">{sub.name}</h3>
                  <div className="text-sm font-sans text-gray-400 mt-1">{sub.role} &middot; ID: {sub.id}</div>
                </div>
                <div className="badge-soft bg-blue-50 text-blue-600 border border-blue-100 mt-auto self-start">
                  SUBSCRIBED TO YOU
                </div>
              </div>
            ))}
          </div>
          {mySubscribers.length === 0 && (
            <div className="text-center font-sans text-gray-500 py-12 card-soft">
              No distributors are currently subscribed to you.
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-sans font-bold text-dark mb-2">Available {targetRole}s</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePartners.map(partner => (
              <div key={partner.id} className="card-soft flex flex-col gap-4">
                <div>
                  <h3 className="font-sans font-bold text-lg text-dark">{partner.name}</h3>
                  <div className="text-sm font-sans text-gray-400 mt-1">{partner.role} &middot; ID: {partner.id}</div>
                </div>
                
                {isSubscribed(partner.id) ? (
                  <button 
                    onClick={() => unsubscribeFromPartner(partner.id)}
                    className="btn-pill bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 mt-auto"
                  >
                    Unsubscribe
                  </button>
                ) : (
                  <button 
                    onClick={() => subscribeToPartner(partner.id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-sans font-bold text-sm px-6 py-2 rounded-full transition-colors mt-auto"
                  >
                    Subscribe
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {availablePartners.length === 0 && (
            <div className="text-center font-sans text-gray-500 py-8">
              No partners available to connect with at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
