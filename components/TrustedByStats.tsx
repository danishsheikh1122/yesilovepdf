'use client';

import React, { useState, useEffect } from 'react';
import { getTotalUsage } from '../lib/pdfTracking';

interface TrustedByStatsProps {
  className?: string;
}

export default function TrustedByStats({ className = '' }: TrustedByStatsProps) {
  const [stats, setStats] = useState<{
    totalActions: number;
    uniqueUsers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getTotalUsage();
      setStats({
        totalActions: data.totalActions || 0,
        uniqueUsers: data.uniqueUsers || 0
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      // Set default values on error
      setStats({
        totalActions: 25000, // fallback number
        uniqueUsers: 5000    // fallback number
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">
          Trusted by thousands worldwide
        </h3>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatNumber(stats?.uniqueUsers || 0)}+
            </div>
            <p className="text-gray-600 text-lg mt-2">Happy Users</p>
          </div>
          
          <div className="hidden sm:block w-px h-16 bg-gray-300"></div>
          
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              {formatNumber(stats?.totalActions || 0)}+
            </div>
            <p className="text-gray-600 text-lg mt-2">PDFs Processed</p>
          </div>
        </div>
        
        <p className="text-gray-500 text-sm mt-6 max-w-2xl mx-auto">
          Join thousands of users who trust our platform for their PDF needs. 
          Fast, secure, and reliable processing with no limits.
        </p>
      </div>
    </div>
  );
}