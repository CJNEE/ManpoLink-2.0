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

import {
  Search,
  Eye,
  X,
  Menu,
  User,
  Phone,
  Briefcase,
  Shield,
  Landmark,
} from 'lucide-react';

import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

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

type Employee = {
  id: number;
  full_name: string;
  employee_id: string;
  position: string;
  hub_name?: string;
  hub?: number;
  status: string;
  employment_type?: string;
  email_address?: string;
  phone_number?: string;
  current_address?: string;
  gender?: string;
  nationality?: string;
};

type Hub = {
  id: number;
  name: string;
  location?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

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

const cityCoords: Record<string, [number, number]> = {
  manila: [14.5995, 120.9842],
  quezon: [14.676, 121.0437],
  cebu: [10.3157, 123.8854],
  davao: [7.0731, 125.6128],
  pampanga: [15.0794, 120.62],
};

function FitBoundsComponent({
  hubs,
  getCoords,
}: {
  hubs: Hub[];
  getCoords: (hub: Hub) => [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (hubs.length > 0) {
      const bounds = L.latLngBounds(
        hubs.map((hub) => getCoords(hub))
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [40, 40],
        });
      }
    }
  }, [hubs, map, getCoords]);

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
    useState<Employee | null>(null);

  const [showEmployeeModal, setShowEmployeeModal] =
    useState(false);

  const employeesQuery = useGetEmployees({});
  const hubsQuery = useGetHubs();

  const isLoading =
    employeesQuery.isLoading || hubsQuery.isLoading;

  const allEmployees: Employee[] = useMemo(() => {
    return normalizeApiResponse(
      employeesQuery.data
    ) as Employee[];
  }, [employeesQuery.data]);

  const hubs: Hub[] = useMemo(() => {
    return normalizeApiResponse(hubsQuery.data) as Hub[];
  }, [hubsQuery.data]);

  const employees = useMemo(() => {
    return allEmployees.filter((emp) => {
      const search = searchTerm.toLowerCase();

      return (
        emp.full_name
          ?.toLowerCase()
          .includes(search) ||
        emp.employee_id
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [allEmployees, searchTerm]);

  const totalEmployees = allEmployees.length;
  const totalHubs = hubs.length;

  const activeEmployees = allEmployees.filter(
    (emp) => emp.status === 'Active'
  ).length;

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};

    allEmployees.forEach((emp) => {
      map[emp.status] = (map[emp.status] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [allEmployees]);

  const employmentTypeData = useMemo(() => {
    const map: Record<string, number> = {};

    allEmployees.forEach((emp) => {
      const type = emp.employment_type || 'Unknown';

      map[type] = (map[type] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [allEmployees]);

  const getHubCoordinates = (
    hub: Hub
  ): [number, number] => {
    if (hub.latitude && hub.longitude) {
      return [hub.latitude, hub.longitude];
    }

    const city = hub.city?.toLowerCase() || '';

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
        <div class="absolute w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
        <div class="relative w-7 h-7 bg-red-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
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

      <div className="lg:ml-64">
        {/* MOBILE HEADER */}
        <div className="sticky top-0 z-40 lg:hidden border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
              className="w-11 h-11 rounded-2xl bg-red-700 text-white flex items-center justify-center shadow-lg"
            >
              <Menu size={20} />
            </button>

            <div className="text-right">
              <h1 className="font-black text-lg">
                Dashboard
              </h1>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                3PL Business Solutions
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* DESKTOP HEADER */}
          <div className="hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black">
                Dashboard
              </h1>

              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {employee?.role === 'HR'
                  ? 'HR Overview'
                  : 'Admin Overview'}
              </p>
            </div>
          </div>

          {/* MOBILE HERO */}
          <div className="lg:hidden rounded-[30px] overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-black p-5 shadow-2xl relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-white">
              <p className="text-red-100 text-sm">
                Welcome back
              </p>

              <h2 className="text-2xl font-black mt-1">
                {employee?.full_name || 'Admin'}
              </h2>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-2xl bg-white/10 backdrop-blur p-3 text-center">
                  <p className="text-[10px] text-red-100">
                    Employees
                  </p>

                  <h3 className="text-2xl font-black mt-1">
                    {totalEmployees}
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur p-3 text-center">
                  <p className="text-[10px] text-red-100">
                    Hubs
                  </p>

                  <h3 className="text-2xl font-black mt-1">
                    {totalHubs}
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur p-3 text-center">
                  <p className="text-[10px] text-red-100">
                    Active
                  </p>

                  <h3 className="text-2xl font-black mt-1">
                    {activeEmployees}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className="rounded-3xl border-0 shadow-xl p-4">
              <p className="text-[11px] uppercase font-bold text-gray-500">
                Employees
              </p>

              <h2 className="mt-3 text-4xl lg:text-6xl font-black text-red-700 dark:text-white">
                {totalEmployees}
              </h2>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl p-4">
              <p className="text-[11px] uppercase font-bold text-gray-500">
                Hubs
              </p>

              <h2 className="mt-3 text-4xl lg:text-6xl font-black text-red-700 dark:text-white">
                {totalHubs}
              </h2>
            </Card>

            <Card className="col-span-2 lg:col-span-1 rounded-3xl border-0 shadow-xl p-4">
              <p className="text-sm font-bold mb-4">
                Employee Status
              </p>

              <div className="flex items-center justify-between">
                <ResponsiveContainer
                  width="50%"
                  height={90}
                >
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={18}
                      outerRadius={35}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            STATUS_COLORS[
                              entry.name
                            ] || '#3B82F6'
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-1 text-xs">
                  {statusData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[
                              item.name
                            ] || '#3B82F6',
                        }}
                      />

                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="col-span-2 lg:col-span-1 rounded-3xl border-0 shadow-xl p-4">
              <p className="text-sm font-bold mb-4">
                Employment Type
              </p>

              <div className="space-y-4">
                {employmentTypeData.map((item) => {
                  const maxValue = Math.max(
                    ...employmentTypeData.map(
                      (d) => d.value
                    ),
                    1
                  );

                  const width =
                    (item.value / maxValue) * 100;

                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{item.name}</span>

                        <span>{item.value}</span>
                      </div>

                      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
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

            <Card className="rounded-3xl border-0 shadow-xl p-4">
              <p className="text-sm font-bold mb-3">
                Workforce
              </p>

              <div className="space-y-2">
                {statusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-500">
                      {item.name}
                    </span>

                    <span
                      className="font-black text-lg"
                      style={{
                        color:
                          STATUS_COLORS[
                            item.name
                          ] || '#3B82F6',
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* MAP + CHART */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* MAP */}
            <Card className="overflow-hidden rounded-3xl border-0 shadow-xl p-0">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                  <h2 className="font-black text-lg">
                    Hub Locations
                  </h2>

                  <div className="relative w-full sm:w-72">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={searchLocationTerm}
                      onChange={(e) =>
                        setSearchLocationTerm(
                          e.target.value
                        )
                      }
                      className="input-field pl-10 rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              <div className="h-[350px] lg:h-[500px]">
                <MapContainer
                  center={[12.8797, 121.774]}
                  zoom={6}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <FitBoundsComponent
                    hubs={hubs}
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
                        !searchLocationTerm ||
                        hub.name
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

                              <p className="text-gray-500">
                                {hub.location ||
                                  hub.city}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                </MapContainer>
              </div>
            </Card>

            {/* CHART */}
            <Card className="rounded-3xl border-0 shadow-xl p-4">
              <h2 className="font-black text-lg mb-4">
                Hub Employee Distribution
              </h2>

              <div className="h-[350px] lg:h-[500px]">
                <HubsEmployeeChart
                  hubsData={hubs}
                  employees={allEmployees}
                />
              </div>
            </Card>
          </div>

          {/* EMPLOYEES */}
          <Card className="rounded-3xl border-0 shadow-xl p-4">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between mb-5">
              <h2 className="font-black text-lg">
                Employees
              </h2>

              <div className="relative w-full lg:w-80">
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
                  className="input-field pl-10 rounded-2xl"
                />
              </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="lg:hidden space-y-3">
              {employees.slice(0, 10).map((emp) => (
                <div
                  key={emp.id}
                  className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-sm">
                        {emp.full_name}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        {emp.position}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {emp.hub_name || 'No Hub'}
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
                      setSelectedEmployee(emp);
                      setShowEmployeeModal(true);
                    }}
                    className="mt-4 h-11 w-full rounded-2xl bg-red-700 hover:bg-red-800 text-white font-bold flex items-center justify-center gap-2 transition-all"
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
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employees.slice(0, 10).map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-4 font-semibold">
                        {emp.full_name}
                      </td>

                      <td className="px-4 py-4">
                        {emp.position}
                      </td>

                      <td className="px-4 py-4">
                        {emp.hub_name}
                      </td>

                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            emp.status === 'Active'
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {emp.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowEmployeeModal(true);
                          }}
                          className="mx-auto flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* EMPLOYEE MODAL */}
      {showEmployeeModal && selectedEmployee && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center"
          onClick={() =>
            setShowEmployeeModal(false)
          }
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 w-full lg:max-w-4xl rounded-t-[32px] lg:rounded-3xl overflow-y-auto max-h-[95vh]"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-red-700 to-black p-5 text-white rounded-t-[32px] lg:rounded-t-3xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black">
                    {selectedEmployee.full_name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      {selectedEmployee.full_name}
                    </h2>

                    <p className="text-red-100 mt-1">
                      {selectedEmployee.position}
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
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setShowEmployeeModal(false)
                  }
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* PERSONAL */}
              <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <User
                    size={18}
                    className="text-red-600"
                  />

                  <h3 className="font-black">
                    Personal Info
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Full Name
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.full_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Gender
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.gender ||
                        'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Nationality
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.nationality ||
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTACT */}
              <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Phone
                    size={18}
                    className="text-red-600"
                  />

                  <h3 className="font-black">
                    Contact Info
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Email
                    </p>

                    <p className="font-semibold mt-1 break-all">
                      {selectedEmployee.email_address ||
                        'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Phone
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.phone_number ||
                        'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Address
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.current_address ||
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* EMPLOYMENT */}
              <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Briefcase
                    size={18}
                    className="text-red-600"
                  />

                  <h3 className="font-black">
                    Employment
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Position
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.position}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Employment Type
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.employment_type ||
                        'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Hub
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.hub_name ||
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECURITY */}
              <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Shield
                    size={18}
                    className="text-red-600"
                  />

                  <h3 className="font-black">
                    Security
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Employee ID
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.employee_id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Status
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase text-gray-400">
                      Hub Assignment
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedEmployee.hub_name ||
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};