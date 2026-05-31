import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import { LoadingSpinner } from '@/components/common';

import {
  useGetHubs,
  useGetEmployees,
  useCreateHub,
  useUpdateHub,
  useDeleteHub,
} from '@/hooks/useQueries';

import {
  MapPin,
  X,
  Search,
  Navigation,
  Users,
  Footprints,
  Bike,
  Car,
  Plus,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  Edit3,
  Trash2,
  AlertTriangle,
  Map,
  MoreVertical,
  Globe,
  Hash,
} from 'lucide-react';
import { User, ChevronDown, Sun, Moon, LogOut } from 'lucide-react';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Sidebar from '@/components/Sidebar';
import { fetchWeather } from '@/utils/weather';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeToggle } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
// ======================================
// CONSTANTS
// ======================================

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const WALKING_SPEED_KMH = 4.8;
const CYCLING_SPEED_KMH = 15;
const DRIVING_SPEED_KMH = 35;

// ======================================
// TYPES
// ======================================

interface Hub {
  id: number;
  name: string;
  location?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface Employee {
  id: number;
  hub: number;
  full_name?: string;
  position?: string;
  status?: string;
}

interface WeatherData {
  temp: number;
  label: string;
  icon: string;
}

interface HubState {
  selectedHub: Hub | null;
}

type ParsedOsrmRoute = {
  coordinates: [number, number][];
  distanceM: number;
  durationSec: number;
  turns: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
  turnCount: number;
};

interface HubFormData {
  name: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
}

const emptyFormData: HubFormData = {
  name: '',
  city: '',
  address: '',
  latitude: '',
  longitude: '',
};

// ======================================
// UTILITIES
// ======================================

function estimateTravelTime(distanceMeters: number, speedKmH: number) {
  const km = distanceMeters / 1000;
  const hours = km / speedKmH;
  return Math.round(hours * 3600);
}

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

// ======================================
// PARSE OSRM
// ======================================

function parseOsrmResponse(
  data: any,
  mode: 'walking' | 'cycling' | 'driving'
): ParsedOsrmRoute | null {
  if (!data?.routes?.length) return null;

  const route = data.routes[0];
  const coordinates: [number, number][] =
    route.geometry.coordinates.map((coord: [number, number]) => [
      coord[1],
      coord[0],
    ]);

  const turns: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }> = [];
  let turnCount = 0;

  route.legs?.forEach((leg: any) => {
    leg.steps?.forEach((step: any) => {
      const instr = step.maneuver?.instruction;
      if (instr) {
        turns.push({
          instruction: instr,
          distance: Math.round(step.distance ?? 0),
          duration: Math.round(step.duration ?? 0),
        });
      }
      const t = step.maneuver?.type;
      if (t && t !== 'depart' && t !== 'arrive') {
        turnCount += 1;
      }
    });
  });

  let duration = route.duration;
  if (mode === 'walking') duration = estimateTravelTime(route.distance, WALKING_SPEED_KMH);
  if (mode === 'cycling') duration = estimateTravelTime(route.distance, CYCLING_SPEED_KMH);
  if (mode === 'driving') duration = estimateTravelTime(route.distance, DRIVING_SPEED_KMH);

  return { coordinates, distanceM: route.distance, durationSec: duration, turns, turnCount };
}

// ======================================
// FETCH ROUTE
// ======================================

async function fetchOsrmProfile(
  profile: string,
  mode: 'walking' | 'cycling' | 'driving',
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<ParsedOsrmRoute | null> {
  const url =
    `${OSRM_BASE}/${profile}/${startLon},${startLat};${endLon},${endLat}` +
    `?steps=true&geometries=geojson&overview=full`;
  const response = await fetch(url);
  const data = await response.json();
  return parseOsrmResponse(data, mode);
}

// ======================================
// SUB-COMPONENTS
// ======================================

/** Loading skeleton card */
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-5 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-4 w-3/5 bg-gray-200 dark:bg-white/10 rounded-lg" />
        <div className="h-3 w-2/5 bg-gray-200 dark:bg-white/10 rounded-lg" />
        <div className="h-3 w-4/5 bg-gray-100 dark:bg-white/[0.06] rounded-lg" />
      </div>
      <div className="h-12 w-12 bg-gray-200 dark:bg-white/10 rounded-xl ml-4" />
    </div>
  </div>
);

/** Overlay backdrop */
const Backdrop = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  >
    {children}
  </motion.div>
);

/** Modal shell */
const ModalShell = ({
  children,
  onClose,
  maxWidth = 'max-w-lg',
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) => (
  <Backdrop onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 12 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={(e) => e.stopPropagation()}
      className={`${maxWidth}
      w-full
      max-h-[90vh]
      overflow-y-auto
      rounded-3xl
      bg-white
      dark:bg-[#0c1425]
      border border-gray-200
      dark:border-white/[0.08]
      shadow-2xl
      overflow-hidden
      `}
      >
      {children}
    </motion.div>
  </Backdrop>
);

/** Form input field */
const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  icon?: React.ComponentType<any>;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div
className="
relative
backdrop-blur-xl
"
>
      {Icon && (
        <Icon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] ${
          Icon ? 'pl-10' : 'pl-3.5'
        } pr-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 dark:focus:border-red-500 transition-all`}
      />
    </div>
  </div>
);

// ======================================
// ADD HUB MODAL
// ======================================

const AddHubModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState<HubFormData>({ ...emptyFormData });
  const createHub = useCreateHub();

  const updateField = (field: keyof HubFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Hub name is required');
      return;
    }
    try {
      await createHub.mutateAsync({
        name: formData.name,
        city: formData.city || undefined,
        address: formData.address || undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      });
      toast.success('Hub created successfully');
      setFormData({ ...emptyFormData });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create hub');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Plus size={18} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add New Hub
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <FormField
            label="Hub Name"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            placeholder="e.g. Lucena Hub Del Center"
            required
            icon={Building2}
          />
          <FormField
            label="City"
            value={formData.city}
            onChange={(v) => updateField('city', v)}
            placeholder="e.g. Lucena City"
            icon={Globe}
          />
          <FormField
            label="Address"
            value={formData.address}
            onChange={(v) => updateField('address', v)}
            placeholder="Full street address"
            icon={MapPin}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Latitude"
              value={formData.latitude}
              onChange={(v) => updateField('latitude', v)}
              placeholder="e.g. 13.9345"
              type="number"
              icon={Hash}
            />
            <FormField
              label="Longitude"
              value={formData.longitude}
              onChange={(v) => updateField('longitude', v)}
              placeholder="e.g. 121.6161"
              type="number"
              icon={Hash}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createHub.isPending}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {createHub.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Plus size={16} />
                Create Hub
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ======================================
// EDIT HUB MODAL
// ======================================

const EditHubModal = ({
  hub,
  onClose,
}: {
  hub: Hub | null;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState<HubFormData>({ ...emptyFormData });
  const updateHub = useUpdateHub();

  useEffect(() => {
    if (hub) {
      setFormData({
        name: hub.name || '',
        city: hub.city || '',
        address: hub.address || '',
        latitude: hub.latitude?.toString() || '',
        longitude: hub.longitude?.toString() || '',
      });
    }
  }, [hub]);

  const updateField = (field: keyof HubFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hub) return;
    if (!formData.name.trim()) {
      toast.error('Hub name is required');
      return;
    }
    try {
      await updateHub.mutateAsync({
        id: hub.id,
        data: {
          name: formData.name,
          city: formData.city || undefined,
          address: formData.address || undefined,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        },
      });
      toast.success('Hub updated successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update hub');
    }
  };

  if (!hub) return null;

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Edit3 size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Hub
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <FormField
            label="Hub Name"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            placeholder="e.g. Lucena Hub Del Center"
            required
            icon={Building2}
          />
          <FormField
            label="City"
            value={formData.city}
            onChange={(v) => updateField('city', v)}
            placeholder="e.g. Lucena City"
            icon={Globe}
          />
          <FormField
            label="Address"
            value={formData.address}
            onChange={(v) => updateField('address', v)}
            placeholder="Full street address"
            icon={MapPin}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Latitude"
              value={formData.latitude}
              onChange={(v) => updateField('latitude', v)}
              placeholder="e.g. 13.9345"
              type="number"
              icon={Hash}
            />
            <FormField
              label="Longitude"
              value={formData.longitude}
              onChange={(v) => updateField('longitude', v)}
              placeholder="e.g. 121.6161"
              type="number"
              icon={Hash}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateHub.isPending}
            className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {updateHub.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Edit3 size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ======================================
// DELETE HUB MODAL
// ======================================

const DeleteHubModal = ({
  hub,
  onClose,
}: {
  hub: Hub | null;
  onClose: () => void;
}) => {
  const deleteHub = useDeleteHub();

  const handleDelete = async () => {
    if (!hub) return;
    try {
      await deleteHub.mutateAsync(hub.id);
      toast.success('Hub deleted successfully');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete hub');
    }
  };

  if (!hub) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Delete Hub
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {hub.name}
          </span>
          ? This action cannot be undone and all associated data will be permanently removed.
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-6 py-5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteHub.isPending}
          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {deleteHub.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Trash2 size={16} />
              Delete
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
};

// ======================================
// HUB CARD
// ======================================

const HubCard = ({
  hub,
  employeeCount,
  onSelect,
  onEdit,
  onDelete,
}: {
  hub: Hub;
  employeeCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      onClick={onSelect}
      
      className="
      group relative
      rounded-2xl
      bg-white dark:bg-white/[0.03]
      border border-gray-200 dark:border-white/[0.06]
      hover:border-red-300 dark:hover:border-red-500/30
      p-4 sm:p-5
      cursor-pointer
      transition-all duration-300
      hover:shadow-lg hover:shadow-red-500/[0.04]
      dark:hover:shadow-red-500/[0.06]
      active:scale-[0.98]
      "
      >
      {/* Context menu */}
      <div
  ref={menuRef}
  className="absolute top-4 right-4 z-10"
  onClick={(e) => e.stopPropagation()}
>
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-500"
  >
    <MoreVertical size={16} />
  </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 w-36 rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.1] shadow-xl dark:shadow-black/40 overflow-hidden"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 dark:from-red-500/15 dark:to-rose-500/15 flex items-center justify-center">
          <MapPin size={20} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white leading-snug truncate">
            {hub.name}
          </h3>
          {hub.city && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {hub.city}
            </p>
          )}
          {hub.address && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
              {hub.address}
            </p>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
          </span>
        </div>
        <div
          className={`h-2 w-2 rounded-full ${
            employeeCount > 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      </div>
    </motion.div>
  );
};

// ======================================
// MAIN COMPONENT
// ======================================

export const AdminHubsPage = () => {
  const { user, canViewEmployees, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const itemsPerPage = 8;
  
  useEffect(() => {
  const closeMenu = () => setShowProfileDropdown(false);

  window.addEventListener('click', closeMenu);

  return () => {
    window.removeEventListener('click', closeMenu);
  };
}, []);
  const [hubState, setHubState] = useState<HubState>({ selectedHub: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const [routeData, setRouteData] = useState<{
    walking: ParsedOsrmRoute;
    riding: ParsedOsrmRoute;
    car: ParsedOsrmRoute;
  } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [deletingHub, setDeletingHub] = useState<Hub | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const { data, isLoading } = useGetHubs();
  const { data: employeesData } = useGetEmployees();

  const hubs: Hub[] = normalizeApiResponse(data);
  const allEmployees: Employee[] = normalizeApiResponse(employeesData);

  // ======================================
  // GEOLOCATION
  // ======================================

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  // ======================================
  // CITY COORDS
  // ======================================

  const cityCoords: Record<string, [number, number]> = {
    manila: [14.5995, 120.9842],
    quezon: [14.676, 121.0437],
    cebu: [10.3157, 123.8854],
    davao: [7.0731, 125.6121],
  };

  const getHubCoordinates = useCallback(
    (hub: Hub): [number, number] => {
      if (hub.latitude && hub.longitude) return [hub.latitude, hub.longitude];
      const city = hub.city?.toLowerCase() ?? '';
      return cityCoords[city] || [14.5995, 120.9842];
    },
    []
  );

  // ======================================
  // WEATHER
  // ======================================

  useEffect(() => {
    async function loadWeather() {
      try {
        if (hubState.selectedHub) {
          const coords = getHubCoordinates(hubState.selectedHub);
          const weather = await fetchWeather(coords[0], coords[1]);
          setWeatherData(weather as WeatherData);
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadWeather();
  }, [hubState.selectedHub]);

  // ======================================
  // ICONS
  // ======================================

  const hubIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#ef4444;border-radius:999px;border:3px solid white;box-shadow:0 4px 12px rgba(239,68,68,.4);"></div>`,
        iconSize: [16, 16],
      }),
    []
  );

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#3b82f6;border-radius:999px;border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,.4);"></div>`,
        iconSize: [16, 16],
      }),
    []
  );

  // ======================================
  // FILTER HUBS
  // ======================================

  const filteredHubs = useMemo(() => {
    return hubs.filter(
      (hub: Hub) =>
        hub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hub.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hub.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hubs, searchTerm]);

  const getHubEmployeeCount = useCallback(
    (hubId: number) => allEmployees.filter((emp: Employee) => emp.hub === hubId).length,
    [allEmployees]
  );

  // ======================================
  // EMPLOYEE FILTER
  // ======================================

  const hubEmployeesData = useMemo(() => {
    if (!hubState.selectedHub) return [];
    return allEmployees.filter(
      (emp: Employee) =>
        emp.hub === hubState.selectedHub?.id &&
        (emp.full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
          emp.position?.toLowerCase().includes(employeeSearch.toLowerCase()))
    );
  }, [hubState.selectedHub, employeeSearch, allEmployees]);

  // ======================================
  // EMPLOYMENT BAR DATA
  // ======================================

  const employmentTypeData = useMemo<Array<{ name: string; value: number }>>(() => {
    const counts: Record<string, number> = {};
    hubEmployeesData.forEach((emp: Employee) => {
      const key = emp.position || 'Unassigned';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const entries = Object.entries(counts) as [string, number][];
    return entries.map(([name, value]) => ({ name, value })).slice(0, 5);
  }, [hubEmployeesData]);

  // ======================================
  // PAGINATION
  // ======================================

  const totalPages = Math.ceil(hubEmployeesData.length / itemsPerPage);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return hubEmployeesData.slice(start, start + itemsPerPage);
  }, [hubEmployeesData, currentPage]);

  // ======================================
  // ROUTES
  // ======================================

  const fetchRealRoute = async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
  ) => {
    setLoadingRoute(true);
    try {
      const [walking, riding, car] = await Promise.all([
        fetchOsrmProfile('foot', 'walking', startLat, startLon, endLat, endLon),
        fetchOsrmProfile('cycling', 'cycling', startLat, startLon, endLat, endLon),
        fetchOsrmProfile('driving', 'driving', startLat, startLon, endLat, endLon),
      ]);
      if (walking && riding && car) {
        setRouteData({ walking, riding, car });
        setShowDirections(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleGetDirections = () => {
    if (!userLocation || !hubState.selectedHub) return;
    const coords = getHubCoordinates(hubState.selectedHub);
    fetchRealRoute(userLocation[0], userLocation[1], coords[0], coords[1]);
  };

  const handleMarkerClick = (hub: Hub) => {
    setHubState({ selectedHub: hub });
    setEmployeeSearch('');
    setCurrentPage(1);
  };

  const handleCloseHub = () => {
    setHubState({ selectedHub: null });
    setShowDirections(false);
    setRouteData(null);
  };

  // ======================================
  // LOADING STATE
  // ======================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#020817]">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="lg:ml-64 p-5 lg:p-8 space-y-6">
          {/* Skeleton header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
              <div className="h-4 w-72 bg-gray-100 dark:bg-white/[0.06] rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
          </div>
          {/* Skeleton search */}
          <div className="h-12 bg-gray-200 dark:bg-white/[0.06] rounded-xl animate-pulse" />
          {/* Skeleton map + panel */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-8 h-[500px] bg-gray-200 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
            <div className="xl:col-span-4 h-[500px] bg-gray-200 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ======================================
  // MAIN RENDER
  // ======================================

  return (
    <>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="min-h-screen bg-gray-50 dark:bg-[#020817] lg:ml-64 transition-colors duration-300">
        <div className="
          p-3
          sm:p-5
          lg:p-8
          space-y-5
          max-w-[1600px]
          mx-auto
          "
          >
        <div className="flex items-start justify-between gap-4 mb-2">
  <div>
   <h1
    className="
    text-2xl
    sm:text-3xl
    lg:text-4xl
    font-bold
    leading-tight
    tracking-tight
    text-gray-900
    dark:text-white
    "
    >
      Hub Management
      </h1>

    <p
      className="
      text-xs
      text-gray-500
      dark:text-gray-400
      mt-1
      max-w-[220px]
      leading-relaxed
      "
      >
      Manage hubs, employees and routes across locations
      </p>
  </div>


  {/* MOBILE ADMIN DROPDOWN */}
  <div className="sm:hidden shrink-0">
    <div
  onClick={(e) => {
    e.stopPropagation();
    setShowProfileDropdown((prev) => !prev);
  }}
  className="
  relative
  flex
  items-center
  gap-2
  bg-[#111827]
  px-2.5
  py-1.5
  rounded-full
  border
  border-gray-800
  cursor-pointer
  "
>
      <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
        <User className="w-3 h-3 text-gray-300" />
      </div>

     <span className="text-[11px] font-medium text-gray-300">
        {user?.username || 'Admin'}
      </span>

     <ChevronDown className="w-3 h-3 text-gray-500" />

      {/* dropdown menu */}
      {showProfileDropdown && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="
            absolute
            right-0
            top-full
            mt-2
            w-40
            rounded-2xl
            bg-[#0F172A]
            border
            border-white/10
            shadow-2xl
            p-1.5
            z-[9999]
          "
        >
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-xs font-semibold text-white">
              {user?.username}
            </p>
          
            <p className="text-[10px] uppercase tracking-wider text-gray-500">
              {user?.role}
            </p>
          </div>
      
          <div className="flex items-center justify-between px-2.5 py-2">
            <div className="flex items-center gap-2">
              <Sun size={14} className="text-yellow-400" />
             <span className="text-xs text-white">
              Light Mode
            </span>
            </div>
      
            <ThemeToggle />
          </div>
      
          <button
            onClick={handleLogout}
            className="
            w-full
            flex
            items-center
            gap-2
            px-2.5
            py-2
            text-red-400
            hover:bg-red-500/10
            rounded-xl
            transition
            "
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
          </div>
        </div>
      
        {/* DESKTOP ADD HUB */}
        <button
          onClick={() => setShowAddModal(true)}
          className="
          hidden
          sm:flex
          h-10
          px-5
          rounded-xl
          bg-gradient-to-r
          from-red-500
          to-rose-600
          text-white
          text-sm
          font-semibold
          items-center
          gap-2
          "
        >
          <Plus size={16} />
          Add Hub
        </button>
      
      </div>
        

          {/* ========== SEARCH ========== */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="text"
              placeholder="Search hubs by name, city, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 sm:h-14 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500/50 transition-all"
            />
          </div>

          {/* ========== MAP + SIDE PANEL ========== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* MAP */}
            <div
            className="
            xl:col-span-8
            rounded-3xl
            overflow-hidden
            border border-gray-200
            dark:border-white/[0.06]
            bg-white
            dark:bg-[#0b1220]
            shadow-lg
            "
            >
              <div className="h-[300px] sm:h-[450px] lg:h-[550px]">
                <MapContainer
                  center={[14.5995, 120.9842]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url={
                      isDarkMode
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    }
                  />

                  {userLocation && (
                    <Marker position={userLocation} icon={userIcon}>
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}

                  {filteredHubs.map((hub) => (
                    <Marker
                      key={hub.id}
                      position={getHubCoordinates(hub)}
                      icon={hubIcon}
                      eventHandlers={{ click: () => handleMarkerClick(hub) }}
                    >
                      <Popup>{hub.name}</Popup>
                    </Marker>
                  ))}

                  {showDirections && routeData?.car?.coordinates && (
                    <Polyline
                      positions={routeData.car.coordinates}
                      color="#ef4444"
                      weight={4}
                      opacity={0.8}
                    />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="xl:col-span-4">
              <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] overflow-hidden h-full flex flex-col">
                {hubState.selectedHub ? (
                  <div className="flex flex-col h-full">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-start justify-between">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {hubState.selectedHub.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {hubState.selectedHub.city || 'No city'}
                        </p>
                      </div>
                      <button
                        onClick={handleCloseHub}
                        className="h-8 w-8 shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Panel Content */}
                    <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                      {/* Employee search */}
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                        />
                        <input
                          type="text"
                          placeholder="Search employees..."
                          value={employeeSearch}
                          onChange={(e) => {
                            setEmployeeSearch(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full h-10 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] pl-10 pr-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 dark:focus:border-red-500/50 transition-all"
                        />
                      </div>

                      {/* Weather */}
                      {weatherData && (
                        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-white dark:bg-white/[0.06] flex items-center justify-center text-2xl shadow-sm">
                              {weatherData.icon}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Current Weather
                              </p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">
                                {weatherData.temp}°C
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {weatherData.label}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Employment breakdown */}
                        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                            Positions
                          </p>
                          <div className="space-y-2.5">
                            {employmentTypeData.length > 0 ? (
                              employmentTypeData.map((item) => {
                                const total = hubEmployeesData.length || 1;
                                const width = (item.value / total) * 100;
                                return (
                                  <div key={item.name}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                        {item.name}
                                      </span>
                                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-2">
                                        {item.value}
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${width}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                                      />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                No data
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Total employees */}
                        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-4 flex flex-col items-center justify-center">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Total
                          </p>
                          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                            {hubEmployeesData.length}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            employees
                          </p>
                        </div>
                      </div>

                      {/* Employee table */}
                      <div className="
                      rounded-2xl
                      border border-gray-200
                      dark:border-white/[0.06]
                      overflow-hidden
                      shadow-sm
                      "
                      >
                        <div className="bg-gray-50 dark:bg-white/[0.04] grid grid-cols-12 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          <div className="col-span-5">Name</div>
                          <div className="col-span-4">Position</div>
                          <div className="col-span-3 text-center">Status</div>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto">
                          {!canViewEmployees ? (
                            <div className="py-10 flex flex-col items-center justify-center text-center">
                              <Shield size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Restricted Access
                              </p>
                            </div>
                          ) : paginatedEmployees.length > 0 ? (
                            paginatedEmployees.map((emp) => {
                              const status = emp.status?.toLowerCase();
                              return (
                                <div
                                  key={emp.id}
                                  className="grid grid-cols-12 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.04] items-center hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                                >
                                  <div className="col-span-5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {emp.full_name}
                                    </p>
                                  </div>
                                  <div className="col-span-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {emp.position || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="col-span-3 flex justify-center">
                                    <span
                                      className={`inline-flex h-5 px-2 rounded-full text-[10px] font-semibold items-center ${
                                        status === 'active'
                                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                          : status === 'inactive'
                                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                          : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                      }`}
                                    >
                                      {status || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-10 text-center">
                              <Users size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {employeeSearch ? 'No matching employees' : 'No employees assigned'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {currentPage} / {totalPages || 1}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentPage(Math.min(totalPages, currentPage + 1))
                            }
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center text-gray-400 dark:text-gray-500 disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}

                      {/* Directions button */}
                      <button
                        onClick={handleGetDirections}
                        disabled={loadingRoute}
                        className="w-full h-10 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:brightness-110 disabled:opacity-50 transition-all"
                      >
                        {loadingRoute ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Navigation size={16} />
                            Get Directions
                          </>
                        )}
                      </button>

                      {/* Direction results */}
                      {showDirections && routeData && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2"
                        >
                          {[
                            { label: 'Walking', icon: Footprints, data: routeData.walking, color: 'text-emerald-500' },
                            { label: 'Cycling', icon: Bike, data: routeData.riding, color: 'text-blue-500' },
                            { label: 'Driving', icon: Car, data: routeData.car, color: 'text-orange-500' },
                          ].map(({ label, icon: Icon, data: rd, color }) => (
                            <div
                              key={label}
                              className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-3 flex items-center gap-3"
                            >
                              <div className={`h-9 w-9 rounded-lg bg-white dark:bg-white/[0.06] flex items-center justify-center shadow-sm`}>
                                <Icon size={16} className={color} />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                  {label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDistance(rd.distanceM)} · {formatDuration(rd.durationSec)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty state for panel */
                  <div className="h-auto min-h-[350px] lg:h-[550px] flex flex-col items-center justify-center text-center p-8">
                    <motion.div
animate={{
  y: [0, -6, 0]
}}
transition={{
  repeat: Infinity,
  duration: 2
}}
className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5"
>
                      <Building2
                        size={42}
                        className="text-red-500"
                        />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Select a Hub
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-[260px] leading-relaxed">
                      Click a hub marker on the map or a hub card below to view details, employees, and directions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========== HUB CARDS GRID ========== */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Hubs
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
                  ({filteredHubs.length})
                </span>
              </h2>
            </div>

            {filteredHubs.length > 0 ? (
              <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-3
              2xl:grid-cols-4
              gap-4
              ">
                <AnimatePresence mode="popLayout">
                  {filteredHubs.map((hub) => (
                    <HubCard
                      key={hub.id}
                      hub={hub}
                      employeeCount={getHubEmployeeCount(hub.id)}
                      onSelect={() => handleMarkerClick(hub)}
                      onEdit={() => setEditingHub(hub)}
                      onDelete={() => setDeletingHub(hub)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* Empty state */
              <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] py-20 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mb-5">
                  <Map size={28} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  {searchTerm ? 'No hubs found' : 'No hubs yet'}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm">
                  {searchTerm
                    ? `No hubs match "${searchTerm}". Try a different search term.`
                    : 'Get started by adding your first hub location.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-5 h-10 px-5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:brightness-110 active:scale-[0.97] transition-all"
                  >
                    <Plus size={16} />
                    Add First Hub
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== MOBILE FAB ========== */}
      <button
        onClick={() => setShowAddModal(true)}
            className="
            sm:hidden
            fixed
            bottom-24
            right-4
            z-40
            h-14
            w-14
            rounded-full
            bg-gradient-to-br
            from-red-500
            to-rose-600
            text-white
            flex
            items-center
            justify-center
            shadow-2xl
            shadow-red-500/30
            active:scale-90
            transition-all
            "
      >
        <Plus size={24} />
      </button>

      {/* ========== MODALS ========== */}
      <AnimatePresence>
        {showAddModal && (
          <AddHubModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingHub && (
          <EditHubModal
            hub={editingHub}
            onClose={() => setEditingHub(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingHub && (
          <DeleteHubModal
            hub={deletingHub}
            onClose={() => setDeletingHub(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
