import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { Search, Plus, FileText, Download, Printer, Filter, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InvoiceManagement = ({ initialTab = 'history' }) => {
  const [view, setView] = useState(initialTab === 'generate' ? 'generate' : 'list');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [client, setClient] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('INR');
  const [isRecurring, setIsRecurring] = useState(false);
  const [items, setItems] = useState([{ description: '', qty: 1, rate: 0 }]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('/api/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching invoice history');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleAddItem = () => {
    setItems([...items, { description: '', qty: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'description' ? value : Number(value);
    setItems(newItems);
  };

  const handleGenerateInvoice = async () => {
    if (!client) return toast.error('Please select a client');

    const doc = new jsPDF();
    const invId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text('ERPMaster IT Solutions', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('TAX INVOICE', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Invoice ID: ${invId}`, 20, 45);
    doc.text(`Date: ${date}`, 20, 52);
    doc.text(`Client: ${client}`, 20, 59);

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: items.map(item => [
        item.description,
        item.qty,
        `₹${item.rate.toFixed(2)}`,
        `₹${(item.qty * item.rate).toFixed(2)}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`Tax (18%): ₹${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ₹${total.toFixed(2)}`, 140, finalY + 15);

    doc.save(`${invId}_${client}.pdf`);

    // Save to Database
    console.log('Sending invoice payload:', { id: invId, client_name: client, total_amount: total, invoice_date: date, items, currency, is_recurring: isRecurring });
    try {
      const res = await axios.post('/api/invoices', {
        id: invId,
        client_name: client,
        total_amount: total,
        invoice_date: date,
        items: items,
        currency: currency,
        is_recurring: isRecurring
      });
      console.log('Server response:', res.data);
      if (res.data.success) {
        toast.success('Invoice generated and saved');
        fetchInvoices();
        setView('list');
        setItems([{ description: '', qty: 1, rate: 0 }]);
        setClient('');
      } else {
        toast.error(res.data.message || 'Error generating invoice');
      }
    } catch (err) {
      console.error('Invoice save technical error:', err);
      toast.error(err.response?.data?.message || 'Error saving invoice to database');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Invoice Management</h3>
          <p className="text-gray-500 font-medium">Generate professional invoices and track client payments</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Invoice History
          </button>
          <button
            onClick={() => setView('generate')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'generate' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Generate Invoice
          </button>
        </div>
      </div>

      {view === 'generate' ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700">Client Name</label>
              <input
                type="text"
                placeholder="Enter Client Name (e.g. Acme Corp)"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Invoice Date</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Currency</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="mb-8">
            <label className="flex items-center gap-2 cursor-pointer w-max">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
              />
              <span className="text-sm font-bold text-gray-700">Set as Recurring Invoice (Monthly)</span>
            </label>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <input
                        placeholder="Development Services"
                        className="w-full bg-transparent outline-none text-sm"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-20 bg-transparent outline-none text-sm"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        placeholder="0.00"
                        className="w-24 bg-transparent outline-none text-sm"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 flex items-center justify-between">
                      {`₹${(item.qty * item.rate).toFixed(2)}`}
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleAddItem}
              className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Note: This will generate a professional PDF invoice.</p>
            </div>
            <div className="text-right space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p className="text-sm font-medium text-gray-500">Tax (18%): ₹{tax.toFixed(2)}</p>
                <p className="text-2xl font-extrabold text-blue-600">Total: ₹{total.toFixed(2)}</p>
              </div>
              <button
                onClick={handleGenerateInvoice}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                Generate & Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-gray-900">Invoice History</h3>
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input placeholder="Search invoices..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500">
                <Filter size={20} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{inv.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{inv.client_name || inv.client}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{inv.total_amount || inv.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2 text-gray-400">
                        <button className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Download size={16} /></button>
                        <button className="p-2 hover:text-gray-600 hover:bg-gray-50 rounded-lg"><Printer size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
