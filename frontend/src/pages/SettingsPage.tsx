import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
// @ts-ignore
import axios from 'axios';

interface ApiSetting {
  name: string;
  key: string;
  isConnected: boolean;
  description: string;
}

interface NotificationSetting {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  threshold?: number;
  recipients?: string[];
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'integrations' | 'general'>('profile');
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: 'Your Company',
    role: user?.role || '',
  });
  
  const [apiSettings, setApiSettings] = useState<ApiSetting[]>([
    {
      name: 'Google Sheets',
      key: 'xxxxx-xxxxx-xxxxx-xxxxx-xxxxx',
      isConnected: true,
      description: 'Connect to Google Sheets for inventory data storage and reporting.',
    },
    {
      name: 'ERPNext',
      key: '',
      isConnected: false,
      description: 'Integrate with ERPNext for comprehensive inventory tracking.',
    },
    {
      name: 'WooCommerce',
      key: 'wc_xxxxxxxxxxxxxxxxxxxxxx',
      isConnected: true,
      description: 'Connect to your WooCommerce store for real-time inventory synchronization.',
    },
    {
      name: 'Zoho Books',
      key: '',
      isConnected: false,
      description: 'Integrate with Zoho Books for accounting and financial tracking.',
    },
    {
      name: 'Hugging Face',
      key: 'hf_xxxxxxxxxxxxxxxxxxxxxxxx',
      isConnected: true,
      description: 'Use Hugging Face AI models for advanced inventory predictions.',
    },
  ]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      type: 'email',
      name: 'Low Stock Alert',
      enabled: true,
      threshold: 5,
      recipients: ['admin@example.com'],
    },
    {
      id: '2',
      type: 'sms',
      name: 'Out of Stock Alert',
      enabled: true,
      recipients: ['+1234567890'],
    },
    {
      id: '3',
      type: 'email',
      name: 'Daily Inventory Report',
      enabled: false,
      recipients: ['admin@example.com', 'manager@example.com'],
    },
    {
      id: '4',
      type: 'email',
      name: 'Sales Forecast Updates',
      enabled: true,
      recipients: ['admin@example.com'],
    },
  ]);
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    lowStockThreshold: 10,
    theme: 'light',
  });

  const [settings, setSettings] = useState({
    forecastHorizon: 30,
    confidenceLevel: 0.95,
    seasonality: true,
    trend: true,
    holidays: false,
    minStockLevel: 10,
    reorderPoint: 20,
    safetyStock: 5
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile form update
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleApiKeyChange = (index: number, key: string) => {
    const updatedSettings = [...apiSettings];
    updatedSettings[index].key = key;
    updatedSettings[index].isConnected = !!key;
    setApiSettings(updatedSettings);
  };

  const handleNotificationToggle = (id: string) => {
    setNotificationSettings(
      notificationSettings.map((setting: NotificationSetting) => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleThresholdChange = (id: string, value: number) => {
    setNotificationSettings(
      notificationSettings.map((setting: NotificationSetting) => 
        setting.id === id ? { ...setting, threshold: value } : setting
      )
    );
  };

  const handleRecipientsChange = (id: string, recipients: string) => {
    setNotificationSettings(
      notificationSettings.map((setting: NotificationSetting) => 
        setting.id === id ? { ...setting, recipients: recipients.split(',').map(r => r.trim()) } : setting
      )
    );
  };

  const handleGeneralSettingChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: name === 'lowStockThreshold' ? parseInt(value) : value,
    });
  };

  const handleGeneralSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={profileForm.company}
                  onChange={handleProfileChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={profileForm.role}
                  onChange={handleProfileChange}
                  className="input-field"
                  disabled
                />
                <p className="mt-1 text-sm text-gray-500">Role cannot be changed. Contact administrator for role changes.</p>
              </div>
              
              <div className="pt-4">
                <button type="submit" className="btn-primary">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        );
      
      case 'integrations':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">API Integrations</h2>
            <div className="space-y-6">
              {apiSettings.map((api: ApiSetting, index: number) => (
                <div key={api.name} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{api.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{api.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${api.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {api.isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor={`api-key-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id={`api-key-${index}`}
                        value={api.key}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleApiKeyChange(index, e.target.value)}
                        placeholder="Enter API key"
                        className="input-field flex-1"
                      />
                      <button
                        type="button"
                        className={`ml-2 px-4 py-2 rounded-md ${api.isConnected ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-primary text-white'}`}
                      >
                        {api.isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
            <div className="space-y-4">
              {notificationSettings.map((notification: NotificationSetting) => (
                <div key={notification.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{notification.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Type: <span className="capitalize">{notification.type}</span>
                      </p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notification.enabled}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleNotificationToggle(notification.id)}
                      />
                      <span className="relative inline-block w-12 h-6 bg-gray-300 rounded-full transition-colors duration-200 ease-in-out cursor-pointer">
                        <span
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            notification.enabled ? 'transform translate-x-6' : ''
                          }`}
                        ></span>
                      </span>
                    </label>
                  </div>
                  
                  {notification.enabled && (
                    <div className="mt-4 space-y-3">
                      {notification.threshold !== undefined && (
                        <div>
                          <label htmlFor={`threshold-${notification.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Threshold (units)
                          </label>
                          <input
                            type="number"
                            id={`threshold-${notification.id}`}
                            value={notification.threshold}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleThresholdChange(notification.id, parseInt(e.target.value))}
                            min="1"
                            className="input-field w-full"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label htmlFor={`recipients-${notification.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Recipients ({notification.type === 'email' ? 'Email' : 'Phone Numbers'})
                        </label>
                        <input
                          type="text"
                          id={`recipients-${notification.id}`}
                          value={notification.recipients?.join(', ')}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleRecipientsChange(notification.id, e.target.value)}
                          placeholder={notification.type === 'email' ? 'email1@example.com, email2@example.com' : '+1234567890, +0987654321'}
                          className="input-field w-full"
                        />
                        <p className="mt-1 text-xs text-gray-500">Separate multiple recipients with commas</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'general':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forecast Horizon (days)
                  </label>
                  <input
                    type="number"
                    value={settings.forecastHorizon}
                    onChange={(e) => setSettings({ ...settings, forecastHorizon: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                    max="365"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Level
                  </label>
                  <input
                    type="number"
                    value={settings.confidenceLevel}
                    onChange={(e) => setSettings({ ...settings, confidenceLevel: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock Level
                  </label>
                  <input
                    type="number"
                    value={settings.minStockLevel}
                    onChange={(e) => setSettings({ ...settings, minStockLevel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    value={settings.reorderPoint}
                    onChange={(e) => setSettings({ ...settings, reorderPoint: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Stock
                  </label>
                  <input
                    type="number"
                    value={settings.safetyStock}
                    onChange={(e) => setSettings({ ...settings, safetyStock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="seasonality"
                    checked={settings.seasonality}
                    onChange={(e) => setSettings({ ...settings, seasonality: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="seasonality" className="ml-2 block text-sm text-gray-700">
                    Include Seasonality
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trend"
                    checked={settings.trend}
                    onChange={(e) => setSettings({ ...settings, trend: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trend" className="ml-2 block text-sm text-gray-700">
                    Include Trend
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout title="Settings">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'integrations'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('integrations')}
          >
            Integrations
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'notifications'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'general'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage; 