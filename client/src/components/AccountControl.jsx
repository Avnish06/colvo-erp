import React, { useState, useRef } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  User, Lock, Camera, Mail, ShieldCheck,
  CheckCircle, Eye, EyeOff, BadgeInfo, X, Move, ZoomIn, ZoomOut, Sparkles
} from 'lucide-react';

const IMAGE_SIZE = 300;

// ─── Crop Modal ────────────────────────────────────────────────────────────
const CropModal = ({ rawImage, onSave, onCancel }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => { isDragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; e.preventDefault(); };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x, dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onMouseUp = () => { isDragging.current = false; };
  const onTouchStart = (e) => { isDragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x, dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onTouchEnd = () => { isDragging.current = false; };

  const handleSave = () => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = IMAGE_SIZE; canvas.height = IMAGE_SIZE;
      const ctx = canvas.getContext('2d');
      const dw = img.width * scale, dh = img.height * scale;
      const il = (IMAGE_SIZE - dw) / 2 + offset.x, it = (IMAGE_SIZE - dh) / 2 + offset.y;
      ctx.drawImage(img, il, it, dw, dh);
      onSave(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.src = rawImage;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[500] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Frame Your Photo</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Move size={11} /> Drag to reposition · Zoom to fit</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        <div className="flex flex-col items-center gap-5 p-6">
          <div
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, cursor: isDragging.current ? 'grabbing' : 'grab' }}
            className="relative rounded-full overflow-hidden shadow-2xl select-none bg-gray-100"
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          >
            <img src={rawImage} alt="Framing" draggable={false} style={{
              position: 'absolute',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              top: '50%', left: '50%', maxWidth: 'none', userSelect: 'none', pointerEvents: 'none', transformOrigin: 'center center'
            }} />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full px-2">
            <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.1).toFixed(1)))} className="text-gray-500 hover:text-blue-600 transition-colors"><ZoomOut size={18} /></button>
            <input type="range" min="0.5" max="3" step="0.05" value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="flex-1 accent-blue-600" />
            <button onClick={() => setScale(s => Math.min(3, +(s + 0.1).toFixed(1)))} className="text-gray-500 hover:text-blue-600 transition-colors"><ZoomIn size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-200 transition-all active:scale-95">Save Photo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const AccountControl = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [profileImage, setProfileImage] = useState(user.profile_image || null);
  const [imagePreview, setImagePreview] = useState(user.profile_image || null);
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawCropImage, setRawCropImage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be smaller than 10 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setRawCropImage(reader.result); setCropModalOpen(true); };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async (cropped) => {
    setCropModalOpen(false); setImagePreview(cropped); await uploadImage(cropped);
  };

  const uploadImage = async (base64Image) => {
    setUploading(true);
    try {
      const res = await axios.put(`/api/employees/${user.id}/profile-image`, { profile_image: base64Image });
      if (res.data.success) {
        const updated = { ...user, profile_image: base64Image };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated); setProfileImage(base64Image);
        toast.success('Profile photo updated!');
      } else throw new Error(res.data.message);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile photo: ' + (err.response?.data?.message || err.message));
      setImagePreview(profileImage);
    } finally { setUploading(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwordForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoadingPw(true);
    try {
      await axios.put(`/api/employees/${user.id}/password`, { password: passwordForm.password });
      toast.success('Password updated successfully');
      setPasswordForm({ password: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error updating password'); }
    finally { setLoadingPw(false); }
  };

  const getRoleBadge = (role) => {
    const map = {
      'Super Admin': 'bg-indigo-600 text-white shadow-indigo-100',
      'Admin': 'bg-blue-600 text-white shadow-blue-100',
      'Developer': 'bg-slate-900 text-white shadow-slate-100',
      'Employee ERP': 'bg-emerald-600 text-white shadow-emerald-100',
      'Employee CRM': 'bg-sky-600 text-white shadow-sky-100',
    };
    return map[role] || 'bg-gray-600 text-white shadow-gray-100';
  };

  return (
    <>
      {cropModalOpen && <CropModal rawImage={rawCropImage} onSave={handleCropSave} onCancel={() => setCropModalOpen(false)} />}

      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Profile Hero Card ─────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100/60">

          {/* Cover */}
          <div className="h-32 relative overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.2),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(139,92,246,0.15),transparent_40%)]" />

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Floating Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-[80px]" />

            {/* Corner Badge */}
            <div className="absolute top-6 right-6 flex flex-wrap items-center gap-2 bg-white/5 backdrop-blur-md text-white/90 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl ring-1 ring-white/10 shadow-2xl">
              <Sparkles size={14} className="text-amber-400" />
              Verified Profile
            </div>
          </div>

          {/* Info row */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-10 relative z-10 px-4 md:px-0 -mt-12">

              {/* Avatar Group */}
              <div className="relative w-fit group/av" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] bg-white flex items-center justify-center transition-all duration-300 group-hover/av:scale-[1.02] border-[12px] border-white">
                  {imagePreview
                    ? <img src={imagePreview} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                    : <div className="w-full h-full bg-slate-50 border-4 border-blue-600/20 flex items-center justify-center rounded-2xl shadow-inner uppercase">
                      <span className="text-blue-600 text-7xl font-black select-none tracking-tighter italic">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    </div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/av:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                    <Camera size={32} className="text-white" />
                    <span className="text-white text-xs font-black uppercase tracking-[.3em]">Update</span>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-white/95 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-12 h-12 border-[3px] border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-gray-100/50 pointer-events-none transition-transform group-hover/av:scale-110">
                  <div className="w-12 h-12 bg-white border-2 border-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Camera size={22} className="text-blue-600" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Name & Title Box */}
              <div className="flex-1 md:pt-14 space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">{user.name || 'Your Name'}</h2>
                  <div className={`text-[11px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-2xl shadow-sm border border-black/5 ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold tracking-tight">
                  <div className="flex flex-wrap items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-default group/mail">
                    <Mail size={18} className="text-slate-400 group-hover/mail:text-slate-600 transition-colors" />
                    <span className="text-base font-bold text-slate-600 group-hover/mail:text-slate-900 transition-colors">{user.email || '—'}</span>
                  </div>

                  {user.role === 'Super Admin' && (
                    <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl ring-1 ring-emerald-200 shadow-sm">
                      <ShieldCheck size={18} className="fill-emerald-600/10 text-emerald-600" />
                      <span className="tracking-[0.2em]">VERIFIED SUPER ADMIN</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: <User size={16} className="text-blue-500" />, label: 'Full Name', value: user.name || '—', color: 'blue' },
                { icon: <Mail size={16} className="text-violet-500" />, label: 'Email', value: user.email || '—', color: 'violet' },
                { icon: <BadgeInfo size={16} className="text-indigo-500" />, label: 'Role', value: user.role || '—', color: 'indigo' },
              ].map(({ icon, label, value, color }, i) => (
                <div key={i} className="bg-gray-50/80 rounded-2xl px-4 py-3 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">{icon}<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span></div>
                  <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Security Card ───────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/60 p-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <Lock size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Security Settings</h3>
              <p className="text-xs text-gray-400">Change your account password</p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-blue-100 via-gray-100 to-transparent mb-6" />

          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            {[
              { label: 'New Password', key: 'password', show: showPassword, toggle: () => setShowPassword(v => !v), placeholder: 'Enter new password' },
              { label: 'Confirm Password', key: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(v => !v), placeholder: 'Re-enter password' },
            ].map(({ label, key, show, toggle, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-black text-gray-600 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 outline-none transition-all text-sm text-gray-800 placeholder-gray-400"
                    placeholder={placeholder}
                    value={passwordForm[key]}
                    onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                  />
                  <button type="button" onClick={toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {/* Match indicator */}
            {passwordForm.confirmPassword && (
              <p className={`text-xs font-bold flex items-center gap-1 -mt-1 ${passwordForm.password === passwordForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                {passwordForm.password === passwordForm.confirmPassword
                  ? <><CheckCircle size={11} /> Passwords match</>
                  : <><X size={11} /> Passwords do not match</>}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingPw}
              className="mt-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-blue-200/60 transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {loadingPw
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Lock size={14} />}
              {loadingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AccountControl;
