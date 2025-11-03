// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { forecastsAPI, productsAPI } from '../services/api';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ForecastData {
  productId: string;
  productName: string;
  historicalData: {
    date: string;
    sales: number;
  }[];
  forecastedData: {
    date: string;
    forecast: number;
    lowerBound: number;
    upperBound: number;
  }[];
}

interface Product {
  id: string;
  name: string;
}

const ForecastingPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Add products state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [forecastPeriod, setForecastPeriod] = useState(30);

  useEffect(() => {
    fetchForecasts();
    fetchProducts(); // Add this
  }, []);

  // Add this function to fetch products
  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      if (response.data && response.data.products) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    // Don't set error here - just log it
    setProducts([]);
    }
  };

  const fetchForecasts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use forecastsAPI instead of raw fetch - this includes auth token and base URL
      const response = await forecastsAPI.getAll();
      if (response.data && response.data.forecasts) {
        setForecasts(response.data.forecasts);
      } else if (Array.isArray(response.data)) {
        setForecasts(response.data);
      } else {
        // If no forecasts exist yet, set empty array (not an error)
        setForecasts([]);
      }
    } catch (err: any) {
      console.error('Error fetching forecasts:', err);
      // If it's a 401 or 403, it might be auth issue - show that
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication required. Please log in.');
      } else {
        setError(err.response?.data?.error?.message || 'Error fetching forecasts');
      }
      setForecasts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use forecastsAPI instead of raw fetch
      await forecastsAPI.generate({
        productId: selectedProduct,
        period: forecastPeriod
      });
      
      // Refresh forecasts after generating
      await fetchForecasts();
    } catch (err: any) {
      console.error('Error generating forecast:', err);
      setError(err.response?.data?.error?.message || 'Error generating forecast');
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (!forecasts.length) return null;
    
    const forecast = forecasts[0];
    const historicalDates = forecast.historicalData.map(d => d.date);
    const historicalSales = forecast.historicalData.map(d => d.sales);
    
    const forecastDates = forecast.forecastedData.map(d => d.date);
    const forecastValues = forecast.forecastedData.map(d => d.forecast);
    const lowerBounds = forecast.forecastedData.map(d => d.lowerBound);
    const upperBounds = forecast.forecastedData.map(d => d.upperBound);
    
    const chartData = {
      labels: [...historicalDates, ...forecastDates],
      datasets: [
        {
          label: 'Historical Sales',
          data: [...historicalSales, ...Array(forecastDates.length).fill(null)],
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.1)',
          fill: true,
          pointRadius: 1,
        },
        {
          label: 'Forecasted Sales',
          data: [...Array(historicalDates.length).fill(null), ...forecastValues],
          borderColor: '#14b8a6',
          borderDash: [5, 5],
          pointRadius: 1,
          fill: false,
        },
        {
          label: 'Upper Bound',
          data: [...Array(historicalDates.length).fill(null), ...upperBounds],
          borderColor: 'rgba(20, 184, 166, 0.2)',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'Lower Bound',
          data: [...Array(historicalDates.length).fill(null), ...lowerBounds],
          borderColor: 'rgba(20, 184, 166, 0.2)',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          pointRadius: 0,
          fill: '-1', // Fill to the previous dataset (upper bound)
        },
      ],
    };
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Demand Forecast for ${forecast.productName}`,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
          },
          ticks: {
            maxTicksLimit: 20,
          },
        },
        y: {
          title: {
            display: true,
            text: 'Units',
          },
          min: 0,
        },
      },
    };
    
    return (
      <div className="h-96">
        <Line data={chartData} options={chartOptions} />
      </div>
    );
  };

  const renderForecastInsights = () => {
    if (!forecasts.length) return null;
    
    const forecast = forecasts[0];
    // Calculate total forecasted sales
    const totalForecastedSales = forecast.forecastedData.reduce((sum, day) => sum + day.forecast, 0);
    
    // Find peak demand day
    const peakDemandDay = [...forecast.forecastedData].sort((a, b) => b.forecast - a.forecast)[0];
    
    // Find trend (comparing first week to last week of forecast)
    const firstWeekAvg = forecast.forecastedData.slice(0, 7).reduce((sum, day) => sum + day.forecast, 0) / 7;
    const lastWeekAvg = forecast.forecastedData.slice(-7).reduce((sum, day) => sum + day.forecast, 0) / 7;
    const trendPercentage = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
    const trendDirection = trendPercentage >= 0 ? 'increasing' : 'decreasing';
    
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Forecast Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Projected Sales</p>
            <p className="text-xl font-bold">{totalForecastedSales.toFixed(0)} units</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Peak Demand Day</p>
            <p className="text-xl font-bold">{new Date(peakDemandDay.date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Forecast: {peakDemandDay.forecast.toFixed(0)} units</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Trend Analysis</p>
            <p className="text-xl font-bold">
              {Math.abs(trendPercentage).toFixed(1)}% {trendDirection}
            </p>
            <p className="text-sm text-gray-500">
              {trendDirection === 'increasing' 
                ? 'Demand is projected to increase' 
                : 'Demand is projected to decrease'}
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-md font-semibold text-blue-700 mb-2">AI Recommendations</h4>
          <p className="text-sm text-blue-600">
            {trendDirection === 'increasing'
              ? `Based on the ${Math.abs(trendPercentage).toFixed(1)}% projected increase in demand, consider increasing stock levels of ${forecast.productName} by at least ${Math.ceil(Math.abs(trendPercentage) / 10) * 10}% to avoid stockouts.`
              : `Demand for ${forecast.productName} is projected to decrease by ${Math.abs(trendPercentage).toFixed(1)}%. Consider reducing procurement to avoid excess inventory.`
            }
          </p>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Demand Forecasting">
      {isLoading && !forecasts.length && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Forecast</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a product</option>
              {products.map((product) => ( // Change from forecasts to products
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forecast Period (days)
            </label>
            <input
              type="number"
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="1"
              max="365"
            />
          </div>
        </div>
        
        <button
          onClick={handleGenerateForecast}
          disabled={isLoading || !selectedProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Forecast'}
        </button>
      </div>
      
      {forecasts.length > 0 && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Demand Forecast for {forecasts[0].productName}
            </h3>
            {renderChart()}
          </div>
          
          {renderForecastInsights()}
          
          <div className="card mt-6">
            <h2 className="text-xl font-semibold mb-4">Forecast Data Table</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Forecasted Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lower Bound
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upper Bound
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forecasts[0].forecastedData.map((data, index) => (
                    <tr key={`${forecasts[0].productId}-${data.date}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(data.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.forecast}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.lowerBound}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.upperBound}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default ForecastingPage; 