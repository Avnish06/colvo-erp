import React, { useState, useEffect, useRef } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Clock, LogIn, LogOut, CheckCircle, User, Filter, Edit, X, MapPin, Camera, RefreshCw, Eye, ShieldCheck, Scan, Loader2, AlertCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', clock_in: '', clock_out: '', status: '' });
  const [settings, setSettings] = useState({});

  // Photo View Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');

  // Camera State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);
  const [attendanceAction, setAttendanceAction] = useState(null); // 'in' or 'out'

  // Face Verification State
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | loading | ready | verifying | matched | failed
  const [faceStatusMsg, setFaceStatusMsg] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const faceDetectionIntervalRef = useRef(null);
  const MODEL_URL = '/models';
  const FACE_THRESHOLD = 0.5;

  // Location States
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isWFHApproved, setIsWFHApproved] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Developer';
  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'Developer';
  const isEmployee =
    user?.role === 'Employee ERP' ||
    user?.role === 'Employee CRM' ||
    user?.role === 'Employee' ||
    user?.role === 'Staff';

  useEffect(() => {
    fetchAttendance();
    fetchSettings();
    checkWFHStatus();
    return () => {
      if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
    };
  }, []);

  // Load face-api models when camera opens
  const loadFaceModels = async () => {
    if (modelsLoaded) return;
    setFaceStatus('loading');
    setFaceStatusMsg('Loading AI face models...');
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setFaceStatus('ready');
      setFaceStatusMsg('Position your face in the frame...');
    } catch (err) {
      console.error('[Attendance] Model load error:', err);
      setFaceStatus('failed');
      setFaceStatusMsg('Failed to load AI models.');
    }
  };

  const verifyFace = async () => {
    if (!webcamRef.current?.video) return;
    setFaceStatus('verifying');
    setFaceStatusMsg('Scanning your face...');
    try {
      // Fetch stored descriptor
      const res = await axios.get(`/api/face/descriptor`);

      if (!res.data.enrolled || !res.data.descriptor) {
        toast.error('Face not enrolled. Please contact your administrator.');
        setFaceStatus('failed');
        setFaceStatusMsg('No face enrolled for this account.');
        return;
      }

      const storedDescriptor = new Float32Array(res.data.descriptor);

      // Detect live face
      const video = webcamRef.current.video;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!detection) {
        setFaceStatus('failed');
        setFaceStatusMsg('No face detected. Please look at the camera.');
        toast.error('No face detected. Please try again.');
        return;
      }

      const distance = faceapi.euclideanDistance(storedDescriptor, detection.descriptor);
      console.debug('[Face] Distance:', distance, 'Threshold:', FACE_THRESHOLD);

      if (distance <= FACE_THRESHOLD) {
        // Face matched — capture photo and proceed
        setFaceStatus('matched');
        setFaceStatusMsg('Face verified! ✓');
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
      } else {
        setFaceStatus('failed');
        setFaceStatusMsg(`Face not recognized. Please try again. (Score: ${distance.toFixed(2)})`);
        toast.error('Face not recognized. Attendance not marked.');
      }
    } catch (err) {
      console.error('[Face] Verification error:', err);
      setFaceStatus('failed');
      setFaceStatusMsg('Verification failed. Please try again.');
      toast.error('Face verification error.');
    }
  };

  const checkWFHStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get(`/api/wfh/check/${today}`);
      if (res.data.success) {
        setIsWFHApproved(res.data.isApproved);
      }
    } catch (err) {
      console.error('Error checking WFH status:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      let url = `/api/attendance/${user.id}`;
      if (isAdmin) {
        url = '/api/attendance';
      }

      let res;
      try {
        res = await axios.get(url);
      } catch (err) {
        if (err.response && err.response.status === 403 && isAdmin) {
          // Fallback to personal attendance if Admin doesn't have view_attendance permission
          res = await axios.get(`/api/attendance/${user.id}`);
        } else {
          throw err;
        }
      }

      if (res.data.success) {
        setAttendance(res.data.data);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        const todayRec = res.data.data.find(rec => {
          if (!rec.date) return false;
          const recDateObj = new Date(rec.date);
          const isDateMatch =
            recDateObj.getFullYear() === currentYear &&
            recDateObj.getMonth() === currentMonth &&
            recDateObj.getDate() === currentDate;

          const isUserMatch = String(rec.user_id) === String(user.id);
          return isDateMatch && isUserMatch;
        });

        console.debug('Today record found:', todayRec);
        setTodayRecord(todayRec);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error fetching attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (rec) => {
    setSelectedRec(rec);
    setEditForm({
      date: rec.date.split('T')[0],
      clock_in: rec.clock_in || '',
      clock_out: rec.clock_out || '',
      status: rec.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAttendance = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `/api/attendance/${selectedRec.id}`,
        editForm
      );
      if (res.data.success) {
        toast.success('Attendance updated successfully');
        setIsEditModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating attendance');
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkGeofence = () => {
    return new Promise((resolve, reject) => {
      if (settings.geofence_enabled === 'false') {
        return resolve(true);
      }
      
      if (!navigator.geolocation) {
        return reject('Geolocation is not supported by your browser');
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const officeLat = parseFloat(settings.office_latitude);
          const officeLon = parseFloat(settings.office_longitude);
          const radius = parseFloat(settings.geofence_radius) || 50;

          if (!officeLat || !officeLon) {
            console.warn('Office location not set in settings');
            return resolve(true);
          }

          const distance = getDistance(userLat, userLon, officeLat, officeLon);
          if (distance <= radius) {
            resolve(true);
          } else {
            reject(`Out of Office Range: You are ${Math.round(distance)}m away. You must be within ${radius}m of the office.`);
          }
        },
        (error) => {
          setIsLocating(false);
          let msg = 'Error getting location';
          if (error.code === 1) {
            msg = 'Location permission denied. Please allow location access in your browser settings to mark attendance.';
          } else if (error.code === 2) {
            msg = 'Location unavailable. Please check your device GPS settings and ensure you have a clear sky view.';
          } else if (error.code === 3) {
            msg = 'Location request timed out. Please try again.';
          }
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleClockIn = async () => {
    if (todayRecord) {
      toast.warning('You have already marked your attendance today.');
      return;
    }
    if (settings.face_detection_enabled !== 'false' && !capturedImage) {
      // Open camera and load models
      setAttendanceAction('in');
      setIsCameraModalOpen(true);
      setFaceStatus('idle');
      setFaceStatusMsg('');
      setCapturedImage(null);
      setTimeout(() => loadFaceModels(), 300);
      return;
    }

    try {
      if (!isWFHApproved) {
        await checkGeofence();
      } else {
        console.debug('Geofence bypassed (Clock-in) due to approved WFH status');
      }
    } catch (error) {
      toast.error(error);
      if (error.includes('permission denied')) {
        setShowLocationPrompt(true);
      }
      return;
    }

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toLocaleTimeString('en-GB'); // HH:MM:SS
      const res = await axios.post('/api/attendance/clock-in', {
        user_id: user.id,
        employee_name: user.name,
        date: today,
        clock_in: now,
        image_capture: capturedImage
      });
      if (res.data.success) {
        toast.success('Clocked in successfully with photo verification');
        setCapturedImage(null);
        setIsCameraModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      console.error('Clock-in error details:', err);
      const errorMsg = err.response?.data?.message || err.message || (typeof err === 'string' ? err : 'Error clocking in');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    // capturePhoto is no longer used directly — kept for legacy compat.
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const handleClockOut = async () => {
    if (!todayRecord) {
      toast.warning('Please mark your attendance (Clock In) first before clocking out.');
      return;
    }
    if (todayRecord.clock_out) {
      toast.warning('You have already clocked out for today.');
      return;
    }

    if (settings.face_detection_enabled !== 'false' && !capturedImage) {
      // Open camera and load models
      setAttendanceAction('out');
      setIsCameraModalOpen(true);
      setFaceStatus('idle');
      setFaceStatusMsg('');
      setCapturedImage(null);
      setTimeout(() => loadFaceModels(), 300);
      return;
    }
    setLoading(true);
    try {
      if (!isWFHApproved) {
        await checkGeofence();
      } else {
        console.debug('Geofence bypassed (Clock-out) due to approved WFH status');
      }
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toLocaleTimeString('en-GB');
      const res = await axios.post('/api/attendance/clock-out', {
        user_id: user.id,
        date: today,
        clock_out: now,
        image_capture: capturedImage
      });
      if (res.data.success) {
        toast.success('Clocked out successfully with photo verification');
        setCapturedImage(null);
        setIsCameraModalOpen(false);
        fetchAttendance();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Error clocking out');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter(rec => {
    if (roleFilter === 'All') return true;
    if (isAdmin && rec.role_id) {
      const roleName = getRoleName(rec.role_id);
      if (roleFilter === 'Admins') return roleName === 'Admin';
      if (roleFilter === 'Employees') return roleName === 'Employee';
      return roleName === roleFilter;
    }
    return true;
  });

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1: return 'Super Admin';
      case 2: return 'Admin';
      case 3: return 'Employee ERP';
      case 4: return 'Employee CRM';
      case 5: return 'Developer';
      default: return 'Employee';
    }
  };

  const canEdit = isSuperAdmin || (user?.role === 'Admin' && settings.override_attendance === 'true');

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '--:--';
    const [hours, minutes, seconds] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };


  return (
    <div className="space-y-8">
      {/* Clock-in/out Card - Hidden for Admins/Super Admins */}
      {isEmployee && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <Clock size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Today's Attendance</h3>
              <p className="text-gray-500 font-medium">{new Date().toDateString()}</p>
              {(settings.office_city || settings.office_street) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg w-fit">
                  <MapPin size={12} />
                  <span>Office: {[settings.office_street, settings.office_landmark, settings.office_city].filter(part => part && part.trim() !== '').join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {todayRecord?.clock_out ? (
              <div className="bg-green-50 text-green-600 px-8 py-4 rounded-xl font-bold flex flex-wrap items-center gap-2 border border-green-100">
                <CheckCircle size={20} /> Shift Completed
              </div>
            ) : (
              <>
                <button
                  onClick={handleClockIn}
                  className={`${!!todayRecord ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed hidden' : 'bg-gradient-to-r from-orange-400 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-blue-200/50'} px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all`}
                >
                  <LogIn size={20} /> Clock In
                </button>
                <button
                  onClick={handleClockOut}
                  className={`${(!todayRecord || !!todayRecord?.clock_out) ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed hover:bg-gray-200 hidden' : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200'} px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all`}
                >
                  <LogOut size={20} /> Clock Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-bold text-gray-900">
            {isAdmin ? 'All Attendance Records' : 'My History'}
          </h3>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Users</option>
                <option value="Admins">Admins</option>
                <option value="Employees">Employees</option>
              </select>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>}
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Photo</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Clock In</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Clock Out</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                {canEdit && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isAdmin ? 8 : 6} className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
              ) : filteredAttendance.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 6} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
              ) : filteredAttendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                        <User size={12} />
                      </div>
                      <div>
                        <p>{rec.employee_name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">{getRoleName(rec.role_id)}</p>
                      </div>
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-6 py-4 text-center">
                      {rec.image_url ? (
                        <button
                          onClick={() => {
                            setSelectedPhotoUrl(rec.image_url);
                            setIsPhotoModalOpen(true);
                          }}
                          className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all group/photo"
                          title="View Verification Photo"
                        >
                          <Eye size={18} className="group-hover/photo:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-300 mx-auto" title="No Photo Available">
                          <span className="text-[10px] font-bold">N/A</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{new Date(rec.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatTime12h(rec.clock_in)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatTime12h(rec.clock_out)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rec.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {rec.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEditClick(rec)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col items-center">
            <div className="w-full flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Camera size={18} className="text-blue-600" />
                Verification Photo
              </h3>
              <button
                onClick={() => { setIsPhotoModalOpen(false); setSelectedPhotoUrl(''); }}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 w-full flex justify-center bg-gray-100/50">
              <img
                src={selectedPhotoUrl}
                alt="Verification Photo Fullsize"
                className="max-w-full max-h-[70vh] rounded-2xl shadow-xl object-contain border-4 border-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {
        isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Edit Attendance</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdateAttendance} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Clock In</label>
                    <input
                      type="text"
                      placeholder="HH:MM:SS"
                      value={editForm.clock_in}
                      onChange={(e) => setEditForm({ ...editForm, clock_in: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Clock Out</label>
                    <input
                      type="text"
                      placeholder="HH:MM:SS"
                      value={editForm.clock_out}
                      onChange={(e) => setEditForm({ ...editForm, clock_out: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Camera Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Scan className="text-blue-600" />
                  Face Verification
                </h3>
                <p className="text-xs text-gray-500 font-medium">Your face must match the enrolled photo to mark attendance</p>
              </div>
              <button onClick={() => { setIsCameraModalOpen(false); setCapturedImage(null); setFaceStatus('idle'); }} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {/* Camera view */}
              {!capturedImage ? (
                <div className={`relative rounded-2xl overflow-hidden shadow-inner bg-black aspect-video flex items-center justify-center border-2 transition-all duration-500 ${faceStatus === 'matched' ? 'border-green-500' : faceStatus === 'failed' ? 'border-red-500' : 'border-transparent'}`}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "user" }}
                  />
                  {/* Face guide oval */}
                  {(faceStatus === 'ready' || faceStatus === 'verifying') && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-48 rounded-full border-2 border-white/50 border-dashed" />
                    </div>
                  )}
                  {/* Status badge */}
                  {faceStatus !== 'idle' && (
                    <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full backdrop-blur-md bg-black/60 text-xs font-black uppercase tracking-widest flex items-center gap-2 ${faceStatus === 'matched' ? 'text-green-400' : faceStatus === 'failed' ? 'text-red-400' : 'text-blue-300'}`}>
                      {(faceStatus === 'loading' || faceStatus === 'verifying') && <Loader2 size={12} className="animate-spin" />}
                      {faceStatus === 'matched' && <CheckCircle size={12} />}
                      {faceStatus === 'failed' && <AlertCircle size={12} />}
                      {faceStatusMsg || faceStatus}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100 aspect-video animate-in fade-in duration-500">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
                    <CheckCircle size={20} />
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500/90 text-white text-xs font-black uppercase tracking-widest rounded-full backdrop-blur-sm">
                    ✓ Face Verified
                  </div>
                </div>
              )}

              {/* Status message below camera */}
              {faceStatusMsg && !capturedImage && (
                <p className={`text-center text-sm font-semibold mt-3 ${faceStatus === 'failed' ? 'text-red-500' : faceStatus === 'matched' ? 'text-green-600' : 'text-gray-500'}`}>
                  {faceStatusMsg}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-4">
                {!capturedImage ? (
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={verifyFace}
                      disabled={faceStatus === 'loading' || faceStatus === 'verifying'}
                      className={`w-full py-4 font-black rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${faceStatus === 'loading' || faceStatus === 'verifying'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : faceStatus === 'failed'
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200'
                        }`}
                    >
                      {faceStatus === 'loading' ? (
                        <><Loader2 size={20} className="animate-spin" /> Loading AI Models...</>
                      ) : faceStatus === 'verifying' ? (
                        <><Loader2 size={20} className="animate-spin" /> Scanning Face...</>
                      ) : faceStatus === 'failed' ? (
                        <><RefreshCw size={20} /> Try Again</>
                      ) : (
                        <><ShieldCheck size={20} /> Verify My Face</>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setFaceStatus('matched');
                        setFaceStatusMsg('Face verified automatically! ✓ (Dev Mode)');
                        setCapturedImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
                        if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-purple-100/50 text-purple-600 hover:bg-purple-100 border border-purple-200 font-bold py-3 px-6 rounded-2xl transition-all"
                    >
                      Auto Verify (No Camera Dev Mode)
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => { setCapturedImage(null); setFaceStatus('ready'); setFaceStatusMsg('Position your face in the frame...'); }}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={20} />
                      Retry
                    </button>
                    <button
                      onClick={attendanceAction === 'in' ? handleClockIn : handleClockOut}
                      disabled={loading}
                      className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={24} />
                          Confirm & {attendanceAction === 'in' ? 'Clock In' : 'Clock Out'}
                        </>
                      )}
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                  Location + biometric verification applied
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Modal */}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <MapPin className="text-blue-600 w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">Location Required</h3>
              <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                To mark attendance, we need to verify your location.
                Please click <strong>"Allow"</strong> when your browser asks for GPS access.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                >
                  I'll Allow It
                </button>
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locating Overlay */}
      {isLocating && (
        <div className="fixed inset-0 bg-white/60 z-[250] flex items-center justify-center backdrop-blur-[2px]">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center gap-4 animate-pulse">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
              <RefreshCw className="text-blue-600 animate-spin w-10 h-10 relative z-10" />
            </div>
            <p className="font-black text-gray-900 tracking-widest uppercase text-xs">Verifying Location...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
