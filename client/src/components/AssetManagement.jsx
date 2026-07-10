import React, { useState } from 'react';
import {
  Laptop,
  Monitor,
  Smartphone,
  Car,
  Armchair,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Filter,
  Download,
  Plus,
  QrCode,
  User,
  MoreVertical,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

const mockAssets = [
  { id: 'AST-001', name: 'MacBook Pro M2', category: 'Laptop', status: 'Assigned', assignee: 'John Doe', purchaseDate: '2023-01-15', value: 120000 },
  { id: 'AST-002', name: 'Dell XPS 15', category: 'Laptop', status: 'Available', assignee: null, purchaseDate: '2023-03-20', value: 95000 },
  { id: 'AST-003', name: 'Herman Miller Chair', category: 'Furniture', status: 'Assigned', assignee: 'Jane Smith', purchaseDate: '2022-11-10', value: 45000 },
  { id: 'AST-004', name: 'LG 27" 4K Monitor', category: 'Monitor', status: 'Maintenance', assignee: null, purchaseDate: '2023-05-12', value: 25000 },
  { id: 'AST-005', name: 'Company Honda City', category: 'Vehicle', status: 'Assigned', assignee: 'Rajesh Kumar', purchaseDate: '2021-08-01', value: 1100000 },
];

export default function AssetManagement() {
  const [activeTab, setActiveTab] = useState('directory');
  const [assets, setAssets] = useState(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const stats = {
    total: assets.length,
    assigned: assets.filter(a => a.status === 'Assigned').length,
    available: assets.filter(a => a.status === 'Available').length,
    maintenance: assets.filter(a => a.status === 'Maintenance').length,
    totalValue: assets.reduce((sum, a) => sum + a.value, 0)
  };

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.assignee && a.assignee.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Laptop': return <Laptop size={18} />;
      case 'Monitor': return <Monitor size={18} />;
      case 'Vehicle': return <Car size={18} />;
      case 'Furniture': return <Armchair size={18} />;
      default: return <Smartphone size={18} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">Available</span>;
      case 'Assigned': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">Assigned</span>;
      case 'Maintenance': return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">Maintenance</span>;
      default: return null;
    }
  };

  const handleDownloadQR = (assetId) => {
    // Generate QR using public API for demo purposes
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(assetId)}`;

    // Simulate download
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `QR_${assetId}.png`;
        link.click();
        toast.success('QR Code downloaded successfully!');
      })
      .catch(console.error);
  };

  return (
    <div className="space-y-6">

      {/* Header & Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Asset Management</h1>
          <p className="text-sm text-gray-500 font-medium">Track, assign, and maintain company assets</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'directory', label: 'Directory' },
            { id: 'assignment', label: 'Assignments' },
            { id: 'maintenance', label: 'Maintenance' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4"><Laptop size={20} /></div>
              <h3 className="text-gray-500 text-sm font-bold">Total Assets</h3>
              <p className="text-3xl font-black text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><CheckCircle2 size={20} /></div>
              <h3 className="text-gray-500 text-sm font-bold">Available</h3>
              <p className="text-3xl font-black text-emerald-600">{stats.available}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><User size={20} /></div>
              <h3 className="text-gray-500 text-sm font-bold">Assigned</h3>
              <p className="text-3xl font-black text-blue-600">{stats.assigned}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Wrench size={20} /></div>
              <h3 className="text-gray-500 text-sm font-bold">Maintenance</h3>
              <p className="text-3xl font-black text-amber-600">{stats.maintenance}</p>
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-3xl text-white flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shadow-lg shadow-blue-200">
            <div>
              <h2 className="text-lg font-medium text-blue-100">Total Portfolio Value</h2>
              <p className="text-4xl font-black tracking-tight mt-1">₹ {stats.totalValue.toLocaleString('en-IN')}</p>
            </div>
            <Activity size={48} className="text-blue-400 opacity-50" />
          </div>
        </div>
      )}

      {/* DIRECTORY TAB */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by ID, Name, or Assignee..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50">
                <Filter size={16} /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm shadow-blue-200">
                <Plus size={16} /> Add Asset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Asset Details</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Purchase Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{asset.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{asset.id} &bull; {asset.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4">
                      {asset.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                            {asset.assignee.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{asset.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedAsset(asset); setIsQrModalOpen(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger"
                          title="Generate QR Tag"
                        >
                          <QrCode size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black text-gray-900 mb-1">Asset Tag QR Code</h2>
            <p className="text-sm text-gray-500 mb-6">{selectedAsset.id} - {selectedAsset.name}</p>

            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 inline-block mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedAsset.id)}`}
                alt="QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadQR(selectedAsset.id)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-200"
              >
                <Download size={16} /> Print Tag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
