import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, Loader2, MapPin, Eye } from 'lucide-react';
import apiClient from '@/api/apiService';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Hub {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
}

interface HubsMapWithDirectionsProps {
  hubs: Hub[];
  onHubSelect?: (hub: Hub) => void;
}

interface Employee {
  id: number;
  full_name: string;
  position: string;
  status: string;
  employment_type: string;
}

export const HubsMapWithDirections: React.FC<HubsMapWithDirectionsProps> = ({
  hubs,
  onHubSelect,
}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const mapRef = useRef(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to Metro Manila center
          setUserLocation([14.5995, 120.9842]);
        }
      );
    }
  }, []);

  // Fetch employees for the selected hub
  const fetchEmployeesForHub = async (hubId: number) => {
    setLoadingEmployees(true);
    try {
      const response = await apiClient.get(`/employees/?hub_id=${hubId}`);
      if (response.data?.results) {
        setEmployees(response.data.results);
      } else if (Array.isArray(response.data)) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleHubMarkerClick = (hub: Hub) => {
    setSelectedHub(hub);
    fetchEmployeesForHub(hub.id);
    onHubSelect?.(hub);
  };

  const mapCenter = userLocation || [14.5995, 120.9842];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        className="z-10"
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.icon({
              iconUrl:
                'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzQjgyRjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjwvc3ZnPg==',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Hub Markers */}
        {hubs.map((hub) => (
          <Marker
            key={hub.id}
            position={[hub.latitude, hub.longitude]}
            icon={
              selectedHub?.id === hub.id
                ? L.icon({
                    iconUrl:
                      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNFRjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOSAtNiAtOSAtMTNhOSA5IDAgMCAxIDE4IDAiLz48L3N2Zz4=',
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                  })
                : L.icon({
                    iconUrl:
                      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGIyNzUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOSAtNiAtOSAtMTNhOSA5IDAgMCAxIDE4IDAiLz48L3N2Zz4=',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                  })
            }
            eventHandlers={{
              click: () => handleHubMarkerClick(hub),
            }}
          >
            <Popup>
              <div className="font-semibold">{hub.name}</div>
              <div className="text-xs text-gray-600">{hub.address}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Hub Employee List Panel */}
      {selectedHub && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 z-20 relative">
          {/* Hub Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedHub.name} Employees
              </h3>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                <MapPin size={16} />
                <span>{selectedHub.address}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedHub(null);
                setEmployees([]);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Employee Count */}
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Total Employees: <span className="text-lg">{employees.length}</span>
            </p>
          </div>

          {/* Loading State */}
          {loadingEmployees && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading employees...</span>
            </div>
          )}

          {/* Employee Table */}
          {!loadingEmployees && employees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{emp.full_name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.position}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          emp.status?.toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : emp.status?.toLowerCase() === 'resign'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loadingEmployees && employees.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No employees found for this hub</p>
            </div>
          )}
        </div>
      )}

      {/* Info Message */}
      {!selectedHub && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            Click on a hub marker to view employees for that location.
          </div>
        </div>
      )}
    </div>
  );
};
