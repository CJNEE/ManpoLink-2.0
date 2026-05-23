import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Badge,
  LoadingSpinner,
  EmptyState,
} from '@/components/common';

import {
  useGetEmployees,
  useGetHubs,
} from '@/hooks/useQueries';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';

import {
  Search,
  Eye,
  X,
  User,
  Phone,
  Briefcase,
  Shield,
  Landmark,
  Clock,
} from 'lucide-react';

import {
  normalizeApiResponse,
} from '@/utils/apiResponseHandler';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import HubsEmployeeChart from '@/components/HubsEmployeeChart';

import type {
  Employee as AppEmployee,
  Hub as AppHub,
} from '@/types';

const STATUS_COLORS: Record<string, string> = {
  Active: '#10B981',
  AWOL: '#F59E0B',
  Blacklist: '#EF4444',
  Resign: '#3B82F6',
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#1E40AF',
  'Full time': '#1E40AF',
  OCW: '#3B82F6',
};

function FitBoundsComponent({
  mapHubs,
  getCoords,
}: {
  mapHubs: AppHub[];
  getCoords: (hub: AppHub) => [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (mapHubs.length > 0) {
      const bounds = L.latLngBounds(
        mapHubs.map((hub) => getCoords(hub))
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
        });
      }
    }
  }, [mapHubs, map, getCoords]);

  return null;
}

export const AdminDashboard = () => {
  const { employee } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchHubTerm, setSearchHubTerm] = useState('');
  const [searchLocationTerm, setSearchLocationTerm] =
    useState('');

  const [selectedEmployee, setSelectedEmployee] =
    useState<AppEmployee | null>(null);

  const [showEmployeeModal, setShowEmployeeModal] =
    useState(false);

  const employeesQuery = useGetEmployees({});
  const hubsQuery = useGetHubs();

  const isLoading =
    employeesQuery.isLoading || hubsQuery.isLoading;

  const allEmployees = useMemo<AppEmployee[]>(() => {
    return normalizeApiResponse(
      employeesQuery.data
    ) as AppEmployee[];
  }, [employeesQuery.data]);

  const hubs = useMemo<AppHub[]>(() => {
    return normalizeApiResponse(
      hubsQuery.data
    ) as AppHub[];
  }, [hubsQuery.data]);

  const employees = useMemo<AppEmployee[]>(() => {
    return allEmployees.filter((emp) => {
      const fullName =
        emp.full_name?.toLowerCase() || '';

      const employeeId =
        emp.employee_id?.toLowerCase() || '';

      return (
        fullName.includes(searchTerm.toLowerCase()) ||
        employeeId.includes(searchTerm.toLowerCase())
      );
    });
  }, [allEmployees, searchTerm]);

  const totalEmployees = allEmployees.length;

  const activeEmployees = allEmployees.filter(
    (emp) => emp.status === 'Active'
  ).length;

  const statusData = useMemo(() => {
    const statuses: Record<string, number> = {};

    allEmployees.forEach((emp) => {
      const status = emp.status || 'Unknown';

      statuses[status] = (statuses[status] || 0) + 1;
    });

    return Object.entries(statuses).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [allEmployees]);

  const employmentTypeData = useMemo(() => {
    const types: Record<string, number> = {};

    allEmployees.forEach((emp) => {
      const type =
        emp.employment_type || 'Unknown';

      types[type] = (types[type] || 0) + 1;
    });

    return Object.entries(types).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [allEmployees]);

  const cityCoords: Record<
    string,
    [number, number]
  > = {
    manila: [14.5995, 120.9842],
    quezon: [14.676, 121.0437],
    cebu: [10.3157, 123.8854],
    davao: [7.0731, 125.6128],
    pampanga: [15.0794, 120.62],
  };

  const getHubCoordinates = (
    hub: AppHub
  ): [number, number] => {
    if (
      typeof hub.latitude === 'number' &&
      typeof hub.longitude === 'number'
    ) {
      return [hub.latitude, hub.longitude];
    }

    const city =
      hub.city?.toLowerCase() || '';

    for (const [key, coords] of Object.entries(
      cityCoords
    )) {
      if (city.includes(key)) {
        return coords;
      }
    }

    return [12.8797, 121.774];
  };

  const hubIcon = L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div class="relative flex items-center justify-center" style="width:32px;height:32px;">
        <div class="w-7 h-7 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <Sidebar
        open={sidebarOpen}
        onToggle={() =>
          setSidebarOpen(!sidebarOpen)
        }
      />

      <div className="lg:ml-64 p-3 sm:p-4 md:p-6 space-y-5">
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {employee?.role === 'HR'
                ? 'HR overview'
                : 'Admin overview'}
            </p>
          </div>
        </div>

        {/* MOBILE RESPONSIVE STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <Card className="p-4 rounded-2xl">
            <p className="text-xs uppercase font-bold text-gray-500">
              Employees
            </p>

            <h2 className="text-4xl font-black mt-3 text-red-700 dark:text-white">
              {totalEmployees}
            </h2>
          </Card>

          <Card className="p-4 rounded-2xl">
            <p className="text-xs uppercase font-bold text-gray-500">
              Active
            </p>

            <h2 className="text-4xl font-black mt-3 text-green-600">
              {activeEmployees}
            </h2>
          </Card>

          <Card className="col-span-2 xl:col-span-1 p-4 rounded-2xl">
            <p className="text-xs uppercase font-bold text-gray-500 mb-3">
              Employment Type
            </p>

            <div className="space-y-3">
              {employmentTypeData.map((item) => {
                const max = Math.max(
                  ...employmentTypeData.map(
                    (d) => d.value
                  ),
                  1
                );

                const width =
                  (item.value / max) * 100;

                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.name}</span>
                      <span>{item.value}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor:
                            EMPLOYMENT_TYPE_COLORS[
                              item.name
                            ] || '#3B82F6',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="col-span-2 p-4 rounded-2xl">
            <p className="text-xs uppercase font-bold text-gray-500 mb-3">
              Workforce Status
            </p>

            <div className="grid grid-cols-2 gap-3">
              {statusData.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-3"
                >
                  <p className="text-xs text-gray-500">
                    {item.name}
                  </p>

                  <h3
                    className="text-2xl font-black mt-1"
                    style={{
                      color:
                        STATUS_COLORS[item.name] ||
                        '#3B82F6',
                    }}
                  >
                    {item.value}
                  </h3>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* MAP + CHART */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* MAP */}
          <Card className="overflow-hidden rounded-2xl p-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold">
                  Hub Locations
                </h2>

                <div className="relative w-full sm:max-w-xs">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Search location..."
                    value={searchLocationTerm}
                    onChange={(e) =>
                      setSearchLocationTerm(
                        e.target.value
                      )
                    }
                    className="input-field pl-10 text-sm w-full"
                  />
                </div>
              </div>
            </div>

            <div className="h-[350px] sm:h-[450px]">
              <MapContainer
                center={[12.8797, 121.774]}
                zoom={6}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              >
                <FitBoundsComponent
                  mapHubs={hubs}
                  getCoords={getHubCoordinates}
                />

                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="OpenStreetMap"
                />

                {hubs
                  .filter((hub) => {
                    const search =
                      searchLocationTerm.toLowerCase();

                    return (
                      !search ||
                      hub.name
                        ?.toLowerCase()
                        .includes(search) ||
                      hub.city
                        ?.toLowerCase()
                        .includes(search)
                    );
                  })
                  .map((hub) => {
                    const coords =
                      getHubCoordinates(hub);

                    return (
                      <Marker
                        key={hub.id}
                        position={coords}
                        icon={hubIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-bold">
                              {hub.name}
                            </p>

                            <p>
                              {hub.city ||
                                hub.location}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>
          </Card>

          {/* HUB CHART */}
          <Card className="rounded-2xl p-4">
            <h2 className="text-lg font-bold mb-4">
              Hub Employee Distribution
            </h2>

            <div className="h-[400px]">
              <HubsEmployeeChart
                hubsData={hubs}
                employees={allEmployees}
              />
            </div>
          </Card>
        </div>

        {/* EMPLOYEE TABLE */}
        <Card className="p-4 rounded-2xl">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-bold">
              Employees
            </h2>

            <div className="relative w-full md:max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="input-field pl-10 text-sm w-full"
              />
            </div>
          </div>

          {employees.length > 0 ? (
            <>
              {/* MOBILE CARDS */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {employees
                  .slice(0, 10)
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-base">
                            {emp.full_name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            {emp.position}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {emp.hub_name}
                          </p>
                        </div>

                        <Badge
                          variant={
                            emp.status === 'Active'
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {emp.status}
                        </Badge>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedEmployee(
                            emp
                          );

                          setShowEmployeeModal(
                            true
                          );
                        }}
                        className="mt-4 w-full rounded-xl bg-red-700 hover:bg-red-800 text-white py-2 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View Employee
                      </button>
                    </div>
                  ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-red-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        Name
                      </th>

                      <th className="px-4 py-3 text-left">
                        Position
                      </th>

                      <th className="px-4 py-3 text-left">
                        Hub
                      </th>

                      <th className="px-4 py-3 text-left">
                        Status
                      </th>

                      <th className="px-4 py-3 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees
                      .slice(0, 10)
                      .map((emp) => (
                        <tr
                          key={emp.id}
                          className="border-b dark:border-gray-800"
                        >
                          <td className="px-4 py-3 font-medium">
                            {emp.full_name}
                          </td>

                          <td className="px-4 py-3">
                            {emp.position}
                          </td>

                          <td className="px-4 py-3">
                            {emp.hub_name}
                          </td>

                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                emp.status ===
                                'Active'
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {emp.status}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedEmployee(
                                  emp
                                );

                                setShowEmployeeModal(
                                  true
                                );
                              }}
                              className="text-blue-600 font-semibold inline-flex items-center gap-1"
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
            </>
          ) : (
            <EmptyState title="No employees found" />
          )}
        </Card>

        {/* HUBS TABLE */}
        <Card className="p-4 rounded-2xl">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
            <h2 className="text-lg font-bold">
              Hubs
            </h2>

            <input
              type="text"
              placeholder="Search hubs..."
              value={searchHubTerm}
              onChange={(e) =>
                setSearchHubTerm(e.target.value)
              }
              className="input-field text-sm w-full md:max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-700 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Hub
                  </th>

                  <th className="px-4 py-3 text-left">
                    Location
                  </th>

                  <th className="px-4 py-3 text-left">
                    Employees
                  </th>
                </tr>
              </thead>

              <tbody>
                {hubs
                  .filter((hub) => {
                    const search =
                      searchHubTerm.toLowerCase();

                    return (
                      !search ||
                      hub.name
                        ?.toLowerCase()
                        .includes(search)
                    );
                  })
                  .map((hub) => {
                    const count =
                      allEmployees.filter(
                        (emp) =>
                          emp.hub === hub.id
                      ).length;

                    return (
                      <tr
                        key={hub.id}
                        className="border-b dark:border-gray-800"
                      >
                        <td className="px-4 py-3 font-medium">
                          {hub.name}
                        </td>

                        <td className="px-4 py-3">
                          {hub.location ||
                            hub.city}
                        </td>

                        <td className="px-4 py-3 font-bold text-red-700">
                          {count}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* EMPLOYEE MODAL */}
        {showEmployeeModal &&
          selectedEmployee && (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl overflow-hidden max-h-[95vh] flex flex-col">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-red-800 to-red-700 p-6 text-white relative">
                  <button
                    onClick={() =>
                      setShowEmployeeModal(
                        false
                      )
                    }
                    className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl font-black">
                      {selectedEmployee.full_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-2xl font-black">
                        {
                          selectedEmployee.full_name
                        }
                      </h2>

                      <p className="text-red-100 mt-1">
                        {
                          selectedEmployee.position
                        }
                      </p>

                      <div className="mt-3">
                        <Badge
                          variant={
                            selectedEmployee.status ===
                            'Active'
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {
                            selectedEmployee.status
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* PERSONAL */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <User
                        size={18}
                        className="text-red-600"
                      />

                      <h3 className="font-black uppercase text-sm">
                        Personal Info
                      </h3>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          Full Name
                        </p>

                        <p className="font-semibold">
                          {
                            selectedEmployee.full_name
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          Email
                        </p>

                        <p className="font-semibold break-all">
                          {
                            selectedEmployee.email_address
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          Phone
                        </p>

                        <p className="font-semibold">
                          {
                            selectedEmployee.phone_number
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* EMPLOYMENT */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Briefcase
                        size={18}
                        className="text-red-600"
                      />

                      <h3 className="font-black uppercase text-sm">
                        Employment
                      </h3>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          Position
                        </p>

                        <p className="font-semibold">
                          {
                            selectedEmployee.position
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          Employment Type
                        </p>

                        <p className="font-semibold">
                          {
                            selectedEmployee.employment_type
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          Hub
                        </p>

                        <p className="font-semibold">
                          {
                            selectedEmployee.hub_name
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* GOVERNMENT */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Landmark
                        size={18}
                        className="text-red-600"
                      />

                      <h3 className="font-black uppercase text-sm">
                        Government IDs
                      </h3>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          TIN
                        </p>

                        <p className="font-semibold">
                          {selectedEmployee.tin}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase">
                          SSS
                        </p>

                        <p className="font-semibold">
                          {selectedEmployee.sss}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SYSTEM */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <Shield
                        size={18}
                        className="text-red-600"
                      />

                      <h3 className="font-black uppercase text-sm">
                        System Access
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Can Login
                        </span>

                        <Badge
                          variant={
                            selectedEmployee.can_login
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {selectedEmployee.can_login
                            ? 'Allowed'
                            : 'Denied'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Active
                        </span>

                        <Badge
                          variant={
                            selectedEmployee.is_active
                              ? 'success'
                              : 'danger'
                          }
                        >
                          {selectedEmployee.is_active
                            ? 'Yes'
                            : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* ATTENDANCE */}
                  {selectedEmployee.latest_clock_in_out && (
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 lg:col-span-2">
                      <div className="flex items-center gap-2 mb-5">
                        <Clock
                          size={18}
                          className="text-red-600"
                        />

                        <h3 className="font-black uppercase text-sm">
                          Attendance
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs uppercase">
                            Clock In
                          </p>

                          <p className="font-semibold">
                            {
                              selectedEmployee
                                .latest_clock_in_out
                                .clock_in
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs uppercase">
                            Clock Out
                          </p>

                          <p className="font-semibold">
                            {
                              selectedEmployee
                                .latest_clock_in_out
                                .clock_out
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};