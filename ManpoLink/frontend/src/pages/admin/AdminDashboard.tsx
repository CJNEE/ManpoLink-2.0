import { useState, useMemo, useEffect } from 'react';
import { Card, Badge, Button, LoadingSpinner, ErrorMessage, EmptyState } from '@/components/common';
import { Modal } from '@/components/Modal';
import { useGetEmployees, useGetHubs, useGetAttendance, useGetSecurityAlerts, useGetActivityLogs } from '@/hooks/useQueries';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { Search, Users, MapPin, AlertTriangle, Eye, Trash2, Edit, X, Navigation, Loader, User, Phone, Mail, Briefcase, Calendar, Shield, CreditCard, Clock, Landmark, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { normalizeApiResponse, getApiResponseCount } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HubsEmployeeChart from '@/components/HubsEmployeeChart';
import { calculateDistance, calculateTravelTime, formatTravelTime, getUserLocation } from '@/utils/locationUtils';
import { Sidebar } from '@/components/Sidebar';
// Color mappings for status
const STATUS_COLORS: Record<string, string> = {
  'Active': '#10B981',      // green
  'AWOL': '#F59E0B',        // yellow
  'Blacklist': '#EF4444',   // red
  'Resign': '#3B82F6',      // blue
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#1E40AF',
  'Full time': '#1E40AF',
  OCW: '#3B82F6',
};

export const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { employee } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHubTerm, setSearchHubTerm] = useState('');
  const [hubFilter, setHubFilter] = useState<number | null>(null);
  const [searchLocationTerm, setSearchLocationTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [directions, setDirections] = useState<any>({
    userLocation: null,
    selectedHub: null,
    distance: null,
    travelTimes: null,
    isLoadingLocation: false,
    error: null,
  });


  // Create beautiful custom SVG markers for Leaflet (remove ugly black shadows)
  const hubIcon = L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
        <div class="absolute w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
        <div class="relative w-7 h-7 bg-red-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  // Create user location icon
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
        <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-pulse"></div>
        <div class="relative w-7 h-7 bg-blue-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });

  // Fetch data
  const employeesQuery = useGetEmployees({ hub_id: hubFilter });
  const hubsQuery = useGetHubs();
  const attendanceQuery = useGetAttendance();
  const securityAlertsQuery = useGetSecurityAlerts();
  const activityLogsQuery = useGetActivityLogs({ limit: 5 });

  // Loading state
  const isLoading = employeesQuery.isLoading || hubsQuery.isLoading;

function FitBoundsComponent({ mapHubs, getCoords }: { mapHubs: any[], getCoords: (hub: any) => [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (mapHubs && mapHubs.length > 0) {
      const bounds = L.latLngBounds(mapHubs.map(hub => getCoords(hub)));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [mapHubs, map, getCoords]);
  return null;
}

// Process data
  const employees = useMemo(() => {
    const normalized = normalizeApiResponse(employeesQuery.data);
    return normalized.filter((emp: any) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employeesQuery.data, searchTerm]);

  const hubs = normalizeApiResponse(hubsQuery.data);

  // Calculate stats
  const allEmployees = normalizeApiResponse(employeesQuery.data);
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter((emp: any) => emp.status === 'Active').length;

  // Employment type distribution
  const employmentTypeData = useMemo(() => {
    const types = {} as Record<string, number>;
    allEmployees.forEach((emp: any) => {
      types[emp.employment_type] = (types[emp.employment_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  // Employee status distribution
  const statusData = useMemo(() => {
    const statuses = {} as Record<string, number>;
    allEmployees.forEach((emp: any) => {
      statuses[emp.status] = (statuses[emp.status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [allEmployees]);

  // Hub-specific employee distribution with status breakdown
  const hubEmployeeData = useMemo(() => {
    const hubMap = {} as Record<string, { Active: number; AWOL: number; Blacklist: number; Resign: number }>;
    
    allEmployees.forEach((emp: any) => {
      const hubName = emp.hub_name || 'Unknown Hub';
      if (!hubMap[hubName]) {
        hubMap[hubName] = { Active: 0, AWOL: 0, Blacklist: 0, Resign: 0 };
      }
      const status = emp.status || 'Active';
      if (status !== 'Inactive') {
        hubMap[hubName][status as keyof typeof hubMap[string]] = (hubMap[hubName][status as keyof typeof hubMap[string]] || 0) + 1;
      }
    });

    return Object.entries(hubMap)
      .map(([name, statuses]) => ({
        name: name.split(' ').slice(0, 3).join(' '),
        Active: statuses.Active || 0,
        AWOL: statuses.AWOL || 0,
        Blacklist: statuses.Blacklist || 0,
        Resign: statuses.Resign || 0,
      }));
  }, [allEmployees]);

  // Workforce status distribution
  const workforceStatusData = useMemo(() => {
    const positions = {} as Record<string, number>;
    allEmployees.forEach((emp: any) => {
      positions[emp.position] = (positions[emp.position] || 0) + 1;
    });
    return Object.entries(positions).map(([name, value]) => ({ name, count: value }));
  }, [allEmployees]);

  const COLORS = ['#C41E3A', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

  // Get hub coordinates
  const cityCoords: Record<string, [number, number]> = {
    'manila': [14.5995, 120.9842],
    'quezon': [14.8291, 121.2558],
    'cebu': [10.3157, 123.8854],
    'davao': [7.0731, 125.6121],
    'cagayan': [17.6412, 121.7740],
    'pampanga': [15.0955, 120.6650],
    'laguna': [14.3159, 121.4158],
    'batangas': [13.7563, 121.0437],
  };

  const getHubCoordinates = (hub: any): [number, number] => {
    if (hub.latitude && hub.longitude) {
      return [hub.latitude, hub.longitude];
    }
    const city = hub.city?.toLowerCase() || '';
    for (const [key, coords] of Object.entries(cityCoords)) {
      if (city.includes(key)) {
        return coords;
      }
    }
    return [12.5797, 124.0758];
  };

  // Direction handlers
  const handleMarkerClick = (hub: any) => {
    const coords = getHubCoordinates(hub);
    setDirections((prev: any) => ({
      ...prev,
      selectedHub: { ...hub, coordinates: coords },
      distance: null,
      travelTimes: null,
      error: null,
    }));
  };

  const handleGetDirection = async () => {
    setDirections((prev: any) => ({
      ...prev,
      isLoadingLocation: true,
      error: null,
    }));

    try {
      const userLoc = await getUserLocation();
      const hubCoords = directions.selectedHub.coordinates;
      const dist = calculateDistance(userLoc[0], userLoc[1], hubCoords[0], hubCoords[1]);
      const times = {
        walk: calculateTravelTime(dist, 'walk'),
        ride: calculateTravelTime(dist, 'ride'),
        car: calculateTravelTime(dist, 'car'),
      };

      setDirections((prev: any) => ({
        ...prev,
        userLocation: userLoc,
        distance: dist,
        travelTimes: times,
        isLoadingLocation: false,
      }));
    } catch (error: any) {
      setDirections((prev: any) => ({
        ...prev,
        isLoadingLocation: false,
        error: error.message || 'Failed to get location. Please enable location services.',
      }));
    }
  };

  const handleCloseDirections = () => {
    setDirections({
      userLocation: null,
      selectedHub: null,
      distance: null,
      travelTimes: null,
      isLoadingLocation: false,
      error: null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:ml-64 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
    
    <Sidebar
      open={sidebarOpen}
      onToggle={() => setSidebarOpen(!sidebarOpen)}
    />  

    <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {employee?.role === 'HR'
              ? '3PL BUSINESS SOLUTIONS | HR overview'
              : '3PL BUSINESS SOLUTIONS | Admin overview'}
          </p>
        </div>
        
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Employees */}
        <Card className="flex flex-col items-center justify-center p-6 h-44 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Employees</p>
          <p className="text-7xl font-black text-red-700 dark:text-white mt-4 leading-none text-center w-full">{totalEmployees}</p>
        </Card>

        {/* Total Hubs */}
        <Card className="flex flex-col items-center justify-center p-6 h-44 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Hubs</p>
          <p className="text-7xl font-black text-red-700 dark:text-white mt-4 leading-none text-center w-full">{hubs.length}</p>
        </Card>

        {/* Employee Status Pie Chart with Percentages */}
        <Card className="p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Employee Status</p>
          {statusData.length > 0 ? (
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={100}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 text-xs">
                {statusData.map((entry, index) => {
                  const total = statusData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = Math.round((entry.value / total) * 100);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STATUS_COLORS[entry.name] || '#3B82F6' }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        {/* Employment Type Horizontal Bar */}
        <Card className="p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-4">Employment Type</p>
          {employmentTypeData.length > 0 ? (
            <div className="space-y-4">
              {employmentTypeData.map((entry, index) => {
                  const maxVal = Math.max(...employmentTypeData.map((d) => d.value), 1);
                  const barPct = (entry.value / maxVal) * 100;
                  return (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {entry.value} <span className="text-gray-400">({Math.round(barPct)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: EMPLOYMENT_TYPE_COLORS[entry.name] || '#3B82F6',
                        width: `${barPct}%`
                      }}
                    />
                  </div>
                </div>
              );
              })}
            </div>
          ) : null}
        </Card>

        {/* Workforce Status */}
        <Card className="p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-3">Workforce Status</p>
          <div className="space-y-2 text-sm">
            {statusData.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="font-semibold text-lg" style={{ color: STATUS_COLORS[item.name] }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

        {/* Hub Locations Map & Hub Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hub Locations Map */}
        <Card className="p-0 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px] bg-white dark:bg-gray-900">
          <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <h2 className="text-lg font-semibold">Hub Locations</h2>
            <div className="relative flex-1 max-w-xs ml-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search Locations..." 
                value={searchLocationTerm}
                onChange={(e) => setSearchLocationTerm(e.target.value)}
                className="input-field text-sm !pl-10 w-full py-2 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>
          <div className="flex-1 w-full relative z-0 min-h-[400px]">
            {hubs.length > 0 ? (
              <MapContainer 
                center={[12.5797, 124.0758]} 
                zoom={6} 
                style={{ width: '100%', height: '100%' }}
              >
                <FitBoundsComponent mapHubs={hubs} getCoords={getHubCoordinates} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {hubs
                  .filter((hub: any) => 
                    !searchLocationTerm || 
                    hub.name?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
                    hub.location?.toLowerCase().includes(searchLocationTerm.toLowerCase()) ||
                    hub.city?.toLowerCase().includes(searchLocationTerm.toLowerCase())
                  )
                  .map((hub: any) => {
                    // Use hub coordinates if available, otherwise use a default based on city
                    let lat = hub.latitude || 12.5797;
                    let lng = hub.longitude || 124.0758;
                    
                    // Default coordinates for Philippine cities
                    const cityCoords: Record<string, [number, number]> = {
                      'manila': [14.5995, 120.9842],
                      'quezon': [14.8291, 121.2558],
                      'cebu': [10.3157, 123.8854],
                      'davao': [7.0731, 125.6121],
                      'cagayan': [17.6412, 121.7740],
                      'pampanga': [15.0955, 120.6650],
                      'laguna': [14.3159, 121.4158],
                      'batangas': [13.7563, 121.0437],
                    };
                    
                    if (!hub.latitude || !hub.longitude) {
                      const city = hub.city?.toLowerCase() || '';
                      for (const [key, coords] of Object.entries(cityCoords)) {
                        if (city.includes(key)) {
                          lat = coords[0];
                          lng = coords[1];
                          break;
                        }
                      }
                    }

                    return (
                      <Marker key={hub.id} position={[lat, lng]} icon={hubIcon}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{hub.name}</p>
                            <p className="text-gray-600 dark:text-gray-300">{hub.location || hub.city}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {allEmployees.filter((emp: any) => emp.hub === hub.id).length} employees
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500">No hubs available to display</p>
              </div>
            )}
          </div>
        </Card>

        {/* Hub Employee Distribution */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Hub Employee Distribution</h2>
          {hubEmployeeData.length > 0 && allEmployees.length > 0 ? (
            <HubsEmployeeChart hubsData={hubs} employees={allEmployees} />
          ) : (
            <EmptyState title="No hub data" />
          )}
        </Card>
      </div>

      {/* Employees Table */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Employees</h2>
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-sm flex-1 max-w-md"
            />
          </div>

          {employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Position</th>
                    <th className="px-4 py-3 text-left">Hub</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.slice(0, 10).map((emp: any) => (
                    <tr key={emp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                      <td className="px-4 py-3">{emp.position}</td>
                      <td className="px-4 py-3">{emp.hub_name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowEmployeeModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1 justify-center"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No employees found" />
          )}
        </div>
      </Card>

      {/* Hubs Table */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Hubs</h2>
            <input 
              type="text" 
              placeholder="Search Hubs..." 
              value={searchHubTerm}
              onChange={(e) => setSearchHubTerm(e.target.value)}
              className="input-field text-sm flex-1 max-w-md"
            />
          </div>

          {hubs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Hub Name</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Employees</th>
                  </tr>
                </thead>
                <tbody>
                  {hubs
                    .filter((hub: any) =>
                      !searchHubTerm ||
                      hub.name?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                      hub.location?.toLowerCase().includes(searchHubTerm.toLowerCase()) ||
                      hub.city?.toLowerCase().includes(searchHubTerm.toLowerCase())
                    )
                    .map((hub: any) => {
                      const hubEmployeeCount = allEmployees.filter((emp: any) => emp.hub === hub.id).length;
                      return (
                        <tr key={hub.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3 font-medium">{hub.name}</td>
                          <td className="px-4 py-3">{hub.location || hub.city || 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold text-red-700">{hubEmployeeCount}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No hubs found" />
          )}
        </div>
      </Card>

      {/* Employee Details Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowEmployeeModal(false)}>
          
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative z-[9999] border border-gray-100 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
            
            {/* Header Banner */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-red-800 to-red-650 p-6 md:p-8 text-white">
              {/* Abstract decorative graphic */}
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-red-900/40 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="relative shrink-0">
                  {selectedEmployee.profile_image ? (
                    <img 
                      src={selectedEmployee.profile_image} 
                      alt={selectedEmployee.full_name}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white/10 border-4 border-white/20 shadow-xl flex items-center justify-center text-4xl font-extrabold text-white">
                      {selectedEmployee.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md text-white border-2 border-red-800 ${
                    selectedEmployee.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-amber-500'
                  }`}>
                    {selectedEmployee.status}
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight">{selectedEmployee.full_name}</h2>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-red-100 border border-white/10">
                      ID: {selectedEmployee.employee_id || 'N/A'}
                    </span>
                  </div>
                  <p className="text-red-100/90 font-medium text-sm md:text-base mb-3">
                    {selectedEmployee.position} &bull; {selectedEmployee.hub_name || 'No Hub Assigned'}
                  </p>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-black/15 text-white/95 font-semibold">
                      {selectedEmployee.employment_type || 'N/A'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-black/15 text-white/95 font-semibold">
                      Role: {selectedEmployee.role || 'N/A'}
                    </span>
                    {selectedEmployee.jtp_code && (
                      <span className="px-2.5 py-1 rounded-lg bg-black/15 text-white/95 font-semibold">
                        JTP: {selectedEmployee.jtp_code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Right Close Button */}
                <button 
                  onClick={() => setShowEmployeeModal(false)}
                  className="absolute top-[-10px] right-[-10px] sm:static sm:self-start bg-white/10 hover:bg-white/20 text-white hover:text-white p-2 rounded-xl transition-all"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-950/60 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1 */}
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <User size={18} className="text-red-600 dark:text-red-500" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">Personal Info</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">First Name</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.firstname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Last Name</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.lastname || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Middle Initial</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.middle_initial || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Gender</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date of Birth</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.date_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Place of Birth</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.place_of_birth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nationality</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.nationality || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Marital Status</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.marital_status || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <Phone size={18} className="text-red-600 dark:text-red-500" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">Contact Info</h3>
                    </div>
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Address</p>
                          <p className="text-sm font-semibold text-gray-805 dark:text-white break-all">{selectedEmployee.email_address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Phone Number</p>
                          <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.phone_number || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Current Address</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.current_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Permanent Address</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.permanent_address || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-505 uppercase tracking-widest">Emergency Contact Name</p>
                          <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.emergency_contact_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest">Emergency Contact Phone</p>
                          <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.emergency_contact_phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  {/* Employment Details */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <Briefcase size={18} className="text-red-600 dark:text-red-500" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">Employment Info</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Position</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.position || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employment Type</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.employment_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hub</p>
                        <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.hub_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hired Date</p>
                        <p className="text-sm font-semibold text-gray-855 dark:text-white">{selectedEmployee.hired_date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee ID</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.employee_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">JTP Code</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.jtp_code || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Government IDs */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <Landmark size={18} className="text-red-600 dark:text-red-500" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">Government IDs</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">TIN</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.tin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">SSS</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.sss || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">PhilHealth</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.philhealth || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">PAG-IBIG</p>
                        <p className="text-sm font-semibold text-gray-850 dark:text-white">{selectedEmployee.pagibig || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Permissions & System Info */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <Shield size={18} className="text-red-600 dark:text-red-500" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">Permissions & System Info</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Can Login</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                          selectedEmployee.can_login 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {selectedEmployee.can_login ? 'Allowed' : 'Denied'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Can Edit Info</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                          selectedEmployee.can_edit_info 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {selectedEmployee.can_edit_info ? 'Allowed' : 'Denied'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Is Active</p>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                          selectedEmployee.is_active 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {selectedEmployee.is_active ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-xs">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Created At</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Updated At</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.updated_at ? new Date(selectedEmployee.updated_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Info */}
                  {selectedEmployee.latest_clock_in_out && (
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <Clock size={18} className="text-red-600 dark:text-red-500" />
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">Latest Clock In/Out</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Clock In Time</p>
                          <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.latest_clock_in_out.clock_in || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Clock Out Time</p>
                          <p className="text-sm font-semibold text-gray-805 dark:text-white">{selectedEmployee.latest_clock_in_out.clock_out || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
      </div>
  </div>
  );
};


