import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Mail, Send, FileText, Settings, Plus, X,
  Trash2, Edit, CheckCircle, Clock, Info,
  ChevronRight, Search, Zap, Layout,
  Phone, MessageSquare, PhoneCall, AlertCircle,
  Calendar, Smartphone, Share2
} from 'lucide-react';


const Communication = ({ initialTab }) => {
  const [mainCategory, setMainCategory] = useState('email'); // email, calls, messages
  const [activeTab, setActiveTab] = useState('send');
  const [templates, setTemplates] = useState([{ id: 999, name: 'HARDCODED TEST', subject: 'Test', body: 'Test body', type: 'General' }]);
  const [logs, setLogs] = useState([]);
  const [automation, setAutomation] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [messageLogs, setMessageLogs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Email State
  const [emailForm, setEmailForm] = useState({ recipient_email: '', subject: '', body: '', template_id: '' });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '', type: 'General' });
  const [isProEdit, setIsProEdit] = useState(true);
  const [editableBlocks, setEditableBlocks] = useState([]);
  
  const [isProEditCompose, setIsProEditCompose] = useState(true);
  const [composeBlocks, setComposeBlocks] = useState([]);

  // Call State
  const [callForm, setCallForm] = useState({ contact_id: '', contact_type: 'Lead', duration: '', notes: '' });
  const [reminderForm, setReminderForm] = useState({ contact_id: '', contact_type: 'Lead', remind_at: '', notes: '' });

  // Message State
  const [messageForm, setMessageForm] = useState({ recipient: '', platform: 'WhatsApp', message: '' });

  // Sync with Dashboard selection
  useEffect(() => {
    if (initialTab) {
      if (initialTab.startsWith('CommSend') || initialTab === 'CommTemplates' || initialTab === 'CommAuto') {
        setMainCategory('email');
        if (initialTab === 'CommTemplates') setActiveTab('templates');
        else if (initialTab === 'CommAuto') setActiveTab('automation');
        else setActiveTab('send');
      } else if (initialTab.startsWith('CommCalls') || initialTab === 'CommReminders' || initialTab === 'CommAlerts') {
        setMainCategory('calls');
        if (initialTab === 'CommReminders' || initialTab === 'CommAlerts') setActiveTab('reminders');
        else setActiveTab('send');
      } else if (initialTab.startsWith('CommMsg') || initialTab === 'CommCampaigns') {
        setMainCategory('messages');
        if (initialTab === 'CommCampaigns') setActiveTab('campaigns');
        else setActiveTab('send');
      }
    }
  }, [initialTab]);

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
    fetchAutomation();
    fetchCallLogs();
    fetchReminders();
    fetchMessageLogs();
    fetchLeads();
    fetchCustomers();
  }, []);

  const fetchTemplates = async () => { 
    console.log('[CommHub] Fetching templates...');
    try { 
      const res = await axios.get('/api/communication/templates'); 
      console.log('[CommHub] Templates response:', res.data);
      if (res.data.success) setTemplates(res.data.data); 
    } catch (err) { 
      console.error('[CommHub] Fetch Error:', err); 
    } 
  };
  const fetchLogs = async () => { try { const res = await axios.get('/api/communication/logs'); if (res.data.success) setLogs(res.data.data); } catch (err) { console.error(err); } };
  const fetchAutomation = async () => { try { const res = await axios.get('/api/communication/automation'); if (res.data.success) setAutomation(res.data.data); } catch (err) { console.error(err); } };
  const fetchCallLogs = async () => { try { const res = await axios.get('/api/communication/calls'); if (res.data.success) setCallLogs(res.data.data); } catch (err) { console.error(err); } };
  const fetchReminders = async () => { try { const res = await axios.get('/api/communication/reminders'); if (res.data.success) setReminders(res.data.data); } catch (err) { console.error(err); } };
  const fetchMessageLogs = async () => { try { const res = await axios.get('/api/communication/messages'); if (res.data.success) setMessageLogs(res.data.data); } catch (err) { console.error(err); } };
  const fetchLeads = async () => { try { const res = await axios.get('/api/leads'); if (res.data.success) setLeads(res.data.data); } catch (err) { console.error(err); } };
  const fetchCustomers = async () => { try { const res = await axios.get('/api/customers'); if (res.data.success) setCustomers(res.data.data); } catch (err) { console.error(err); } };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try { setLoading(true); await axios.post('/api/communication/send', emailForm); toast.success('Email dispatched'); setEmailForm({ recipient_email: '', subject: '', body: '', template_id: '' }); fetchLogs(); }
    catch (err) { toast.error('Error sending email'); } finally { setLoading(false); }
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/communication/calls', callForm); toast.success('Call logged'); setCallForm({ contact_id: '', contact_type: 'Lead', duration: '', notes: '' }); fetchCallLogs(); }
    catch (err) { toast.error('Error logging call'); }
  };

  const handleSetReminder = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/communication/reminders', reminderForm); toast.success('Reminder set'); setReminderForm({ contact_id: '', contact_type: 'Lead', remind_at: '', notes: '' }); fetchReminders(); }
    catch (err) { toast.error('Error setting reminder'); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try { await axios.post('/api/communication/messages', messageForm); toast.success(`${messageForm.platform} message sent`); setMessageForm({ recipient: '', platform: 'WhatsApp', message: '' }); fetchMessageLogs(); }
    catch (err) { toast.error('Error sending message'); }
  };

  // --- Professional Editor Helpers ---
  
  // Extract text content from HTML while preserving structure
  const parseBlocks = useCallback((html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const blocks = [];
    
    const walk = (node) => {
      // 1. Detect Links/Buttons (<a> tags)
      if (node.nodeName === 'A') {
        blocks.push({
          type: 'link',
          text: node.innerText.trim(),
          href: node.getAttribute('href') || '#',
          path: getPath(node)
        });
        return; // Don't process children of <a> as separate text blocks
      }

      // 2. Detect Standard Text Nodes
      if (node.nodeType === 3 && node.nodeValue.trim().length > 1) {
        blocks.push({
          type: 'text',
          original: node.nodeValue,
          current: node.nodeValue,
          path: getPath(node)
        });
      }
      
      node.childNodes.forEach(walk);
    };

    const getPath = (node) => {
      const path = [];
      let current = node;
      while (current && current.parentNode) {
        const index = Array.from(current.parentNode.childNodes).indexOf(current);
        path.unshift(index);
        current = current.parentNode;
      }
      return path;
    };

    walk(div);
    return blocks;
  }, []);

  const updateHtmlFromBlocks = (html, blocks) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    
    blocks.forEach(block => {
      let current = div;
      for (let i = 0; i < block.path.length; i++) {
        const childIndex = block.path[i];
        if (!current.childNodes[childIndex]) break;
        
        if (i === block.path.length - 1) {
          const target = current.childNodes[childIndex];
          if (block.type === 'link' && target.nodeName === 'A') {
            target.innerText = block.text;
            target.setAttribute('href', block.href);
          } else {
            target.nodeValue = block.current;
          }
        } else {
          current = current.childNodes[childIndex];
        }
      }
    });
    
    return div.innerHTML;
  };

  // Only parse blocks when modal opens or template is loaded into modal
  const initTemplateProMode = (html) => {
    if (!html) return;
    const blocks = parseBlocks(html);
    setEditableBlocks(blocks);
  };

  const handleBlockChange = (index, value, field = 'current') => {
    const newBlocks = [...editableBlocks];
    newBlocks[index][field] = value;
    setEditableBlocks(newBlocks);
    
    // Auto-sync back to templateForm WITHOUT triggering the useEffect re-parse
    const newBody = updateHtmlFromBlocks(templateForm.body, newBlocks);
    setTemplateForm(prev => ({ ...prev, body: newBody }));
  };

  const handleComposeBlockChange = (index, value, field = 'current') => {
    const newBlocks = [...composeBlocks];
    newBlocks[index][field] = value;
    setComposeBlocks(newBlocks);
    
    const newBody = updateHtmlFromBlocks(emailForm.body, newBlocks);
    setEmailForm(prev => ({ ...prev, body: newBody }));
  };

  const categories = [
    { id: 'email', label: 'Email Integration', icon: <Mail size={18} /> },
    { id: 'calls', label: 'Call Center', icon: <Phone size={18} /> },
    { id: 'messages', label: 'Messages & Campaigns', icon: <MessageSquare size={18} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setMainCategory(cat.id); setActiveTab('send'); }}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${mainCategory === cat.id
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.05]'
              : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200'
              }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-gray-100 w-fit">
        {mainCategory === 'email' && [
          { id: 'send', label: 'Send Hub', icon: <Send size={14} /> },
          { id: 'templates', label: 'Templates', icon: <Layout size={14} /> },
          { id: 'automation', label: 'Auto Emails', icon: <Zap size={14} /> },
          { id: 'logs', label: 'History', icon: <Clock size={14} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-[11px] transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-indigo-600'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
        {mainCategory === 'calls' && [
          { id: 'send', label: 'Log Call', icon: <PhoneCall size={14} /> },
          { id: 'reminders', label: 'Reminders', icon: <Calendar size={14} /> },
          { id: 'logs', label: 'Call Logs', icon: <Clock size={14} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-[11px] transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-indigo-600'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
        {mainCategory === 'messages' && [
          { id: 'send', label: 'New Message', icon: <Smartphone size={14} /> },
          { id: 'campaigns', label: 'Campaigns', icon: <Share2 size={14} /> },
          { id: 'logs', label: 'History', icon: <Clock size={14} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-[11px] transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-indigo-600'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[500px]">
        {mainCategory === 'email' && activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-black text-gray-900 border-l-4 border-indigo-600 pl-4">Compose Communication</h3>
              <form onSubmit={handleSendEmail} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Recipient Email</label>
                    <input required type="email" placeholder="customer@example.com" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 font-outfit" value={emailForm.recipient_email} onChange={(e) => setEmailForm({ ...emailForm, recipient_email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Load Template</label>
                    <div className="flex flex-wrap gap-2">
                      <select className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={emailForm.template_id} onChange={(e) => { 
                        const t = templates.find(temp => temp.id === parseInt(e.target.value)); 
                        if (t) {
                          setEmailForm({ ...emailForm, subject: t.subject, template_id: e.target.value, body: t.body });
                          // Parse blocks for Pro Mode in Compose
                          const blocks = parseBlocks(t.body);
                          setComposeBlocks(blocks);
                          if (t.body.trim().startsWith('<')) setShowEmailPreview(true);
                          else setShowEmailPreview(false);
                        } else {
                          setEmailForm({ ...emailForm, template_id: '', subject: '', body: '' });
                          setComposeBlocks([]);
                        }
                      }}>
                        <option value="">Select a template...</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => {
                          const t = templates.find(temp => temp.id === parseInt(emailForm.template_id));
                          if (t) {
                            const newBody = emailForm.body ? `${emailForm.body}\n\n${t.body}` : t.body;
                            const newSubject = emailForm.subject ? emailForm.subject : t.subject;
                            setEmailForm({ ...emailForm, body: newBody, subject: newSubject });
                            // Auto-toggle preview if new content is HTML
                            if (newBody.trim().includes('<')) setShowEmailPreview(true);
                            toast.info('Template appended');
                          } else {
                            toast.warning('Select a template first');
                          }
                        }}
                        className="px-4 bg-gray-100 text-indigo-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        title="Append to message"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subject Line</label>
                  <input required type="text" placeholder="Subject" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-4 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Body</label>
                    <div className="flex flex-wrap gap-2">
                       <button 
                        type="button" 
                        onClick={() => setIsProEditCompose(!isProEditCompose)}
                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg transition-all ${isProEditCompose ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {isProEditCompose ? '✓ Pro Edit' : 'Pro Edit'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowEmailPreview(!showEmailPreview)}
                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg transition-all ${showEmailPreview ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}
                      >
                        {showEmailPreview ? 'Back to Editor' : 'Visual Preview'}
                      </button>
                    </div>
                  </div>
                  {showEmailPreview ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            {isProEditCompose ? 'Pro Block Editor' : 'Direct Layout Edit'}
                          </span>
                          <button 
                           type="button" 
                           onClick={() => {
                             const t = templates.find(temp => temp.id === parseInt(emailForm.template_id));
                             if (t) {
                               setEmailForm({...emailForm, body: t.body});
                               setComposeBlocks(parseBlocks(t.body));
                             }
                           }}
                           className="text-[9px] font-black text-red-500 uppercase px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                         >
                           Reset Variation
                         </button>
                        </div>

                        {isProEditCompose ? (
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar border border-gray-100 p-4 rounded-3xl bg-gray-50/50">
                            {composeBlocks.length > 0 ? (
                              composeBlocks.map((block, idx) => (
                                <div key={idx} className="space-y-1 bg-white p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all shadow-sm">
                                   <div className="flex justify-between items-center">
                                     <span className="text-[8px] font-black text-indigo-400 uppercase">
                                       {block.type === 'link' ? 'Button / Link' : `Line #${idx + 1}`}
                                     </span>
                                     {block.type === 'link' ? (
                                       <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                                         <Share2 size={8} /> Active Button
                                       </span>
                                     ) : (
                                       block.current.includes('[') && <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">Variable</span>
                                     )}
                                   </div>
                                   {block.type === 'link' ? (
                                     <div className="space-y-3 mt-2">
                                       <div className="space-y-1">
                                         <label className="text-[7px] font-black text-gray-400 uppercase">Button Label</label>
                                         <input 
                                           className="w-full bg-gray-50 px-3 py-2 rounded-lg outline-none font-bold text-gray-700 text-xs border border-transparent focus:border-indigo-100"
                                           value={block.text}
                                           onChange={(e) => handleComposeBlockChange(idx, e.target.value, 'text')}
                                         />
                                       </div>
                                       <div className="space-y-1">
                                         <label className="text-[7px] font-black text-gray-400 uppercase">Redirect URL</label>
                                         <div className="flex flex-wrap items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-transparent focus-within:border-indigo-100 transition-all">
                                            <Zap size={10} className="text-amber-400" />
                                            <input 
                                              className="w-full bg-transparent outline-none font-bold text-indigo-600 text-[11px]"
                                              value={block.href}
                                              onChange={(e) => handleComposeBlockChange(idx, e.target.value, 'href')}
                                            />
                                         </div>
                                       </div>
                                     </div>
                                   ) : (
                                     <textarea 
                                       className="w-full bg-transparent outline-none font-bold text-gray-700 text-sm resize-none"
                                       rows={block.current.length > 50 ? 3 : 1}
                                       value={block.current}
                                       onChange={(e) => handleComposeBlockChange(idx, e.target.value)}
                                     />
                                   )}
                                </div>
                              ))
                            ) : (
                              <p className="py-20 text-center text-gray-400 italic text-xs">Load a template to see editable blocks.</p>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="w-full px-8 py-6 bg-gray-50 border border-gray-100 rounded-3xl min-h-[300px] prose prose-sm max-w-none overflow-auto"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setEmailForm({ ...emailForm, body: e.currentTarget.innerHTML })}
                            dangerouslySetInnerHTML={{ __html: emailForm.body || '<p style="color:#94a3b8;font-style:italic">Start typing or load a template...</p>' }}
                            style={{ outline: 'none', cursor: 'text' }}
                          />
                        )}
                      </div>
                      <div className="hidden xl:block">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Live Professional Preview</span>
                        <div 
                          className="w-full h-[540px] border border-gray-100 rounded-[2.5rem] bg-white overflow-auto shadow-inner p-4 scale-95 origin-top"
                          dangerouslySetInnerHTML={{ __html: emailForm.body }}
                        />
                      </div>
                    </div>
                  ) : (
                    <textarea required rows="8" placeholder="Content (HTML supported)..." className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-bold text-gray-700 resize-none font-mono text-sm" value={emailForm.body} onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}></textarea>
                  )}
                </div>
                <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                  {loading ? 'Sending...' : <><Send size={18} /> Send Email</>}
                </button>
              </form>
            </div>
            <div className="lg:col-span-1 border-l border-gray-100 pl-4 space-y-6 hidden lg:block">
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 font-outfit">Quick Tips</h4>
              <div className="p-6 bg-indigo-50 rounded-3xl space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shrink-0"><CheckCircle size={16} /></div>
                  <p className="text-xs text-indigo-900 italic">Templates support dynamic placeholders.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {mainCategory === 'calls' && activeTab === 'send' && (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-black text-gray-900 border-l-4 border-indigo-600 pl-4 font-outfit">Log Manual Call</h3>
            <form onSubmit={handleLogCall} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Type</label>
                  <select className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={callForm.contact_type} onChange={(e) => setCallForm({ ...callForm, contact_type: e.target.value })}>
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Contact</label>
                  <select required className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={callForm.contact_id} onChange={(e) => setCallForm({ ...callForm, contact_id: e.target.value })}>
                    <option value="">Select...</option>
                    {callForm.contact_type === 'Lead' ? leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>) : customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Duration</label>
                <input type="text" placeholder="15m" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={callForm.duration} onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notes</label>
                <textarea rows="4" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-bold text-gray-700 resize-none" value={callForm.notes} onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}></textarea>
              </div>
              <div className="flex flex-wrap gap-4">
                <button type="submit" className="flex-1 py-4 bg-gray-100 text-gray-700 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3">
                  <PhoneCall size={18} /> Log Manual
                </button>
                <button 
                  type="button"
                  disabled={loading || !callForm.contact_id}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await axios.post('/api/communication/call-initiate', {
                        contact_id: callForm.contact_id,
                        contact_type: callForm.contact_type
                      });
                      if (res.data.success) toast.success(res.data.message);
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Error initiating call');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'Initiating...' : <><Phone size={18} /> Call Now</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {mainCategory === 'calls' && activeTab === 'reminders' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1 space-y-6">
              <h3 className="text-xl font-black text-gray-900 border-l-4 border-indigo-600 pl-4 font-outfit">Set Reminder</h3>
              <form onSubmit={handleSetReminder} className="p-6 bg-gray-50 rounded-3xl space-y-4">
                <select required className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-xs" value={reminderForm.contact_type} onChange={(e) => setReminderForm({ ...reminderForm, contact_type: e.target.value })}>
                  <option value="Lead">Lead</option>
                  <option value="Customer">Customer</option>
                </select>
                <select required className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-xs" value={reminderForm.contact_id} onChange={(e) => setReminderForm({ ...reminderForm, contact_id: e.target.value })}>
                  <option value="">Select...</option>
                  {reminderForm.contact_type === 'Lead' ? leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>) : customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input required type="datetime-local" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-xs" value={reminderForm.remind_at} onChange={(e) => setReminderForm({ ...reminderForm, remind_at: e.target.value })} />
                <textarea placeholder="Reason..." className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-xs resize-none" value={reminderForm.notes} onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}></textarea>
                <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Schedule</button>
              </form>
            </div>
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xl font-black text-gray-900 font-outfit">Alerts</h3>
              {reminders.map(r => (
                <div key={r.id} className="p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between shadow-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><AlertCircle size={18} /></div>
                    <div><p className="font-bold text-gray-900">{r.contact_name}</p><p className="text-xs text-gray-400 truncate max-w-[200px]">{r.notes}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{new Date(r.remind_at).toLocaleTimeString([], { hour12: true })}</p>
                    <p className="text-[9px] font-black text-gray-300 uppercase">{new Date(r.remind_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {reminders.length === 0 && <p className="text-center py-20 text-gray-400 italic text-xs">Clear.</p>}
            </div>
          </div>
        )}

        {mainCategory === 'messages' && activeTab === 'send' && (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-black text-gray-900 border-l-4 border-indigo-600 pl-4 font-outfit">Instant Messenger</h3>
            <form onSubmit={handleSendMessage} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mobile</label>
                  <input required type="text" placeholder="+91" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={messageForm.recipient} onChange={(e) => setMessageForm({ ...messageForm, recipient: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Load Template</label>
                  <div className="flex flex-wrap gap-2">
                    <select className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" value={messageForm.template_id || ''} onChange={(e) => {
                      const t = templates.find(temp => temp.id === parseInt(e.target.value));
                      if (t) {
                        // Always populate template for better UX
                        setMessageForm({ ...messageForm, message: t.body, template_id: e.target.value });
                      } else {
                        setMessageForm({ ...messageForm, template_id: '' });
                      }
                    }}>
                      <option value="">Select a template...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => {
                        const t = templates.find(temp => temp.id === parseInt(messageForm.template_id));
                        if (t) {
                          const newMessage = messageForm.message ? `${messageForm.message}\n\n${t.body}` : t.body;
                          setMessageForm({ ...messageForm, message: newMessage });
                          toast.info('Template appended');
                        } else {
                          toast.warning('Select a template first');
                        }
                      }}
                      className="px-4 bg-gray-100 text-indigo-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Platform</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setMessageForm({ ...messageForm, platform: 'WhatsApp' })} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${messageForm.platform === 'WhatsApp' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>WhatsApp</button>
                  <button type="button" onClick={() => setMessageForm({ ...messageForm, platform: 'SMS' })} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${messageForm.platform === 'SMS' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>SMS</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Message</label>
                <textarea required rows="5" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-3xl outline-none font-bold resize-none" value={messageForm.message} onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}></textarea>
              </div>
              <button className="w-full py-4 bg-gray-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-gray-800 transition-all">Send Now</button>
            </form>
          </div>
        )}

        {/* Common Views */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-gray-900 border-l-4 border-indigo-600 pl-4 font-outfit">Presets</h3>
              <button onClick={() => { setSelectedTemplate(null); setTemplateForm({ name: '', subject: '', body: '', type: 'General' }); setIsTemplateModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs"><Plus size={16} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(t => (
                <div key={t.id} className="p-6 bg-gray-50 border border-gray-100 rounded-[2rem] hover:border-indigo-200 transition-all group relative">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <span className="text-[9px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded tracking-widest">{t.type}</span>
                    <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { 
                        setSelectedTemplate(t); 
                        setTemplateForm(t); 
                        setIsTemplateModalOpen(true);
                        initTemplateProMode(t.body);
                      }} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit size={14} /></button>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{t.name}</h4>
                  <p className="text-[10px] text-indigo-400 font-bold mb-2 italic">"{t.subject}"</p>
                  <div 
                    className="h-24 overflow-hidden border border-gray-100 rounded-xl bg-white p-2 scale-90 origin-top pointer-events-none opacity-60"
                    dangerouslySetInnerHTML={{ __html: t.body }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-gray-900 border-l-4 border-indigo-600 pl-4 font-outfit">Archive</h3>
            <div className="space-y-4">
              {mainCategory === 'email' && logs.map(l => <div key={l.id} className="p-6 bg-gray-50 rounded-2xl flex items-center justify-between"><div><p className="font-bold text-gray-900">{l.recipient_email}</p><p className="text-xs text-gray-400">{l.subject}</p></div><span className="text-[9px] font-black text-indigo-600">{new Date(l.sent_at).toLocaleString([], { hour12: true })}</span></div>)}
              {mainCategory === 'calls' && callLogs.map(l => <div key={l.id} className="p-6 bg-gray-50 rounded-2xl flex items-center justify-between"><div><p className="font-bold text-gray-900">{l.contact_name}</p><p className="text-xs text-gray-400">{l.duration} · {l.notes}</p></div><span className="text-[9px] font-black text-amber-600">{new Date(l.called_at).toLocaleString([], { hour12: true })}</span></div>)}
              {mainCategory === 'messages' && messageLogs.map(l => <div key={l.id} className="p-6 bg-gray-50 rounded-2xl flex items-center justify-between"><div><p className="font-bold text-gray-900">{l.recipient}</p><p className="text-xs text-gray-400">[{l.platform}] {l.message}</p></div><span className="text-[9px] font-black text-emerald-600">{new Date(l.sent_at).toLocaleString([], { hour12: true })}</span></div>)}
            </div>
          </div>
        )}

        {activeTab === 'automation' && <div className="py-20 text-center text-gray-400 italic">Automation active.</div>}
        {activeTab === 'campaigns' && <div className="py-20 text-center text-gray-400 italic">Campaigns coming soon.</div>}
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in duration-300 h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-gray-900 font-outfit">Email Designer</h3>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Design beautiful HTML templates with dynamic variables</p>
                   <button 
                    type="button"
                    onClick={() => setIsProEdit(!isProEdit)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isProEdit ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}
                   >
                     {isProEdit ? '✓ Professional Mode' : 'Switch to Pro Mode'}
                   </button>
                </div>
              </div>
              <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all" onClick={() => setIsTemplateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Editor Side */}
              <div className="flex-1 p-8 border-r border-gray-50 overflow-y-auto space-y-6">
                <form id="templateForm" onSubmit={async (e) => { e.preventDefault(); try { if (selectedTemplate) await axios.put(`/api/communication/templates/${selectedTemplate.id}`, templateForm); else await axios.post('/api/communication/templates', templateForm); setIsTemplateModalOpen(false); fetchTemplates(); toast.success('Saved'); } catch (err) { toast.error('Error'); } }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Internal Name</label>
                      <input required placeholder="Template Name" className="w-full px-5 py-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-sm" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                      <select className="w-full px-5 py-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-sm" value={templateForm.type} onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}>
                        <option value="General">General</option>
                        <option value="Lead">Lead</option>
                        <option value="Customer">Customer</option>
                        <option value="Promotion">Promotion</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Subject</label>
                    <input required placeholder="Customer Subject Line" className="w-full px-5 py-3 bg-gray-50 rounded-xl border border-gray-100 font-bold text-sm" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {isProEdit ? 'Modify Professional Content' : 'HTML Body Content'}
                      </label>
                      {!isProEdit && (
                        <div className="flex flex-wrap gap-2">
                          {['[name]', '[company]', '[total]', '[login_url]'].map(v => (
                            <button 
                              key={v}
                              type="button" 
                              onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + ' ' + v })}
                              className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black hover:bg-indigo-100 transition-all"
                            >
                              + {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isProEdit ? (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {editableBlocks.length > 0 ? (
                          editableBlocks.map((block, idx) => (
                            <div key={idx} className="space-y-1 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all">
                               <div className="flex justify-between items-center">
                                 <span className="text-[8px] font-black text-indigo-400 uppercase">
                                   {block.type === 'link' ? 'Action Button' : `Text Block #${idx + 1}`}
                                 </span>
                                 {block.type === 'link' ? (
                                   <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Link Detected</span>
                                 ) : (
                                   block.current.includes('[') && <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">Variable</span>
                                 )}
                               </div>
                               {block.type === 'link' ? (
                                  <div className="space-y-3 mt-2">
                                     <div className="space-y-1">
                                        <label className="text-[7px] font-black text-gray-400 uppercase">Label</label>
                                        <input 
                                          className="w-full bg-white px-3 py-2 rounded-lg border border-gray-100 font-bold text-gray-700 text-xs"
                                          value={block.text}
                                          onChange={(e) => handleBlockChange(idx, e.target.value, 'text')}
                                        />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[7px] font-black text-gray-400 uppercase">Redirect URL</label>
                                        <input 
                                          className="w-full bg-white px-3 py-2 rounded-lg border border-gray-100 font-bold text-indigo-600 text-xs"
                                          value={block.href}
                                          onChange={(e) => handleBlockChange(idx, e.target.value, 'href')}
                                        />
                                     </div>
                                  </div>
                               ) : (
                                 <textarea 
                                   className="w-full bg-transparent outline-none font-bold text-gray-700 text-sm resize-none"
                                   rows={block.current.length > 50 ? 3 : 1}
                                   value={block.current}
                                   onChange={(e) => handleBlockChange(idx, e.target.value)}
                                 />
                               )}
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                             <p className="text-gray-400 italic text-xs">No editable text found in this structure.</p>
                             <button type="button" onClick={() => setIsProEdit(false)} className="text-indigo-600 font-bold text-xs mt-2 underline">Use Manual Code</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-2">
                          <button type="button" onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + '\n<div style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 40px; border-radius: 20px; text-align: center;">\n  <h1 style="margin:0;">Welcome!</h1>\n</div>' })} className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all text-center">Hero Header</button>
                          <button type="button" onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + '\n<div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 15px; background: #fff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">\n  <p>Content goes here...</p>\n</div>' })} className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all text-center">Info Card</button>
                          <button type="button" onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + '\n<div style="text-align: center; margin: 20px 0;">\n  <a href="[login_url]" style="background: #4f46e5; color: white; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Get Started Now</a>\n</div>' })} className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all text-center">Action Button</button>
                          <button type="button" onClick={() => setTemplateForm({ ...templateForm, body: templateForm.body + '\n<div style="margin: 40px 0; border-top: 1px solid #f3f4f6; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">\n  &copy; 2026 Management System. All rights reserved.\n</div>' })} className="px-3 py-2 bg-white rounded-lg border border-gray-100 text-[10px] font-bold hover:bg-indigo-600 hover:text-white transition-all text-center">Footer</button>
                        </div>
                        <textarea required rows="10" className="w-full px-6 py-4 bg-gray-50 rounded-3xl border border-gray-100 font-mono text-xs font-bold resize-none h-[250px]" value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} placeholder="Write your HTML here..."></textarea>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* Preview Side */}
              <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Live Visual Preview</label>
                <div className="bg-white rounded-2xl shadow-lg p-8 min-h-full font-sans border border-gray-200">
                  <div className="mb-4 pb-4 border-b border-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Subject:</p>
                    <p className="font-bold text-gray-900">{templateForm.subject || '(Empty Subject)'}</p>
                  </div>
                  <div 
                    className="email-preview-content prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: templateForm.body || '<p class="text-gray-300 italic">No content yet...</p>' }} 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 shrink-0 flex flex-wrap justify-end gap-4 bg-white/80 backdrop-blur-sm">
              <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:text-gray-600 transition-all">Cancel</button>
              <button form="templateForm" className="px-12 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;
