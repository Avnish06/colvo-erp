import React, { useState, useEffect, useCallback } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Database, Download, Trash2, Plus, RefreshCw, HardDrive,
  Table2, Layers, Clock, Shield, AlertTriangle, CheckCircle2
} from 'lucide-react';

const DatabaseBackup = () => {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await axios.get('/api/backup/list');
      if (res.data.success) setBackups(res.data.data);
    } catch (err) {
      toast.error('Failed to load backups');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/backup/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchBackups(), fetchStats()]).finally(() => setLoading(false));
  }, [fetchBackups, fetchStats]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await axios.post('/api/backup');
      if (res.data.success) {
        toast.success('Backup created successfully!');
        await Promise.all([fetchBackups(), fetchStats()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (fileName) => {
    setDownloadingId(fileName);
    try {
      const url = fileName
        ? `/api/backup/download/${fileName}`
        : '/api/backup/download';
      const res = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/sql' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName || `backup_${Date.now()}.sql`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Download started!');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) return;
    setDeletingId(fileName);
    try {
      const res = await axios.delete(`/api/backup/${fileName}`);
      if (res.data.success) {
        toast.success('Backup deleted');
        await Promise.all([fetchBackups(), fetchStats()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400">Loading backup system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
              <Database size={24} />
            </div>
            Database Backup
          </h2>
          <p className="text-gray-500 font-medium mt-1 ml-14">Manage and protect your data with secure backups</p>
        </div>
        <div className="flex flex-wrap gap-3 ml-14 md:ml-0">
          <button
            onClick={() => { fetchBackups(); fetchStats(); }}
            className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className={`px-6 py-3 font-black uppercase text-[11px] tracking-[0.15em] rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.97] ${
              creating
                ? 'bg-gray-100 text-gray-400 shadow-none'
                : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:shadow-xl'
            }`}
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} /> Create Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="p-2 bg-violet-50 rounded-xl"><Table2 size={18} className="text-violet-600" /></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tables</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.tableCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 rounded-xl"><Layers size={18} className="text-emerald-600" /></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Rows</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.totalRows.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-xl"><HardDrive size={18} className="text-blue-600" /></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Backups</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{stats.backupCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 rounded-xl"><Database size={18} className="text-amber-600" /></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Storage</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{formatSize(stats.totalBackupSize)}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-2xl shadow-slate-300/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Shield size={28} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Quick Download</h3>
              <p className="text-slate-400 text-sm font-medium">Generate a fresh backup and download it instantly</p>
            </div>
          </div>
          <button
            onClick={() => handleDownload(null)}
            disabled={downloadingId === null && false}
            className="px-8 py-4 bg-white text-slate-900 font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-lg hover:bg-blue-50 transition-all active:scale-[0.97] flex items-center gap-3"
          >
            <Download size={18} /> Download Fresh Backup
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-gray-400" /> Backup History
          </h3>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
            {backups.length} backup{backups.length !== 1 ? 's' : ''}
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Database size={32} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-500 mb-1">No backups yet</p>
            <p className="text-sm">Click "Create Backup" to generate your first backup</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {backups.map((backup, index) => (
              <div
                key={backup.fileName}
                className="px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    index === 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {index === 0 ? <CheckCircle2 size={20} /> : <Database size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      {backup.fileName}
                      {index === 0 && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Latest</span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <HardDrive size={12} /> {formatSize(backup.size)}
                      </span>
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Clock size={12} /> {formatDate(backup.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity ml-14 md:ml-0">
                  <button
                    onClick={() => handleDownload(backup.fileName)}
                    disabled={downloadingId === backup.fileName}
                    className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1.5"
                  >
                    {downloadingId === backup.fileName ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(backup.fileName)}
                    disabled={deletingId === backup.fileName}
                    className="px-4 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition-all flex items-center gap-1.5"
                  >
                    {deletingId === backup.fileName ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 flex flex-wrap items-start gap-4">
        <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-sm">Important</p>
          <p className="text-amber-700 text-sm mt-1">
            Backups are stored on the server. For maximum protection, regularly download backups and store them in an off-site location. Deleting a backup is permanent and cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackup;
