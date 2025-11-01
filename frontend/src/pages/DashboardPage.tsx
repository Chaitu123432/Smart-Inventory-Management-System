// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

Chart.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

interface Stats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  recentActivity: {
    id: string;
    action: string;
    product: string;
    user: string;
    timestamp: string;
  }[];
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sample data for demo purposes
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [65, 59, 80, 81, 56, 72],
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const inventoryData = {
    labels: ['Category A', 'Category B', 'Category C', 'Category D'],
    datasets: [
      {
        label: 'Stock Levels',
        data: [120, 80, 60, 40],
        backgroundColor: [
          'rgba(15, 118, 110, 0.7)',
          'rgba(20, 184, 166, 0.7)',
          'rgba(13, 148, 136, 0.7)',
          'rgba(45, 212, 191, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const topProductsData = {
    labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
    datasets: [
      {
        label: 'Sales',
        data: [25, 20, 15, 12, 8],
        backgroundColor: [
          'rgba(15, 118, 110, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(13, 148, 136, 0.8)',
          'rgba(45, 212, 191, 0.8)',
          'rgba(94, 234, 212, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setStats({
          totalProducts: 156,
          lowStockProducts: 12,
          outOfStockProducts: 5,
          totalValue: 24680,
          recentActivity: [
            { 
              id: '1', 
              action: 'Added', 
              product: 'Wireless Keyboard', 
              user: 'John Doe', 
              timestamp: '2 hours ago' 
            },
            { 
              id: '2', 
              action: 'Updated', 
              product: 'LED Monitor', 
              user: 'Jane Smith', 
              timestamp: '3 hours ago' 
            },
            { 
              id: '3', 
              action: 'Removed', 
              product: 'USB Cable', 
              user: 'John Doe', 
              timestamp: '5 hours ago' 
            },
            { 
              id: '4', 
              action: 'Restocked', 
              product: 'Wireless Mouse', 
              user: 'Admin', 
              timestamp: '1 day ago' 
            },
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="card flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          color="bg-primary"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
          }
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockProducts}
          color="bg-yellow-500"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          }
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockProducts}
          color="bg-red-500"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
        />
        <StatCard
          title="Inventory Value"
          value={`$${stats.totalValue.toLocaleString()}`}
          color="bg-green-500"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Monthly Sales</h2>
          <div style={{ height: "300px" }}>
            <Line 
              data={salesData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      maxTicksLimit: 8
                    }
                  },
                  x: {
                    ticks: {
                      maxRotation: 0
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Inventory by Category</h2>
          <div style={{ height: "300px" }}>
            <Bar 
              data={inventoryData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      maxTicksLimit: 8
                    }
                  },
                  x: {
                    ticks: {
                      maxRotation: 0
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${activity.action === 'Added' ? 'bg-green-100 text-green-800' : 
                          activity.action === 'Updated' ? 'bg-blue-100 text-blue-800' : 
                          activity.action === 'Removed' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}
                      `}>
                        {activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.product}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Top Products</h2>
          <div className="flex-1 flex items-center justify-center">
            <Doughnut data={topProductsData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <h2 className="text-xl font-semibold mb-4">Inventory Predictions</h2>
        <div className="bg-blue-50 p-4 rounded-md flex items-start">
          <div className="text-blue-500 mr-3 flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
          </div>
          <div>
            <h3 className="text-blue-800 font-medium">AI Prediction</h3>
            <p className="text-blue-700 text-sm mt-1">Based on current sales trends, Wireless Keyboard stock will likely deplete within 7 days. Consider restocking soon.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage; 