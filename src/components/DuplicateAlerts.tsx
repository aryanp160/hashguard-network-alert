
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bell, X, User, Calendar } from 'lucide-react';
import { getNetworkAlerts, markAlertAsRead, getUserRole } from '../utils/networkUtils';
import { toast } from 'sonner';

interface DuplicateAlertsProps {
  networkId: string;
  userWallet: string;
  refreshTrigger?: number;
}

const DuplicateAlerts: React.FC<DuplicateAlertsProps> = ({ 
  networkId, 
  userWallet, 
  refreshTrigger 
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const networkAlerts = await getNetworkAlerts(networkId);
        const role = await getUserRole(networkId, userWallet);
        
        setAlerts(networkAlerts);
        setUserRole(role);
      } catch (error) {
        console.error('Error loading alerts:', error);
        setAlerts([]);
      }
    };

    loadAlerts();
  }, [networkId, userWallet, refreshTrigger]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
      toast.success('Alert marked as read');
    } catch (error) {
      toast.error('Failed to mark alert as read');
    }
  };

  const unreadAlerts = alerts.filter(alert => !alert.isRead);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-orange-400" />
            <CardTitle className="text-white text-lg">Duplicate File Alerts</CardTitle>
            {unreadAlerts.length > 0 && (
              <Badge className="bg-orange-500 text-white">
                {unreadAlerts.length} new
              </Badge>
            )}
          </div>
          {userRole === 'admin' && (
            <Badge variant="outline" className="border-orange-500/30 text-orange-400">
              Admin View
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div 
            key={alert.id}
            className={`p-4 rounded-lg transition-all glass-card ${
              alert.isRead ? 'opacity-70' : 'opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${alert.isRead ? 'text-gray-400' : 'text-orange-400'}`} />
                  <span className={`text-sm font-medium ${alert.isRead ? 'text-gray-300' : 'text-orange-300'}`}>
                    Duplicate File Detected
                  </span>
                  {!alert.isRead && (
                    <Badge className="bg-orange-500 text-white text-xs">New</Badge>
                  )}
                </div>
                
                <p className={`text-sm ${alert.isRead ? 'text-gray-400' : 'text-gray-200'} mb-3`}>
                  File "{alert.fileName}" upload attempt blocked
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">Original:</span>
                    <span className="text-green-400">{alert.originalUploader}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">Date:</span>
                    <span className="text-green-400">
                      {new Date(alert.originalDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-red-400" />
                    <span className="text-gray-400">Attempted:</span>
                    <span className="text-red-400">{alert.attemptedUploader}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-red-400" />
                    <span className="text-gray-400">Attempt:</span>
                    <span className="text-red-400">
                      {new Date(alert.attemptedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {!alert.isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkAsRead(alert.id)}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {alerts.length > 5 && (
          <p className="text-center text-sm text-gray-400 mt-4">
            Showing latest 5 alerts out of {alerts.length} total
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DuplicateAlerts;
