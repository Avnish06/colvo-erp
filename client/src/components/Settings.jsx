import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Save, UserPlus, Trash2, ShieldAlert, Database, Download, Info, Key, Lock, Mail, MessageSquare, FileText, PlusCircle, Edit, XCircle, MapPin, Search, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function LocationMarker({ position, setPosition, onDragEnd }) {
  const markerRef = React.useRef(null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const eventHandlers = React.useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition(newPos);
        if (onDragEnd) onDragEnd(newPos);
      }
    },
  }), [setPosition, onDragEnd]);

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function MapController({ center, zoom }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15);
    }
  }, [center, zoom, map]);
  return null;
}

function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const map = useMapEvents({});

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        setSuggestions(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] md:max-w-md mx-auto">
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-100 ring-4 ring-black/5 transition-all focus-within:ring-blue-100">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium placeholder:text-gray-400"
            placeholder="Search for your office address... "
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(item.display_name);
                  setSuggestions([]);
                  onSelect({ lat: parseFloat(item.lat), lon: parseFloat(item.lon), address: item.display_name });
                }}
                className="w-full px-5 py-4 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none group flex gap-3"
              >
                <MapPin size={16} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 font-medium line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Settings = ({ initialTab = 'General' }) => {
  const userStats = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState(initialTab);
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // RBAC State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [roleForm, setRoleForm] = useState({ id: null, name: '', permissions: [] });

  // Fetch initial data based on tab
  useEffect(() => {
    setActiveTab(initialTab);
    fetchRoles();
  }, [initialTab]);

  useEffect(() => {
    const settingsTabs = ['General', 'Security', 'Attendance', 'ApiKeys', 'EmailSms', 'FinancialYear', 'Override'];
    if (settingsTabs.includes(activeTab)) fetchSettings();

    if (activeTab === 'Policies') fetchPolicies();
    if (activeTab === 'Users') fetchUsers();
    if (activeTab === 'Audit') fetchLogs();
    if (activeTab === 'Roles') fetchPermissions();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (err) { toast.error('Error loading settings'); }
  };

  const handleReverseGeocode = async (lat, lon) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (res.data && res.data.address) {
        const addr = res.data.address;
        setSettings(prev => ({
          ...prev,
          office_street: addr.road || addr.suburb || '',
          office_city: addr.city || addr.town || addr.village || '',
          office_state: addr.state || '',
          office_country: addr.country || '',
          office_landmark: addr.neighbourhood || addr.amenity || addr.building || ''
        }));
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleGeocode = async () => {
    const { office_street, office_city, office_state, office_country, office_landmark } = settings;
    const address = [office_street, office_landmark, office_city, office_state, office_country]
      .filter(part => part && part.trim() !== '')
      .join(', ');

    if (!address.trim()) return toast.error('Please enter at least some address details');

    setGeocoding(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setSettings({ ...settings, office_latitude: lat, office_longitude: lon });
        toast.success('Location found and map updated!');
      } else {
        toast.error('Address not found. Please try adding more details.');
      }
    } catch (err) {
      toast.error('Error fetching location. Check your internet connection.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser');
    }

    setGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSettings(prev => ({
          ...prev,
          office_latitude: latitude.toString(),
          office_longitude: longitude.toString()
        }));
        handleReverseGeocode(latitude, longitude);
        toast.success('Current location detected!');
        setGeocoding(false);
      },
      (error) => {
        toast.error('Unable to retrieve your location');
        setGeocoding(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/employees');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) { toast.error('Error loading users'); }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/audit');
      if (res.data.success) setLogs(res.data.data);
    } catch (err) { toast.error('Error loading logs'); }
  };

  const fetchPolicies = async () => {
    try {
      const res = await axios.get('/api/policies');
      if (res.data.success) setPolicies(res.data.data);
    } catch (err) { toast.error('Error loading policies'); }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles');
      if (res.data.success) setRoles(res.data.data);
    } catch (err) { console.error('Error fetching roles'); }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('/api/roles/permissions');
      if (res.data.success) setAllPermissions(res.data.data);
    } catch (err) { toast.error('Error loading permissions'); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (activeTab === 'General' && (!settings.company_name || !settings.company_address)) {
      return toast.error('Company Name and Address are required');
    }
    try {
      await axios.post('/api/settings', settings);
      toast.success('Settings saved successfully');
      await axios.post('/api/audit', {
        user_id: userStats.id,
        action: 'UPDATE_SETTINGS',
        details: 'Updated global system settings'
      });
    } catch (err) { toast.error('Error saving settings'); }
  };

  const handleRoleChange = async (userId, newRoleId, userName) => {
    try {
      await axios.put(`/api/employees/${userId}/role`, { role_id: newRoleId });
      toast.success(`Role updated for ${userName}`);
      fetchUsers();

      const role = roles.find(r => r.id == newRoleId);
      const roleName = role ? role.name : 'Unknown Role';
      await axios.post('/api/audit', {
        user_id: userStats.id,
        action: 'UPDATE_ROLE',
        details: `Changed ${userName}'s role to ${roleName}`
      });
    } catch (err) { toast.error('Error updating role'); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setUploading(true);
    try {
      const res = await axios.post('/api/settings/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setSettings({ ...settings, company_logo: res.data.logoUrl });
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      toast.error('Error uploading logo');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* General Settings Tab */}
      {activeTab === 'General' && (
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Company Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Company Address</label>
              <textarea
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                rows="3"
                value={settings.company_address || ''}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Company Logo</label>
              <div className="flex flex-wrap items-center gap-4">
                {settings.company_logo && (
                  <img src={settings.company_logo} alt="Company Logo" className="h-12 w-12 object-contain rounded-lg border border-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </div>
              {uploading && <p className="text-xs text-blue-600">Uploading...</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Currency</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.currency || ''}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Timezone</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.timezone || ''}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700">
              <Save size={18} /> Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Attendance & Geofencing Settings Tab */}
      {activeTab === 'Attendance' && (
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Section - Main Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-100/50 border border-gray-100 overflow-hidden relative">
                <div className="h-[600px] w-full relative z-0">
                  <MapContainer
                    center={[parseFloat(settings.office_latitude) || 20.5937, parseFloat(settings.office_longitude) || 78.9629]}
                    zoom={parseFloat(settings.office_latitude) ? 17 : 5}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <AddressSearch
                      onSelect={(res) => {
                        setSettings(prev => ({ ...prev, office_latitude: res.lat.toString(), office_longitude: res.lon.toString() }));
                        handleReverseGeocode(res.lat, res.lon);
                      }}
                    />
                    <LocationMarker
                      position={settings.office_latitude ? { lat: parseFloat(settings.office_latitude), lng: parseFloat(settings.office_longitude) } : null}
                      setPosition={(pos) => setSettings(prev => ({ ...prev, office_latitude: pos.lat.toString(), office_longitude: pos.lng.toString() }))}
                      onDragEnd={(pos) => handleReverseGeocode(pos.lat, pos.lng)}
                    />
                    <MapController
                      center={settings.office_latitude ? [parseFloat(settings.office_latitude), parseFloat(settings.office_longitude)] : null}
                    />
                  </MapContainer>
                </div>

                {/* Map Legend/Overlay Info */}
                <div className="absolute bottom-6 left-6 right-6 z-[1000] pointer-events-none flex flex-col items-start gap-4">
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={geocoding}
                    className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white inline-flex items-center gap-4 pointer-events-auto hover:bg-white transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                      {geocoding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Navigation size={20} />}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Auto Detect</p>
                      <p className="text-sm font-bold text-gray-900">Use My Current Location</p>
                    </div>
                  </button>

                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white inline-flex flex-wrap items-center gap-4 pointer-events-auto max-w-full">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Coordinates</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {settings.office_latitude ? `${parseFloat(settings.office_latitude).toFixed(6)}, ${parseFloat(settings.office_longitude).toFixed(6)}` : 'Location not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm font-medium text-gray-400">
                <span className="text-blue-600 font-black">Pro Tip: </span>
                Click anywhere or drag the blue pin to fine-tune the exact office entrance.
              </p>
            </div>

            {/* Sidebar Settings Section */}
            <div className="space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6">
                  <h4 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <MapPin size={24} />
                    </div>
                    Office Details
                  </h4>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Street & Building</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 ring-blue-50 transition-all placeholder:text-gray-300"
                        value={settings.office_street || ''}
                        onChange={(e) => setSettings({ ...settings, office_street: e.target.value })}
                        placeholder="e.g. 102 Metro Tower"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Landmark</label>
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 ring-blue-50 transition-all placeholder:text-gray-300"
                        value={settings.office_landmark || ''}
                        onChange={(e) => setSettings({ ...settings, office_landmark: e.target.value })}
                        placeholder="e.g. Near City Bank"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">City</label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 ring-blue-50 transition-all"
                          value={settings.office_city || ''}
                          onChange={(e) => setSettings({ ...settings, office_city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">State</label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-4 ring-blue-50 transition-all"
                          value={settings.office_state || ''}
                          onChange={(e) => setSettings({ ...settings, office_state: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 space-y-6 text-center">
                  <div className="inline-flex flex-wrap items-center gap-4 bg-amber-50 px-6 py-2 rounded-full mb-2">
                    <ShieldAlert size={16} className="text-amber-600" />
                    <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Geofence Rule</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                      <div>
                        <p className="font-bold text-gray-900">Enable Face Detection</p>
                        <p className="text-xs text-gray-500">Require face verification for marking attendance.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.face_detection_enabled !== 'false'}
                          onChange={(e) => setSettings({ ...settings, face_detection_enabled: e.target.checked ? 'true' : 'false' })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                      <div>
                        <p className="font-bold text-gray-900">Enable Geofencing</p>
                        <p className="text-xs text-gray-500">Require employees to be within the office radius.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={settings.geofence_enabled !== 'false'}
                          onChange={(e) => setSettings({ ...settings, geofence_enabled: e.target.checked ? 'true' : 'false' })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Marking Radius</label>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <input
                          type="number"
                          className="w-24 px-4 py-4 bg-gray-50 border-none rounded-2xl font-black text-gray-900 text-center text-xl focus:ring-4 ring-blue-50 transition-all"
                          value={settings.geofence_radius || 50}
                          onChange={(e) => setSettings({ ...settings, geofence_radius: e.target.value })}
                          disabled={settings.geofence_enabled === 'false'}
                        />
                        <span className="text-lg font-black text-gray-900 italic">Meters</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 font-medium">
                    Employees outside this range will be blocked from marking their daily attendance.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Save size={18} /> Save Map Config
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Policies' && (
        <div className="space-y-6 max-w-4xl">
          {/* Add New Policy */}
          {['Developer', 'Super Admin'].includes(userStats?.role) && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Add New Policy</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const title = form.title.value;
                const content = form.content.value;
                try {
                  await axios.post('/api/policies', { title, content });
                  toast.success('Policy added');
                  form.reset();
                  fetchPolicies();
                } catch (err) { toast.error('Error adding policy'); }
              }} className="space-y-4">
                <input name="title" placeholder="Policy Title (e.g., Leave Policy)" className="w-full px-4 py-2 border border-gray-200 rounded-lg" required />
                <textarea name="content" placeholder="Policy Content..." rows="4" className="w-full px-4 py-2 border border-gray-200 rounded-lg" required />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Add Policy</button>
              </form>
            </div>
          )}

          {/* Policy List */}
          <div className="grid gap-4">
            {policies.map(policy => (
              <div key={policy.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start group">
                <div>
                  <h5 className="font-bold text-gray-900 text-lg">{policy.title}</h5>
                  <p className="text-gray-600 whitespace-pre-wrap mt-2">{policy.content}</p>
                  <p className="text-xs text-gray-400 mt-4">Last updated: {new Date(policy.updated_at).toLocaleDateString()}</p>
                </div>
                {['Developer', 'Super Admin'].includes(userStats?.role) && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Delete this policy?')) {
                        try {
                          await axios.delete(`/api/policies/${policy.id}`);
                          toast.success('Policy deleted');
                          fetchPolicies();
                        } catch (err) { toast.error('Error deleting policy'); }
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {policies.length === 0 && <p className="text-gray-500 text-center py-8">No policies added yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'Security' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Lock className="text-blue-600" /> Data Security Controls
            </h4>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                <div>
                  <p className="font-bold text-gray-900">Minimum Password Length</p>
                  <p className="text-xs text-gray-500">Enforce minimum characters for user passwords.</p>
                </div>
                <input
                  type="number"
                  min="6" max="32"
                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-center"
                  value={settings.password_min_length || 8}
                  onChange={(e) => setSettings({ ...settings, password_min_length: e.target.value })}
                />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                <div>
                  <p className="font-bold text-gray-900">Require Special Characters</p>
                  <p className="text-xs text-gray-500">Passwords must contain symbols (!@#$).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.password_require_special === 'true'}
                    onChange={(e) => setSettings({ ...settings, password_require_special: e.target.checked ? 'true' : 'false' })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                <div>
                  <p className="font-bold text-gray-900">Session Timeout (Minutes)</p>
                  <p className="text-xs text-gray-500">Auto-logout inactive users.</p>
                </div>
                <input
                  type="number"
                  min="5"
                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-center"
                  value={settings.session_timeout || 30}
                  onChange={(e) => setSettings({ ...settings, session_timeout: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700">
              <Save size={18} /> Save Security Settings
            </button>
          </form>
        </div>
      )}

      {activeTab === 'ApiKeys' && (
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl">
          <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Key className="text-blue-600" /> API Access Keys
          </h4>

          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h5 className="font-bold text-gray-800 mb-2">Generate New Key</h5>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Key Name (e.g., Mobile App)"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!newKeyName) return toast.error('Enter a key name');
                  const newKey = {
                    id: Date.now(),
                    name: newKeyName,
                    key: 'sk_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
                    created: new Date().toISOString()
                  };
                  const currentKeys = settings.api_keys ? JSON.parse(settings.api_keys) : [];
                  const updatedKeys = [...currentKeys, newKey];
                  setSettings({ ...settings, api_keys: JSON.stringify(updatedKeys) });
                  setNewKeyName('');
                  toast.success('API Key Generated');
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {settings.api_keys && JSON.parse(settings.api_keys).map(apiKey => (
              <div key={apiKey.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
                <div>
                  <p className="font-bold text-gray-900">{apiKey.name}</p>
                  <p className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{apiKey.key}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Created: {new Date(apiKey.created).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Revoke this API Key?')) {
                      const currentKeys = JSON.parse(settings.api_keys);
                      const updatedKeys = currentKeys.filter(k => k.id !== apiKey.id);
                      setSettings({ ...settings, api_keys: JSON.stringify(updatedKeys) });
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {(!settings.api_keys || JSON.parse(settings.api_keys).length === 0) && (
              <p className="text-center text-gray-500 py-4">No active API keys.</p>
            )}
          </div>

          {settings.api_keys && (
            <div className="mt-6 flex justify-end">
              <button onClick={handleSaveSettings} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-gray-800">
                <Save size={18} /> Save Changes
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'EmailSms' && (
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-4xl">
          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* Email Section */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="text-blue-600" /> Email Configuration (SMTP)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">SMTP Host</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="smtp.example.com"
                    value={settings.smtp_host || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">SMTP Port</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="587"
                    value={settings.smtp_port || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">SMTP User</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="user@example.com"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">SMTP Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="••••••••"
                    value={settings.smtp_pass || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="text-green-600" /> SMS Configuration (Twilio/Provider)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Account SID</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="ACxxxxxxxx..."
                    value={settings.sms_sid || ''}
                    onChange={(e) => setSettings({ ...settings, sms_sid: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Auth Token</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="••••••••"
                    value={settings.sms_token || ''}
                    onChange={(e) => setSettings({ ...settings, sms_token: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">From Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                    placeholder="+1234567890"
                    value={settings.sms_from || ''}
                    onChange={(e) => setSettings({ ...settings, sms_from: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700">
              <Save size={18} /> Save Configurations
            </button>
          </form>
        </div>
      )}

      {activeTab === 'FinancialYear' && (
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h4 className="text-lg font-bold text-gray-900">Financial Year Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.financial_year_start || ''}
                  onChange={(e) => setSettings({ ...settings, financial_year_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">End Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                  value={settings.financial_year_end || ''}
                  onChange={(e) => setSettings({ ...settings, financial_year_end: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-blue-700">
              <Save size={18} /> Save Settings
            </button>
          </form>
        </div>
      )}


      {activeTab === 'Override' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-amber-500" /> Override System Restrictions
            </h4>
            <p className="text-sm text-gray-500">Enable these options to bypass standard system constraints. Use with caution.</p>

            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">Allow Past Attendance Edit</p>
                  <p className="text-xs text-gray-500">Admins can modify attendance records from previous months.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.override_attendance === 'true'}
                    onChange={(e) => setSettings({ ...settings, override_attendance: e.target.checked ? 'true' : 'false' })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">Unlock Payroll Processing</p>
                  <p className="text-xs text-gray-500">Process payroll even if attendance is incomplete.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.override_payroll === 'true'}
                    onChange={(e) => setSettings({ ...settings, override_payroll: e.target.checked ? 'true' : 'false' })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">Bypass Project Budget Limits</p>
                  <p className="text-xs text-gray-500">Allow creating projects/tasks exceeding assigned budget.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.override_budget === 'true'}
                    onChange={(e) => setSettings({ ...settings, override_budget: e.target.checked ? 'true' : 'false' })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button type="submit" className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-amber-600 w-full justify-center">
              <ShieldAlert size={18} /> Save Override Settings
            </button>
          </form>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'Users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Current Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.role_id === 1 ? 'bg-purple-100 text-purple-600' :
                      user.role_id === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {roles.find(r => r.id === user.role_id)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      value={user.role_id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                      disabled={user.role_id === 1 && user.email === 'admin@example.com'} // Prevent changing main super admin
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Roles & Permissions Tab */}
      {activeTab === 'Roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Manage Roles & Permissions</h3>
            <button
              onClick={() => {
                setRoleForm({ id: null, name: '', permissions: [] });
                setIsRoleModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"
            >
              <PlusCircle size={18} /> Add New Role
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Role Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Permissions</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map(role => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{role.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                        {role.permission_count || 0} Permissions
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={async () => {
                            // Fetch permissions for this role first
                            try {
                              const res = await axios.get(`http://localhost:5000/api/roles/${role.id}/permissions`);
                              if (res.data.success) {
                                setRoleForm({ id: role.id, name: role.name, permissions: res.data.data });
                                setIsRoleModalOpen(true);
                              }
                            } catch (err) { toast.error('Error fetching role details'); }
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this role? This action cannot be undone.')) {
                              try {
                                await axios.delete(`http://localhost:5000/api/roles/${role.id}`);
                                toast.success('Role deleted');
                                fetchRoles();
                              } catch (err) { toast.error('Error deleting role'); }
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Role Modal */}
          {isRoleModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">{roleForm.id ? 'Edit Role' : 'Create New Role'}</h3>
                  <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="e.g., HR Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4">Permissions</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allPermissions.map(perm => (
                        <label key={perm.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions.includes(perm.id)}
                            onChange={(e) => {
                              const newPerms = e.target.checked
                                ? [...roleForm.permissions, perm.id]
                                : roleForm.permissions.filter(id => id !== perm.id);
                              setRoleForm({ ...roleForm, permissions: newPerms });
                            }}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{perm.name}</p>
                            <p className="text-xs text-gray-500">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!roleForm.name) return toast.error('Role name is required');
                      try {
                        if (roleForm.id) {
                          await axios.put(`http://localhost:5000/api/roles/${roleForm.id}`, roleForm);
                          toast.success('Role updated');
                        } else {
                          await axios.post('http://localhost:5000/api/roles', roleForm);
                          toast.success('Role created');
                        }
                        setIsRoleModalOpen(false);
                        fetchRoles();
                      } catch (err) { toast.error('Error saving role'); }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                  >
                    Save Role
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'Audit' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{log.user_name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.details}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Settings;
