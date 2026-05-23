import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/common';
import { GlassCard } from '@/components/GlassCard';
import { useGetHubs, useGetEmployees, useCreateHub, useDeleteHub, useUpdateHub } from '@/hooks/useQueries';
import { MapPin, X, Search, Navigation, ChevronLeft, ChevronRight, Users, Footprints, Bike, Car, Plus, Trash2, Edit2, CloudRain, Sun, Cloud, Thermometer, Route, Shield } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import 'leaflet/dist/leaflet.css';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/context/ThemeContext';
import { fetchWeather } from '@/utils/weather';
import { useAuth } from '@/hooks/useAuth';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

export type ParsedOsrmRoute = {
  coordinates: [number, number][];
  distanceM: number;
  durationSec: number;
  turns: Array<{ instruction: string; distance: number; duration: number }>;
  turnCount: number;
};

function parseOsrmResponse(data: any): ParsedOsrmRoute | null {
  if (!data?.routes?.length) return null;
  const route = data.routes[0];
  const coordinates: [number, number][] = route.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]]
  );
  const turns: Array<{ instruction: string; distance: number; duration: number }> = [];
  let turnCount = 0;

  route.legs?.forEach((leg: any) => {
    (leg.steps || []).forEach((step: any) => {
      const instr = step.maneuver?.instruction;
      if (instr) {
        turns.push({
          instruction: instr,
          distance: Math.round(step.distance ?? 0),
          duration: Math.round(step.duration ?? 0),
        });
      }
      const t = step.maneuver?.type;
      if (t && t !== 'depart' && t !== 'arrive') turnCount += 1;
    });
  });

  if (turns.length === 0) {
    turns.push({
      instruction: 'Follow route',
      distance: Math.round(route.distance),
      duration: Math.round(route.duration),
    });
  }

  if (turnCount === 0 && turns.length > 1) {
    turnCount = Math.max(0, turns.length - 1);
  }

  return {
    coordinates,
    distanceM: route.distance,
    durationSec: route.duration,
    turns,
    turnCount,
  };
}

async function fetchOsrmProfile(
  profile: string,
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<ParsedOsrmRoute | null> {
  const url = `${OSRM_BASE}/${profile}/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson&overview=full`;
  const response = await fetch(url);
  const data = await response.json();
  return parseOsrmResponse(data);
}

function formatTravelTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0 min';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDistance(meters: number): string {
  if (!meters || meters < 0) return '0 km';
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

interface HubState {
  selectedHub: any | null;
}

export const AdminHubsPage = () => {
  const { canViewEmployees } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [hubState, setHubState] = useState<HubState>({
    selectedHub: null,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeData, setRouteData] = useState<{
    walking: ParsedOsrmRoute;
    riding: ParsedOsrmRoute;
    car: ParsedOsrmRoute;
  } | null>(null);
  const [weatherData, setWeatherData] = useState<{ temp: number; label: string; icon: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const mapRef = useRef(null);

  const { data, isLoading } = useGetHubs();
  const { data: employeesData } = useGetEmployees();
  
  const createHubMutation = useCreateHub();
  const updateHubMutation = useUpdateHub();
  const deleteHubMutation = useDeleteHub();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHubId, setEditingHubId] = useState<number | null>(null);
  const [newHub, setNewHub] = useState({ name: '', location: '', city: 'Quezon', address: '', latitude: 14.6760, longitude: 121.0437 });

  const hubs = normalizeApiResponse(data);
  const allEmployees = normalizeApiResponse(employeesData);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.warn('Geolocation error:', error)
      );
    }
  }, []);

  // Weather update when hub selected
  useEffect(() => {
    if (hubState.selectedHub) {
      const coords = getHubCoordinates(hubState.selectedHub);
      fetchWeather(coords[0], coords[1]).then(setWeatherData);
    } else if (userLocation) {
      fetchWeather(userLocation[0], userLocation[1]).then(setWeatherData);
    } else {
      // Default to Manila coords
      fetchWeather(14.5995, 120.9842).then(setWeatherData);
    }
  }, [hubState.selectedHub, userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRealRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
    setLoadingRoute(true);
    try {
      const km = calculateDistance(startLat, startLon, endLat, endLon);
      const line: [number, number][] = [[startLat, startLon], [endLat, endLon]];
      
      const makeEstimate = (speedKmh: number, label: string, turns: number = 0): ParsedOsrmRoute => {
        const durationSec = Math.max(60, Math.round((km / speedKmh) * 3600));
        return {
          coordinates: line,
          distanceM: km * 1000,
          durationSec,
          turns: [{ instruction: `${label} (estimated route)`, distance: Math.round(km * 1000), duration: durationSec }],
          turnCount: Math.max(0, turns),
        };
      };

      const [walkRes, rideRes, carRes] = await Promise.all([
        fetchOsrmProfile('foot', startLat, startLon, endLat, endLon).catch(() => null),
        fetchOsrmProfile('cycling', startLat, startLon, endLat, endLon).catch(() => null),
        fetchOsrmProfile('driving', startLat, startLon, endLat, endLon).catch(() => null),
      ]);

      const walking = walkRes ?? makeEstimate(5, 'Walking', 0);
      const riding = rideRes ?? makeEstimate(15, 'Riding', Math.round(km / 2));
      const car = carRes ?? makeEstimate(35, 'Car', Math.round(km / 1.5));

      setRouteData({ walking, riding, car });
      setShowDirections(true);
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

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

  const filteredHubs = useMemo(() => {
    return hubs.filter((hub: any) =>
      !searchTerm ||
      hub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hub.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hub.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hubs, searchTerm]);

  const getHubEmployeeCount = (hubId: number) => {
    return allEmployees.filter((emp: any) => emp.hub === hubId).length;
  };

  const hubEmployeesData = useMemo(() => {
    if (!hubState.selectedHub) return [];
    const hubEmployees = allEmployees.filter((emp: any) => emp.hub === hubState.selectedHub.id);
    if (!employeeSearch) return hubEmployees;
    return hubEmployees.filter((emp: any) =>
      emp.full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.position?.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [hubState.selectedHub, employeeSearch, allEmployees]);

  const totalPages = Math.ceil(hubEmployeesData.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return hubEmployeesData.slice(startIdx, startIdx + itemsPerPage);
  }, [hubEmployeesData, currentPage]);

  const employmentTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    hubEmployeesData.forEach((emp: any) => {
      const type = emp.employment_type || 'Unknown';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [hubEmployeesData]);

  const cityCoords: Record<string, [number, number]> = {
    'manila': [14.5995, 120.9842], 'quezon': [14.8291, 121.2558], 'cebu': [10.3157, 123.8854],
    'davao': [7.0731, 125.6121], 'cagayan': [17.6412, 121.7740], 'pampanga': [15.0955, 120.6650],
    'laguna': [14.3159, 121.4158], 'batangas': [13.7563, 121.0437],
  };

  const getHubCoordinates = (hub: any): [number, number] => {
    if (hub.latitude && hub.longitude) return [hub.latitude, hub.longitude];
    const city = hub.city?.toLowerCase() || '';
    for (const [key, coords] of Object.entries(cityCoords)) {
      if (city.includes(key)) return coords;
    }
    return [12.5797, 124.0758];
  };

  const handleMarkerClick = (hub: any) => {
    const coords = getHubCoordinates(hub);
    setHubState({ selectedHub: { ...hub, coordinates: coords } });
    setEmployeeSearch('');
    setCurrentPage(1);
  };

  const handleCloseHub = () => {
    setHubState({ selectedHub: null });
    setEmployeeSearch('');
    setCurrentPage(1);
    setShowDirections(false);
    setRouteData(null);
  };

  const handleGetDirections = () => {
    if (userLocation && hubState.selectedHub) {
      const coords = getHubCoordinates(hubState.selectedHub);
      fetchRealRoute(userLocation[0], userLocation[1], coords[0], coords[1]);
    }
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHubId) {
        await updateHubMutation.mutateAsync({ id: editingHubId, data: newHub });
      } else {
        await createHubMutation.mutateAsync(newHub);
      }
      setShowAddModal(false);
      setEditingHubId(null);
      setNewHub({ name: '', location: '', city: 'Quezon', address: '', latitude: 14.6760, longitude: 121.0437 });
    } catch (error) {
      console.error("Failed to save hub", error);
    }
  };

  const handleEditClick = (hub: any, e: any) => {
    e.stopPropagation();
    setEditingHubId(hub.id);
    setNewHub({
      name: hub.name,
      location: hub.location || '',
      city: hub.city || 'Quezon',
      address: hub.address || '',
      latitude: hub.latitude || 14.6760,
      longitude: hub.longitude || 121.0437,
    });
    setShowAddModal(true);
  };

  const handleDeleteHub = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this hub?")) {
      try {
        await deleteHubMutation.mutateAsync(id);
        if (hubState.selectedHub?.id === id) handleCloseHub();
      } catch (error) {
        console.error("Failed to delete hub", error);
      }
    }
  };

  // Best route logic
  const bestRoute = useMemo(() => {
    if (!routeData) return null;
    const modes = [
      { key: 'car', time: routeData.car.durationSec },
      { key: 'riding', time: routeData.riding.durationSec },
      { key: 'walking', time: routeData.walking.durationSec }
    ];
    return modes.sort((a, b) => a.time - b.time)[0].key;
  }, [routeData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-4 lg:p-6 lg:ml-64 flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="p-4 lg:p-6 lg:ml-64 space-y-4">
        {/* Header and Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Hubs</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {filteredHubs.length} hub locations
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-red-600/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} />
            Add Hub
          </button>
        </div>

        {/* Top Controls Row */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-5 space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="input-field w-full !pl-11 py-3 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            
            {weatherData && (
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-2xl">
                  {weatherData.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Weather in {hubState.selectedHub ? hubState.selectedHub.name : (userLocation ? 'Your Location' : 'Manila')}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{weatherData.temp}°C • {weatherData.label}</p>
                </div>
              </div>
            )}
          </div>

          {/* New Route Info Box (The "Red Box" in screenshot) */}
          <Card className="xl:col-span-7 p-0 overflow-hidden bg-white dark:bg-gray-900 border-red-100 dark:border-gray-700 shadow-lg border-l-4 border-l-red-600">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-gray-800">
              <div className="p-3 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Route size={14} className="text-red-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Route Metrics</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {routeData ? (
                    <>
                      <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <Car size={14} className="mx-auto text-red-600 mb-1" />
                        <p className="text-[9px] font-black uppercase">{formatDistance(routeData.car.distanceM)}</p>
                        <p className="text-[8px] text-gray-400">{routeData.car.turnCount} Turns</p>
                      </div>
                      <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <Bike size={14} className="mx-auto text-red-600 mb-1" />
                        <p className="text-[9px] font-black uppercase">{formatDistance(routeData.riding.distanceM)}</p>
                        <p className="text-[8px] text-gray-400">{routeData.riding.turnCount} Turns</p>
                      </div>
                      <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <Footprints size={14} className="mx-auto text-red-600 mb-1" />
                        <p className="text-[9px] font-black uppercase">{formatDistance(routeData.walking.distanceM)}</p>
                        <p className="text-[8px] text-gray-400">{routeData.walking.turnCount} Turns</p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-3 py-2 text-[10px] text-gray-400 italic text-center">Select hub & get direction</div>
                  )}
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Map and Details Container */}
        {filteredHubs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-[600px]">
            <GlassCard className="lg:col-span-4 p-0 relative overflow-hidden rounded-2xl shadow-2xl border-white dark:border-gray-800">
              <div className="map-container w-full h-full">
                <MapContainer center={[12.5797, 124.0758]} zoom={6} style={{ width: '100%', height: '100%' }} ref={mapRef}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  {userLocation && <Marker position={userLocation} icon={userIcon}><Popup>Your Location</Popup></Marker>}
                  {filteredHubs.map((hub: any) => (
                    <Marker 
                      key={hub.id} 
                      position={getHubCoordinates(hub)} 
                      icon={hubIcon}
                      eventHandlers={{ click: () => handleMarkerClick(hub) }}
                    >
                      <Popup>{hub.name}</Popup>
                    </Marker>
                  ))}
                  {showDirections && userLocation && hubState.selectedHub && routeData && (
                    <Polyline positions={routeData.car.coordinates} color="#dc2626" weight={4} opacity={0.85} />
                  )}
                </MapContainer>
              </div>
            </GlassCard>

            {hubState.selectedHub ? (
              <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-900 border border-red-200 dark:border-gray-800 rounded-2xl shadow-2xl relative animate-in slide-in-from-right-4">
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white truncate pr-4">{hubState.selectedHub.name}</h3>
                  <button onClick={handleCloseHub} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"><X size={22} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search Name" value={employeeSearch} onChange={(e: any) => { setEmployeeSearch(e.target.value); setCurrentPage(1); }} className="input-field w-full !pl-9 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Employment</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {employmentTypeData.map((type) => (
                          <div key={type.name} className="flex items-center bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300">{type.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700 text-center flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{hubEmployeesData.length}</p>
                    </div>
                  </div>

                  <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                    <div className="bg-black text-white px-3 py-2 flex text-[10px] font-black uppercase tracking-widest">
                      <div className="w-[45%]">Name</div>
                      <div className="w-[30%]">Position</div>
                      <div className="w-[25%] text-center">Status</div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {!canViewEmployees ? (
                        <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                          <Shield size={24} className="text-gray-300" />
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Restricted Access</p>
                          <p className="text-[9px] text-gray-400">View Employee Records permission is off</p>
                        </div>
                      ) : paginatedEmployees.length > 0 ? paginatedEmployees.map((emp: any) => (
                        <div key={emp.id} className="flex items-center px-3 py-3 border-b border-gray-50 dark:border-gray-800 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="w-[45%] font-bold text-gray-900 dark:text-white truncate pr-2">{emp.full_name}</div>
                          <div className="w-[30%] text-gray-500 truncate pr-2">{emp.position || 'N/A'}</div>
                          <div className="w-[25%] flex justify-center"><div className={`h-2.5 w-full rounded-full ${emp.status?.toLowerCase() === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} /></div>
                        </div>
                      )) : <div className="py-8 text-center text-gray-400 text-xs italic">No employees found</div>}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="text-gray-400 disabled:opacity-30"><ChevronLeft size={20} /></button>
                      <span className="text-[11px] font-bold text-gray-500">{currentPage} / {totalPages || 1}</span>
                      <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} className="text-gray-400 disabled:opacity-30"><ChevronRight size={20} /></button>
                    </div>
                    <button onClick={handleGetDirections} disabled={loadingRoute} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
                      {loadingRoute ? <LoadingSpinner size="sm" /> : <><Navigation size={16} /> Get Direction</>}
                    </button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="lg:col-span-2 p-6 flex flex-col justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-red-600">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white uppercase tracking-tight">Hub Directory</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Select a hub on the map</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Network</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{hubs.length} Hubs</p>
                        </div>
                        <Route className="text-red-600" size={24} />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Personnel</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{allEmployees.length} Staff</p>
                        </div>
                        <Users className="text-red-600" size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50/50 dark:bg-red-950/10 p-4 rounded-xl border border-red-100/30 dark:border-red-950/20 text-center mt-6">
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest leading-relaxed">
                    💡 Pro-Tip
                  </p>
                  <p className="text-[9px] text-gray-550 dark:text-gray-400 mt-1 leading-normal font-semibold">
                    Click any red marker pins on the map to display real-time route directions, travel time, local weather conditions, and detailed employee rosters.
                  </p>
                </div>
              </Card>
            )}
          </div>
        ) : null}

        {/* Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredHubs.map((hub: any) => {
            const employeeCount = getHubEmployeeCount(hub.id);
            return (
              <GlassCard key={hub.id} className="p-5 hover:border-red-600/50 transition-all cursor-pointer group" onClick={() => handleMarkerClick(hub)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-red-600" />
                      <h3 className="font-bold text-lg group-hover:text-red-600 transition-colors">{hub.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{hub.location || hub.city}</p>
                    <p className="text-[10px] text-gray-400 mt-2 line-clamp-1">{hub.address || 'No specific address'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEditClick(hub, e)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteHub(hub.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{employeeCount}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Staff</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Add Hub Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white/10">
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-xl uppercase tracking-tight">{editingHubId ? 'Edit Hub Location' : 'New Hub Location'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <form id="hub-form" onSubmit={handleAddHub} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hub Name</label>
                  <input required type="text" value={newHub.name} onChange={(e: any) => setNewHub({...newHub, name: e.target.value})} className="input-field w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800" placeholder="e.g. South Metro Hub" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Location</label>
                    <input required type="text" value={newHub.location} onChange={(e: any) => setNewHub({...newHub, location: e.target.value})} className="input-field w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">City</label>
                    <input required type="text" value={newHub.city} onChange={(e: any) => setNewHub({...newHub, city: e.target.value})} className="input-field w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Address</label>
                  <input required type="text" value={newHub.address} onChange={(e: any) => setNewHub({...newHub, address: e.target.value})} className="input-field w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-800">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Latitude</label>
                    <input required type="number" step="any" value={newHub.latitude} onChange={(e: any) => setNewHub({...newHub, latitude: parseFloat(e.target.value)})} className="input-field w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Longitude</label>
                    <input required type="number" step="any" value={newHub.longitude} onChange={(e: any) => setNewHub({...newHub, longitude: parseFloat(e.target.value)})} className="input-field w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-800 dark:bg-gray-800" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
              <button type="submit" form="hub-form" disabled={createHubMutation.isPending || updateHubMutation.isPending} className="px-8 py-2.5 bg-red-600 text-white rounded-xl font-black text-sm shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2">
                {(createHubMutation.isPending || updateHubMutation.isPending) && <LoadingSpinner size="sm" />}
                {editingHubId ? 'Update Hub' : 'Create Hub'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
