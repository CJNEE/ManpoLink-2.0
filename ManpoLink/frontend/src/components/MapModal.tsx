import { Modal } from './Modal';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubLat: number | null;
  hubLng: number | null;
}

const userIcon = new L.Icon({
  iconUrl: '/node_modules/leaflet/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const MapModal = ({ isOpen, onClose, hubLat, hubLng }: MapModalProps) => {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [poly, setPoly] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [mode, setMode] = useState<'walk' | 'bike' | 'car'>('walk');

  useEffect(() => {
    if (!isOpen) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (userPos && hubLat != null && hubLng != null) {
      const lat1 = userPos[0];
      const lon1 = userPos[1];
      const lat2 = hubLat; const lon2 = hubLng;
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      setDistanceKm(Number(d.toFixed(2)));
      setPoly([[lat1, lon1], [lat2, lon2]]);
    }
  }, [userPos, hubLat, hubLng]);

  const estimateTime = (km: number) => {
    if (mode === 'walk') return Math.round((km / 5) * 60); // 5 km/h
    if (mode === 'bike') return Math.round((km / 15) * 60);
    return Math.round((km / 40) * 60); // car
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Map to Hub" size="xl">
      <div className="space-y-3">
        {userPos ? (
          <div>
            <div className="mb-2 flex gap-2 items-center">
              <label className="text-sm">Mode:</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="input-field text-sm">
                <option value="walk">Walk</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
              <div className="ml-auto text-sm">
                <strong>{distanceKm ?? '--'} km</strong> • {distanceKm ? `${estimateTime(distanceKm)} min` : '--'}
              </div>
            </div>

            <div className="h-96">
              <MapContainer center={userPos} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={userPos} icon={userIcon}></Marker>
                {hubLat != null && hubLng != null && (
                  <>
                    <Marker position={[hubLat, hubLng]} icon={userIcon}></Marker>
                    {poly.length > 0 && <Polyline positions={poly} color="blue" />}
                  </>
                )}
              </MapContainer>
            </div>
          </div>
        ) : (
          <p>Retrieving your location...</p>
        )}
      </div>
    </Modal>
  );
};
