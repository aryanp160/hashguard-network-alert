import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Loader2, Users, FileText, Database } from 'lucide-react';
import { getPinataStorageStats } from '../utils/pinataUtils';
import { getPersonalFileCount, getNetworkFileCount, getNetworkCount } from '../utils/networkUtils';

Chart.register(ArcElement, Tooltip, Legend);

interface StorageAnalyticsProps {
  userWallet: string;
  compact?: boolean;
  onlyCounts?: boolean;
}

const StorageAnalytics: React.FC<StorageAnalyticsProps> = ({ userWallet, compact, onlyCounts }) => {
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0); // in bytes
  const [storageLimit, setStorageLimit] = useState(5 * 1024 * 1024 * 1024); // 5GB default
  const [personalFiles, setPersonalFiles] = useState(0);
  const [networkFiles, setNetworkFiles] = useState(0);
  const [networkCount, setNetworkCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Pinata storage stats
        const pinataStats = await getPinataStorageStats();
        setStorageUsed(pinataStats.used);
        setStorageLimit(pinataStats.limit || 5 * 1024 * 1024 * 1024);

        // File and network counts
        const [personal, network, networks] = await Promise.all([
          getPersonalFileCount(userWallet),
          getNetworkFileCount(userWallet),
          getNetworkCount(userWallet),
        ]);
        setPersonalFiles(personal);
        setNetworkFiles(network);
        setNetworkCount(networks);
      } catch (e) {
        // fallback: show zeros
        setStorageUsed(0);
        setPersonalFiles(0);
        setNetworkFiles(0);
        setNetworkCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userWallet]);

  const usedGB = (storageUsed / (1024 * 1024 * 1024)).toFixed(2);
  const limitGB = (storageLimit / (1024 * 1024 * 1024)).toFixed(2);
  const percentUsed = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const pieData = {
    labels: ['Personal Files', 'Network Files'],
    datasets: [
      {
        data: [personalFiles, networkFiles],
        backgroundColor: ['#06b6d4', '#a78bfa'],
        borderColor: ['#0891b2', '#7c3aed'],
        borderWidth: 2,
      },
    ],
  };


  if (loading) {
    return (
      <div className="glass-card flex flex-col items-center py-4 p-4">
        <Loader2 className="animate-spin w-6 h-6 text-cyan-400 mb-2" />
        <div className="text-gray-300 text-xs">Loading analytics...</div>
      </div>
    );
  }

  if (onlyCounts) {
    return (
      <div className="glass-card flex flex-col items-center gap-2 text-base p-4">
        <div className="flex w-full justify-between">
          <span className="text-cyan-400">Network Files</span>
          <span className="font-bold text-cyan-300">{typeof networkFiles === 'number' ? networkFiles : 0}</span>
        </div>
        <div className="flex w-full justify-between">
          <span className="text-purple-400">Your Files</span>
          <span className="font-bold text-purple-300">{typeof personalFiles === 'number' ? personalFiles : 0}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col items-center space-y-6 p-4 transition-transform duration-300 hover:scale-[1.01]">
      <div className="w-full flex flex-col items-center">
        <div className="text-lg font-bold text-cyan-300 mb-1">
          {usedGB} GB <span className="text-gray-400 font-normal">/ {limitGB} GB</span>
        </div>
        <div className="w-full bg-cyan-900/30 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-cyan-400 to-purple-400 h-3 rounded-full"
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-400 mb-2">Storage Used</div>
      </div>
      <div className="w-40 h-40 mx-auto">
        <Pie data={pieData} options={{ plugins: { legend: { display: true, position: 'bottom', labels: { color: '#fff' } } }, maintainAspectRatio: false }} />
      </div>
      <div className="flex justify-center space-x-8 mt-4">
        <div className="flex flex-col items-center">
          <FileText className="w-6 h-6 text-cyan-400 mb-1" />
          <div className="text-lg font-bold text-white">{personalFiles + networkFiles}</div>
          <div className="text-xs text-gray-400">Total Files</div>
        </div>
        <div className="flex flex-col items-center">
          <Users className="w-6 h-6 text-purple-400 mb-1" />
          <div className="text-lg font-bold text-white">{networkCount}</div>
          <div className="text-xs text-gray-400">Networks</div>
        </div>
      </div>
      <div className="flex w-full justify-between mt-2">
        <span className="text-cyan-400">Network: <b>{networkFiles}</b></span>
        <span className="text-purple-400">Yours: <b>{personalFiles}</b></span>
      </div>
    </div>
  );
};

export default StorageAnalytics;
