import React, { useState, useEffect, useRef } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { FileSignature, CheckCircle, Clock, X, PenTool } from 'lucide-react';

const SignaturePad = ({ onSign, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a';
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    // Check if empty by comparing to blank canvas
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (dataUrl === blank.toDataURL('image/png')) {
      toast.error("Please provide a signature");
      return;
    }
    onSign(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><PenTool size={18}/> E-Signature Pad</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">Please sign below using your mouse or touch screen.</p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair bg-white touch-none"
              style={{ width: '400px', height: '200px' }}
            />
          </div>
          <div className="flex justify-between items-center">
            <button onClick={clearCanvas} className="text-slate-500 text-sm hover:text-slate-700 font-bold underline">Clear Signature</button>
            <div className="flex gap-2">
              <button onClick={onCancel} className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={saveSignature} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">Sign Document</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingContract, setSigningContract] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/client-management/contracts');
      if (res.data.success) {
        setContracts(res.data.contracts);
      }
    } catch (err) {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signatureData) => {
    if (!signingContract) return;
    try {
      const payload = {
        signature: signatureData,
        role: 'admin' // Could be dynamic if logged in as client
      };
      const res = await axios.put(`/api/client-management/contracts/${signingContract.id}/sign`, payload);
      if (res.data.success) {
        toast.success('Contract signed successfully!');
        setSigningContract(null);
        fetchContracts();
      }
    } catch (err) {
      toast.error('Failed to sign contract');
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><FileSignature /> Contracts & E-Signatures</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold grid grid-cols-5 text-sm text-slate-700">
          <div>Client Name</div>
          <div>Proposal ID</div>
          <div>Status</div>
          <div>Signatures</div>
          <div className="text-right">Actions</div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No contracts found</div>
        ) : (
          contracts.map(c => (
            <div key={c.id} className="p-4 border-b border-slate-100 grid grid-cols-5 items-center hover:bg-slate-50 text-sm">
              <div className="font-medium text-slate-800">{c.client_name}</div>
              <div className="text-slate-600">#{c.proposal_id}</div>
              <div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${c.status === 'Signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {c.status}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-xs flex items-center gap-1 ${c.admin_signature ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {c.admin_signature ? <CheckCircle size={12}/> : <Clock size={12}/>} Admin 
                </span>
                <span className={`text-xs flex items-center gap-1 ${c.client_signature ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {c.client_signature ? <CheckCircle size={12}/> : <Clock size={12}/>} Client
                </span>
              </div>
              <div className="text-right">
                {!c.admin_signature && (
                  <button 
                    onClick={() => setSigningContract(c)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    E-Sign Contract
                  </button>
                )}
                {c.admin_signature && (
                  <button 
                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    View PDF
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {signingContract && (
        <SignaturePad 
          onSign={handleSign}
          onCancel={() => setSigningContract(null)}
        />
      )}
    </div>
  );
};

export default ClientContracts;
