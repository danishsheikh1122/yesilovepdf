'use client';

import React, { useState, useEffect } from 'react';
import { getTotalUsage } from '../lib/pdfTracking';

interface UsageStats {
  totalActions: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
  recentActivity: {
    ip_address: string;
    pdf_name: string;
    action_type: string;
    created_at: Date | string;
    user_agent?: string;
    file_size?: number;
  }[];
}

export default function UsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTotalUsage();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch usage statistics');
      console.error('Error fetching usage stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p>{error}</p>
          <button 
            onClick={fetchUsageStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <p className="text-gray-500">No usage data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">PDF Usage Analytics</h2>
        <button 
          onClick={fetchUsageStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total PDF Actions</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.totalActions.toLocaleString()}</div>
          <p className="text-gray-500 text-sm mt-1">All PDF operations performed</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Unique Users</h3>
          <div className="text-3xl font-bold text-green-600">{stats.uniqueUsers.toLocaleString()}</div>
          <p className="text-gray-500 text-sm mt-1">Based on IP addresses</p>
        </div>
      </div>

      {/* Top Actions */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Most Popular Actions</h3>
        <div className="space-y-3">
          {stats.topActions.slice(0, 8).map((action, index) => (
            <div key={action.action} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600 w-4">
                  #{index + 1}
                </span>
                <span className="capitalize text-gray-800">
                  {action.action.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {action.count}
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(action.count / stats.topActions[0].count) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Action</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">File</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Size</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map((activity, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-sm">
                    <span className="capitalize bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {activity.action_type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600 max-w-xs truncate">
                    {activity.pdf_name}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    {formatFileSize(activity.file_size)}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-500">
                    {formatDate(activity.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}