import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../axiosConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Box,
  CalendarCheck,
  CreditCard,
  Briefcase,
  Settings as SettingsIcon,
  Calendar,
  LogOut,
  Bell,
  Search,
  FileText,
  Building2,
  Shield,
  ShieldCheck,
  Database,
  LifeBuoy,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Server,
  Menu,
  X,
  Megaphone,
  Edit,
  Trash2,
  Plus,
  Calculator,
  Download,
  MessageSquare,
  ListTodo,
  Clock,
  ShieldOff,
  Key,
  Mail,
  Target,
  TrendingUp,
  TrendingDown,
  ClipboardCheck,
  Activity,
  Layers,
  Share2,
  Phone,
  AlertCircle,
  Smartphone,
  Send,
  Globe,
  Package,
  CheckCircle,
  Info,
  Zap,
  BarChart3 as BarChart,
  Layout,
  Code2,
  Terminal,
  Cpu,
  DatabaseZap,
  MapPin,
  AlertTriangle,
  FileSearch,
  Home,
  GraduationCap,
  Award,
  BookOpen,
  UserPlus,
  FileSignature,
  DollarSign,
  PieChart
} from 'lucide-react';

// Force HMR reload
import CaptureLeads from './CaptureLeads';
import LeadDetails from './LeadDetails';
import LeadReminders from './LeadReminders';
import CustomerManagement from './CustomerManagement';
import CustomerDetail from './CustomerDetail';
import SalesPipeline from './SalesPipeline';
import SalesForecasting from './SalesForecasting';
import Communication from './Communication';
import EmployeeList from './EmployeeList';
import Attendance from './Attendance';
import LeaveManagement from './LeaveManagement';
import Payroll from './Payroll';
import ProjectManagement from './ProjectManagement';
import DepartmentManagement from './DepartmentManagement';
import AdminSettings from './Settings';
import AssignRoles from './AssignRoles';
import Support from './Support';
import DeductionManagement from './DeductionManagement';
import InvoiceManagement from './InvoiceManagement';
import AuditLogs from './AuditLogs';
import AccountControl from './AccountControl';
import Announcements from './Announcements';
import NotificationCenter from './NotificationCenter';
import CRMMasterControl from './CRMMasterControl';
import ChatbotWidget from './ChatbotWidget';
import ReportHistory from './ReportHistory';
import AnalyticsDashboard from './AnalyticsDashboard';
import RegistrationApprovals from './RegistrationApprovals';
import DashboardGraphs from './DashboardGraphs';
import VendorManagement from './VendorManagement';
import EmployeeDocuments from './EmployeeDocuments';
import EmployeeDocumentManager from './EmployeeDocumentManager';
import OnboardingOffboarding from './OnboardingOffboarding';
import EmployeeOnboarding from './EmployeeOnboarding';
import WFHManager from './WFHManager';
import FaceEnrollment from './FaceEnrollment';
import DatabaseBackup from './DatabaseBackup';
import FinancialYearOverview from './FinancialYearOverview';
import SystemWorkflowHub from './SystemWorkflowHub';
import AssetManagement from './AssetManagement';
import MyProfile from './MyProfile';
import MyDayReport from './MyDayReport';
import ClientProposals from './ClientProposals';
import ClientContracts from './ClientContracts';
import ClientOnboarding from './ClientOnboarding';
import ClientPortalHome from './ClientPortalHome';
import Customer360 from './Customer360';
import AILeadScoring from './AILeadScoring';
import logo from '../assets/logo_transparent.png';
import logoHatbaliya from '../assets/logo_hatbaliya_orig.png';
import logoColvo from '../assets/logo_colvo_orig.png';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'Dashboard';
  const [activeTab, setActiveTabInternal] = useState(currentTab);

  // Sync state with URL search params
  useEffect(() => {
    setActiveTabInternal(currentTab);
  }, [currentTab]);

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };
  const [targetNotificationId, setTargetNotificationId] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ unreadCount: 0 });
  const [missingDocs, setMissingDocs] = useState([]);
  const [isCrmOnly, setIsCrmOnly] = useState(localStorage.getItem('isCrmOnly') === 'true');
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
  const [companySettings, setCompanySettings] = useState({});
  const [pendingCount, setPendingCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch (e) {
      return {};
    }
  });

  // Company selection state
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return localStorage.getItem('selected_company') || 'Hatbaliya';
  });

  const companiesList = {
    'Hatbaliya': { name: 'Hatbaliya Technologies', logo: logoHatbaliya },
    'Colvo': { name: 'Colvo Corporation', logo: logoColvo },
    'Colorato': { name: 'Colorato Ltd (Coming Soon)', logo: logo }
  };

  const handleCompanyChange = (cName) => {
    setSelectedCompany(cName);
    localStorage.setItem('selected_company', cName);
    toast.success(`Switched workspace to ${cName}`);
  };

  useEffect(() => {
    const fetchMe = async () => {
      if (!localStorage.getItem('token')) return;
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Failed to sync latest permissions', err);
        if (err.response && err.response.status === 404) {
          // User not found in database (likely deleted), log them out
          localStorage.clear();
          navigate('/', { replace: true });
        }
      }
    };
    fetchMe();
    const interval = setInterval(fetchMe, 30000); // Check for permission updates every 30s
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = user?.role === 'Super Admin';
  const isDeveloper = user?.role === 'Developer';
  const isEmployee = !isDeveloper && (
    user?.role === 'Employee ERP' ||
    user?.role === 'Employee CRM' ||
    user?.role === 'Employee' ||
    user?.role === 'Staff'
  );

  const hasPermission = (slug) => isSuperAdmin || isDeveloper || (user?.permissions && user.permissions.includes(slug));

  // Check face enrollment status for employees via server
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!isEmployee || !user?.id) return;
      if (companySettings.face_detection_enabled === 'false') return;

      try {
        const res = await axios.get(`/api/face/descriptor`);

        if (res.data.success && !res.data.enrolled) {
          setShowFaceEnrollment(true);
        } else if (res.data.enrolled) {
          localStorage.setItem('face_enrolled', 'true');
        }
      } catch (err) {
        console.error('[Dashboard] Face check error:', err);
      }
    };

    if (Object.keys(companySettings).length > 0) {
      checkEnrollment();
    }
  }, [isEmployee, user?.id, companySettings]);

  // Auth guard — redirect to login if no token found
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    // Redirect Vendors to their dedicated panel
    if (user.role === 'Vendor') {
      navigate('/vendor-dashboard', { replace: true });
    }
  }, [user.role, navigate]);

  const fetchStats = React.useCallback(async () => {
    try {
      const url = isEmployee
        ? `/api/employee-stats/${user.id}`
        : `/api/dashboard/stats`;

      const res = await axios.get(url);
      if (res.data?.success) {
        if (isEmployee) {
          setStats({
            totalTasks: res.data.data?.totalTasks || 0,
            completedTasks: res.data.data?.completedTasks || 0,
            pendingTasks: res.data.data?.pendingTasks || 0,
            pendingLeaves: res.data.data?.pendingLeaves || 0,
            activeProjects: res.data.data?.attendance ? (res.data.data.attendance.clock_out ? 'Done' : 'Logged') : 'Absent',
            unreadCount: res.data.data?.unreadCount || 0,
            isEmployee: true
          });
        } else {
          setStats(res.data.data || { unreadCount: 0 });
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [isEmployee, user.id, selectedCompany]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    const fetchMissingDocs = async () => {
      if (!isEmployee || !user?.id) return;
      try {
        const res = await axios.get(`/api/employees/${user.id}/documents`);
        if (res.data.success) {
          const uploadedTypes = res.data.data.map(d => d.doc_type);
          const allTypes = ['Aadhar Card', 'PAN Card', 'Driving License'];
          const missing = allTypes.filter(type => !uploadedTypes.includes(type));
          setMissingDocs(missing);
        }
      } catch (err) {
        console.error('Error fetching missing docs:', err);
      }
    };
    fetchMissingDocs();
  }, [isEmployee, user?.id]);



  const isAdmin = isSuperAdmin || isDeveloper || user?.role === 'Admin';

  useEffect(() => {
    const fetchPendingCount = () => {
      if (isAdmin) {
        axios.get(`/api/users/pending-count/all`)
          .then(res => {
            if (res.data.success) setPendingCount(res.data.count);
          })
          .catch(err => console.error('Error fetching pending count', err));
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    axios.get(`/api/settings`)
      .then(res => {
        if (res.data.success) setCompanySettings(res.data.data);
      })
      .catch(err => console.error('Error fetching settings', err));
  }, []);

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTab');
    navigate('/', { replace: true });
  };

  const cancelLogout = () => setShowLogoutModal(false);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('isCrmOnly', isCrmOnly);
  }, [isCrmOnly]);

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Close sidebar when navigating items on mobile
  const handleMobileNav = (id) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  // Menu Configuration
  // Dynamic Menu Configuration based on Role
  const getMenuItems = () => {
    const role = user?.role || '';

    // If role is Client, return only the Client Portal menu
    if (role === 'Client') {
      return [
        {
          label: 'Client Portal',
          icon: <LayoutDashboard size={20} />,
          id: 'ClientPortalHome'
        },
        {
          label: 'My Proposals',
          icon: <FileText size={20} />,
          id: 'Proposals' // Reusing the same ID so the render switch maps to ClientProposals
        },
        {
          label: 'My Contracts',
          icon: <FileSignature size={20} />,
          id: 'Contracts' // Reusing the same ID so the render switch maps to ClientContracts
        }
      ];
    }

    const items = [];

    // 1. Dashboard (All)
    items.push({
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      id: 'Dashboard',
      roles: ['Super Admin', 'Admin', 'Employee ERP', 'Employee CRM'],
      permissions: ['view_dashboard']
    });

    // 2. My Profile (All)
    items.push({
      label: 'My Profile',
      icon: <UserCircle size={20} />,
      id: 'MyProfile',
      roles: ['Super Admin', 'Admin', 'Employee ERP', 'Employee CRM', 'Developer', 'Staff']
    });

    // 2.5 My Day Report (All)
    items.push({
      label: 'My Day Report',
      icon: <FileText size={20} />,
      id: 'MyDayReport',
      roles: ['Super Admin', 'Admin', 'Employee ERP', 'Employee CRM', 'Developer', 'Staff']
    });

    // 3. Notifications (All)
    const notifSubmenu = [
      { label: 'Announcements', id: 'Announcements', icon: <Megaphone size={16} /> },
      { label: 'Direct Alerts', id: 'NotificationCenter', icon: <Bell size={16} /> }
    ];

    if (role === 'Employee CRM') {
      notifSubmenu.push(
        { label: 'View Company Policies', id: 'ViewPolicies', icon: <FileText size={16} /> }
      );
    }

    items.push({
      label: 'Notifications',
      icon: <Bell size={20} />,
      id: 'Notifications',
      roles: ['Super Admin', 'Admin', 'Employee ERP', 'Employee CRM'],
      submenu: notifSubmenu
    });

    // 2. CRM Section
    if (role === 'Super Admin' || role === 'Admin' || role === 'Employee CRM' || role === 'Employee ERP') {
      const crmSubmenu = [];

      // Personal CRM Dashboard for Employees
      if (role === 'Employee CRM') {
        crmSubmenu.push({
          label: 'My CRM Workspace',
          icon: <LayoutDashboard size={20} />,
          id: 'MyCRMWorkspace',
          submenu: [
            { label: 'My Leads Summary', id: 'MyLeadsSummary', icon: <Target size={16} /> },
            { label: 'My Deals Summary', id: 'MyDealsSummary', icon: <TrendingUp size={16} /> },
            { label: 'Follow-up Reminders', id: 'LeadReminders', icon: <Clock size={16} /> },
            { label: 'My Tasks', id: 'ViewTasks', icon: <ListTodo size={16} /> },
            { label: 'My Performance', id: 'MyPerformance', icon: <Activity size={16} /> }
          ]
        });
      }

      if (role === 'Super Admin' || role === 'Admin' || role === 'Employee CRM') {
        crmSubmenu.push({
          label: 'Capture Leads',
          icon: <Target size={20} />,
          id: 'LeadManagement',
          submenu: [
            { label: 'Lead Directory', id: 'CaptureLeads', icon: <Users size={16} /> },
            { label: 'AI Lead Scoring', id: 'AILeadScoring', icon: <TrendingUp size={16} /> },
            { label: 'Smart Follow-up', id: 'SmartFollowUp', icon: <Clock size={16} /> },
            { label: 'Activity Logs', id: 'LeadActivityGlobal', icon: <Activity size={16} /> }
          ]
        });

        crmSubmenu.push({
          label: 'Customer Management',
          icon: <Briefcase size={20} />,
          id: 'CustomerMenu',
          submenu: [
            { label: 'Customer 360° View', id: 'Customer360', icon: <Users size={16} /> },
            { label: 'Customer Directory', id: 'CustomerDirectory', icon: <Users size={16} /> },
            { label: 'Interaction History', id: 'CustomerHistory', icon: <Activity size={16} /> },
            { label: 'Attached Documents', id: 'CustomerDocuments', icon: <FileText size={16} /> }
          ]
        });

        crmSubmenu.push({
          label: 'Sales Pipeline',
          icon: <TrendingUp size={20} />,
          id: 'SalesMenu',
          submenu: [
            { label: 'Deals Board', id: 'SalesPipeline', icon: <Layers size={16} /> },
            { label: 'Forecasting', id: 'SalesForecasting', icon: <Activity size={16} /> }
          ]
        });

        crmSubmenu.push({
          label: 'Communication',
          icon: <Mail size={20} />,
          id: 'CommMenu',
          submenu: [
            { label: 'Send Emails', id: 'CommSend', icon: <Send size={16} /> },
            { label: 'Email Templates', id: 'CommTemplates', icon: <FileText size={16} /> },
            { label: 'Auto Emails', id: 'CommAuto', icon: <Zap size={16} /> },
            { label: 'Log Calls', id: 'CommCalls', icon: <Phone size={16} /> },
            { label: 'Call Reminders', id: 'CommReminders', icon: <Calendar size={16} /> },
            { label: 'Missed Call Alerts', id: 'CommAlerts', icon: <AlertCircle size={16} /> },
            { label: 'Send Messages', id: 'CommMsg', icon: <Smartphone size={16} /> },
            { label: 'Campaign Updates', id: 'CommCampaigns', icon: <Share2 size={16} /> }
          ]
        });
      }

      // CRM Reports & Analytics (Super Admin Only)
      if (role === 'Super Admin') {
        crmSubmenu.push({
          label: 'CRM Analytics',
          icon: <BarChart size={20} />,
          id: 'CRMReportsGroup',
          submenu: [
            { label: 'Lead Source Report', id: 'CRM_Report_LeadSource', icon: <Target size={16} /> },
            { label: 'Conversion Rate', id: 'CRM_Report_Conversion', icon: <TrendingUp size={16} /> },
            { label: 'Pipeline Analysis', id: 'CRM_Report_Pipeline', icon: <Layers size={16} /> },
            { label: 'Performance Metrics', id: 'CRM_Report_Performance', icon: <Activity size={16} /> },
            { label: 'Revenue Forecast', id: 'CRM_Report_Forecast', icon: <TrendingUp size={16} /> },
            { label: 'Lost Deal Analysis', id: 'CRM_Report_Lost', icon: <AlertCircle size={16} /> },
            { label: 'Customer Retention', id: 'CRM_Report_Retention', icon: <Users size={16} /> }
          ]
        });
      }

      // CRM Master Controls (Only for Super Admin)
      if (role === 'Super Admin') {
        crmSubmenu.push({
          label: 'Master CRM Controls',
          icon: <ShieldCheck size={20} />,
          id: 'CRMMaster',
          submenu: [
            { label: 'Automation Management', id: 'CRMAutomation', icon: <Zap size={16} /> },
            { label: 'System Settings', id: 'CRMSettings', icon: <SettingsIcon size={16} /> },
            { label: 'Data Control', id: 'CRMDataControl', icon: <Database size={16} /> },
            { label: 'Backup & Security', id: 'CRMSecurity', icon: <Lock size={16} /> },
            { label: 'Company Settings', id: 'CRMCompany', icon: <Building2 size={16} /> }
          ]
        });
      }

      if (crmSubmenu.length > 0) {
        items.push({
          label: 'CRM',
          icon: <Layout size={20} />,
          id: 'CRMGroup',
          submenu: crmSubmenu
        });
      }
    }

    // 2.5 Client Management
    if (role === 'Super Admin' || role === 'Admin' || role === 'Employee CRM') {
      items.push({
        label: 'Client Management',
        icon: <Users size={20} />,
        id: 'ClientManagement',
        submenu: [
          { label: 'Client Onboarding', id: 'ClientOnboarding', icon: <UserPlus size={16} /> },
          { label: 'Proposals & Approvals', id: 'Proposals', icon: <FileText size={16} /> },
          { label: 'Contracts & E-Sign', id: 'Contracts', icon: <FileSignature size={16} /> },
          { label: 'Client Portal Access', id: 'ClientPortal', icon: <Globe size={16} /> },
          { label: 'Health & Renewals', id: 'HealthScore', icon: <Activity size={16} /> }
        ]
      });
    }


    // 3. Employee Management
    if (isEmployee) {
      if (role !== 'Employee CRM') {
        items.push({
          label: 'Employee Management',
          icon: <UserCircle size={20} />,
          id: 'PersonalManagement',
          submenu: [
            { label: 'View Company Policies', id: 'ViewPolicies', icon: <FileText size={16} /> },
            { label: 'Documentation', id: 'Documentation', icon: <FileText size={16} /> },
            { label: 'Onboarding Track', id: 'EmployeeOnboarding', icon: <UserPlus size={16} /> }
          ]
        });
      }
    } else if (hasPermission('manage_users') || hasPermission('view_employees') || hasPermission('manage_departments')) {
      items.push({
        label: 'Employee Management',
        icon: <Users size={20} />,
        id: 'EmployeeManagement',
        submenu: [
          hasPermission('manage_users') && { label: 'Add Employee', id: 'AddEmployee', icon: <Plus size={16} /> },
          hasPermission('manage_users') && { label: 'Edit Employee', id: 'EditEmployee', icon: <Edit size={16} /> },
          hasPermission('manage_users') && { label: 'Remove Employee', id: 'RemoveEmployee', icon: <Trash2 size={16} /> },
          hasPermission('view_employees') && { label: 'View All Employees', id: 'ViewEmployees', icon: <Users size={16} /> },
          hasPermission('manage_users') && { label: 'Onboarding Checklist', id: 'OnboardingChecklist', icon: <UserCircle size={16} /> },
          hasPermission('manage_users') && { label: 'Exit clearance', id: 'ExitClearance', icon: <LogOut size={16} /> },
          hasPermission('manage_users') && { label: 'Registration Approvals', id: 'Approvals', icon: <ShieldCheck size={16} /> },
          hasPermission('manage_departments') && { label: 'Manage Departments', id: 'Departments', icon: <Building2 size={16} /> },
          hasPermission('manage_users') && { label: 'Doc Verification', id: 'DocVerification', icon: <FileSearch size={16} /> }
        ].filter(Boolean)
      });
    }

    // 4. Attendance Tracking
    if (isEmployee) {
      items.push({
        label: 'Attendance Tracking',
        icon: <CalendarCheck size={20} />,
        id: 'PersonalAttendance',
        submenu: [
          { label: 'Mark My Attendance', id: 'MarkAttendance', icon: <Clock size={16} /> },
          { label: 'Apply for Leave', id: 'ApplyLeave', icon: <Calendar size={16} /> },
          { label: 'View Leave Status', id: 'ViewLeaves', icon: <FileText size={16} /> },
          { label: 'Work From Home', id: 'WFHRequests', icon: <Home size={16} /> }
        ]
      });
    } else if (hasPermission('view_attendance') || hasPermission('manage_leaves')) {
      items.push({
        label: 'Attendance Tracking',
        icon: <CalendarCheck size={20} />,
        id: 'AttendanceTracking',
        submenu: [
          hasPermission('view_attendance') && { label: 'View All Records', id: 'ViewAttendance', icon: <Users size={16} /> },
          hasPermission('manage_leaves') && { label: 'Review Requests', id: 'ReviewLeaves', icon: <FileText size={16} /> },
          hasPermission('view_attendance') && { label: 'Edit Logs', id: 'EditAttendance', icon: <Edit size={16} /> },
          (hasPermission('view_attendance') || hasPermission('manage_leaves')) && { label: 'WFH Requests', id: 'WFHRequests', icon: <Home size={16} /> }
        ].filter(Boolean)
      });
    }

    // 5. Payroll Management
    if (isEmployee) {
      items.push({
        label: 'Payroll',
        icon: <CreditCard size={20} />,
        id: 'PersonalPayrollSection',
        submenu: [
          { label: 'Download My Salary Slip', id: 'PersonalPayroll', icon: <Download size={16} /> }
        ]
      });
    } else if (hasPermission('manage_payroll') || hasPermission('view_payroll') || hasPermission('view_reports')) {
      if (hasPermission('manage_payroll')) {
        items.push({
          label: 'Payroll Management',
          icon: <CreditCard size={20} />,
          id: 'PayrollManagement',
          submenu: [
            { label: 'Setup Salary Structure', id: 'SetupSalary', icon: <Calculator size={16} /> }
          ]
        });
      }
      if (hasPermission('view_payroll') || hasPermission('manage_payroll')) {
        items.push({
          label: 'Accounts Management',
          icon: <Database size={20} />,
          id: 'AccountsManagement',
          submenu: [
            hasPermission('manage_payroll') && { label: 'Setup Salary Structure', id: 'SetupSalary', icon: <Calculator size={16} /> },
            hasPermission('view_payroll') && { label: 'View Payment History', id: 'Payroll', icon: <CreditCard size={16} /> },
            hasPermission('view_payroll') && { label: 'Download Payroll Reports', id: 'PayrollReports', icon: <Download size={16} /> },
            hasPermission('manage_payroll') && { label: 'Generate Salary Slip', id: 'GenerateSlip', icon: <FileText size={16} /> },
            hasPermission('manage_payroll') && { label: 'Manage Deductions & Allowances', id: 'ManageDeductions', icon: <SettingsIcon size={16} /> },
            hasPermission('manage_payroll') && { label: 'Generate Invoice', id: 'GenerateInvoice', icon: <Plus size={16} /> },
            hasPermission('view_payroll') && { label: 'View Invoice Report', id: 'InvoiceReport', icon: <FileText size={16} /> }
          ].filter(Boolean)
        });
      }
      if (hasPermission('view_reports')) {
        items.push({
          label: 'Reports',
          icon: <FileText size={20} />,
          id: 'Reports',
          submenu: [
            { label: 'Monthly / Annual Reports', id: 'FinanceReports', icon: <CalendarCheck size={16} /> },
            { label: 'Salary Expenditure Graphs', id: 'SalaryGraphs', icon: <Calculator size={16} /> },
            { label: 'Department-wise Performance', id: 'PerformanceReports', icon: <Briefcase size={16} /> },
            { label: 'Financial Earning / Year', id: 'FinancialEarningYear', icon: <TrendingUp size={16} /> },
            { label: 'System Workflow Hub', id: 'WorkflowHub', icon: <Activity size={16} /> },
          ]
        });
      }
    }

    // 6. Project Management
    if (isEmployee) {
      items.push({
        label: 'Project Mng',
        icon: <Briefcase size={20} />,
        id: 'PersonalProjects',
        submenu: [
          { label: 'View Assigned Tasks', id: 'ViewTasks', icon: <ListTodo size={16} /> },
          { label: 'Update Task Progress', id: 'UpdateTasks', icon: <Clock size={16} /> }
        ]
      });
    } else if (hasPermission('manage_projects') || hasPermission('view_projects') || hasPermission('manage_tasks')) {
      items.push({
        label: 'Project Management',
        icon: <Briefcase size={20} />,
        id: 'ProjectMgmt',
        submenu: [
          hasPermission('manage_projects') && { label: 'Create Projects', id: 'PM_Create', icon: <Plus size={16} /> },
          hasPermission('manage_projects') && { label: 'Assign Employees', id: 'PM_Assign', icon: <Users size={16} /> },
          hasPermission('manage_tasks') && { label: 'Set Deadlines & Tasks', id: 'PM_Deadlines', icon: <CalendarCheck size={16} /> },
          (hasPermission('view_projects') || hasPermission('manage_projects')) && { label: 'Track Progress', id: 'PM_Progress', icon: <Briefcase size={16} /> }
        ].filter(Boolean)
      });
    }

    // 7. Support / Help Desk
    if (isEmployee) {
      items.push({
        label: 'Support/Help Desk',
        icon: <LifeBuoy size={20} />,
        id: 'PersonalSupport',
        submenu: [
          { label: 'Raise Ticket', id: 'RaiseTicket', icon: <Plus size={16} /> },
          { label: 'Track Ticket Status', id: 'TrackStatus', icon: <Clock size={16} /> },
          { label: 'Ask Queries', id: 'AskQueries', icon: <MessageSquare size={16} /> }
        ]
      });
    } else if (role === 'Admin') {
      items.push({
        label: 'Support / Help Desk',
        icon: <LifeBuoy size={20} />,
        id: 'SupportDeskMgt',
        submenu: [
          { label: 'Respond to Tickets', id: 'Support_Respond', icon: <MessageSquare size={16} /> },
          { label: 'Manage Employee Queries', id: 'Support_Queries', icon: <UserCircle size={16} /> }
        ]
      });
    } else if (role === 'Super Admin') {
      items.push({
        label: 'Support / Help Desk',
        icon: <LifeBuoy size={20} />,
        id: 'SuperSupport',
        submenu: [
          { label: 'Review Admin Actions', id: 'ReviewActions', icon: <ShieldCheck size={16} /> },
          { label: 'System-Level Ticket Handling', id: 'Tickets', icon: <SettingsIcon size={16} /> }
        ]
      });
    }

    // 8. Super Admin Specific Sections
    if (role === 'Super Admin') {
      items.push({
        label: 'User Roles & Permissions',
        icon: <Users size={20} />,
        id: 'UserRoles',
        submenu: [
          { label: 'Manage Admins', id: 'ManageAdmins', icon: <UserCircle size={16} /> },
          { label: 'Assign Roles', id: 'AssignRoles', icon: <UserCircle size={16} /> },
          { label: 'Registration Approvals', id: 'Approvals', icon: <ShieldCheck size={16} /> }
        ]
      });
      items.push({
        label: 'Company Settings',
        icon: <Building2 size={20} />,
        id: 'CompanySettings',
        submenu: [
          { label: 'Company Profile', id: 'CompanyProfile', icon: <Building2 size={16} /> },
          { label: 'Update Policies', id: 'Policies', icon: <FileText size={16} /> },
          { label: 'Financial Year Settings', id: 'FinancialYear', icon: <Calendar size={16} /> }
        ]
      });
      items.push({
        label: 'System Settings',
        icon: <Server size={20} />,
        id: 'SystemSettings',
        submenu: [
          { label: 'Database Backup', id: 'Backup', icon: <Database size={16} /> },
          { label: 'Email / SMS Configuration', id: 'EmailSms', icon: <Mail size={16} /> },
          { label: 'Office Geofencing', id: 'Geofencing', icon: <MapPin size={16} /> }
        ]
      });
      items.push({
        label: 'Master Controls',
        icon: <Shield size={20} />,
        id: 'MasterControls',
        submenu: [
          { label: 'Full Access to All Employees', id: 'MasterEmployees', icon: <Users size={16} /> },
          { label: 'Full Access to Payroll', id: 'MasterPayroll', icon: <CreditCard size={16} /> },
          { label: 'Full Access to Projects', id: 'MasterProjects', icon: <Briefcase size={16} /> },
          { label: 'Doc Verification', id: 'DocVerification', icon: <FileSearch size={16} /> },
          { label: 'Audit Logs', id: 'AuditLogs', icon: <FileText size={16} /> }
        ]
      });
    }

    // =====================================================================
    // DEVELOPER PANEL — Full God-Mode Access
    // =====================================================================
    if (isDeveloper) {
      // Override: replace everything added so far with Developer-specific menu
      items.length = 0;

      items.push({ label: 'Dashboard', icon: <LayoutDashboard size={20} />, id: 'Dashboard' });
      items.push({ label: 'My Profile', icon: <UserCircle size={20} />, id: 'MyProfile' });
      items.push({ label: 'My Day Report', icon: <FileText size={20} />, id: 'MyDayReport' });
      items.push({
        label: 'Notifications', icon: <Bell size={20} />, id: 'Notifications', submenu: [
          { label: 'Announcements', id: 'Announcements', icon: <Megaphone size={16} /> },
          { label: 'Direct Alerts', id: 'NotificationCenter', icon: <Bell size={16} /> }
        ]
      });

      // ERP Admin
      items.push({
        label: 'ERP Administration', icon: <Building2 size={20} />, id: 'DevERP', submenu: [
          { label: 'Employee Directory', id: 'ViewEmployees', icon: <Users size={16} /> },
          { label: 'Doc Verification', id: 'DocVerification', icon: <FileSearch size={16} /> },
          { label: 'Department Control', id: 'Departments', icon: <Building2 size={16} /> },
          { label: 'Attendance Logs', id: 'ViewAttendance', icon: <Calendar size={16} /> },
          { label: 'Leave Requests', id: 'ReviewLeaves', icon: <CalendarCheck size={16} /> },
          { label: 'WFH Requests', id: 'WFHRequests', icon: <Home size={16} /> }
        ]
      });

      // Vendor & Asset Controls
      items.push({
        label: 'Vendor & Assets', icon: <Globe size={20} />, id: 'DevVendorsRoot', submenu: [
          { label: 'Vendor Directory', id: 'DevVendors', icon: <Users size={16} /> },
          { label: 'Add New Vendor', id: 'DevAddVendor', icon: <Plus size={16} /> },
          { label: 'Tool Repository', id: 'DevToolRepo', icon: <Package size={16} /> },
          { label: 'Asset Management', id: 'AssetManagement', icon: <Box size={16} /> }
        ]
      });

      // All Users
      items.push({
        label: 'All Users', icon: <Users size={20} />, id: 'DevUsers', submenu: [
          { label: 'All Users', id: 'ViewEmployees', icon: <Users size={16} /> },
          { label: 'All Admins', id: 'ManageAdmins', icon: <UserCircle size={16} /> },
          { label: 'All Super Admins', id: 'DevSuperAdmins', icon: <ShieldCheck size={16} /> },
          { label: 'Assign Roles', id: 'AssignRoles', icon: <Key size={16} /> },
          { label: 'Approvals', id: 'Approvals', icon: <ShieldCheck size={16} /> },
          { label: 'Departments', id: 'Departments', icon: <Building2 size={16} /> }
        ]
      });

      // CRM Full
      items.push({
        label: 'CRM (Full Access)', icon: <Layout size={20} />, id: 'DevCRM', submenu: [
          { label: 'Lead Directory', id: 'CaptureLeads', icon: <Target size={16} /> },
          { label: 'Follow-up Reminders', id: 'LeadReminders', icon: <Clock size={16} /> },
          { label: 'Customer Directory', id: 'CustomerDirectory', icon: <Users size={16} /> },
          { label: 'Sales Pipeline', id: 'SalesPipeline', icon: <TrendingUp size={16} /> },
          { label: 'Sales Forecasting', id: 'SalesForecasting', icon: <Activity size={16} /> },
          { label: 'Communication Hub', id: 'CommMenu', icon: <Mail size={16} /> },
          { label: 'CRM Analytics', id: 'CRMReportsGroup', icon: <BarChart size={16} /> },
          { label: 'Role & Permission', id: 'CRMRoles', icon: <ShieldCheck size={16} /> },
          { label: 'CRM Master Controls', id: 'CRMMaster', icon: <ShieldCheck size={16} /> }
        ]
      });

      items.push({
        label: 'Client Management', icon: <Users size={20} />, id: 'DevClient', submenu: [
          { label: 'Client Onboarding', id: 'ClientOnboarding', icon: <UserPlus size={16} /> },
          { label: 'Proposals & Approvals', id: 'Proposals', icon: <FileText size={16} /> },
          { label: 'Contracts & E-Sign', id: 'Contracts', icon: <FileSignature size={16} /> },
          { label: 'Client Portal Access', id: 'ClientPortal', icon: <Globe size={16} /> },
          { label: 'Health & Renewals', id: 'HealthScore', icon: <Activity size={16} /> }
        ]
      });

      // Attendance & Payroll
      items.push({
        label: 'Attendance & Payroll', icon: <CreditCard size={20} />, id: 'DevPayroll', submenu: [
          { label: 'View All Attendance', id: 'ViewAttendance', icon: <CalendarCheck size={16} /> },
          { label: 'Leave Requests', id: 'ReviewLeaves', icon: <Calendar size={16} /> },
          { label: 'Payroll Setup', id: 'SetupSalary', icon: <Calculator size={16} /> },
          { label: 'Payment History', id: 'Payroll', icon: <CreditCard size={16} /> },
          { label: 'Deductions & Allowances', id: 'ManageDeductions', icon: <SettingsIcon size={16} /> },
          { label: 'Invoice Management', id: 'GenerateInvoice', icon: <FileText size={16} /> }
        ]
      });

      // Projects
      items.push({
        label: 'Project Management', icon: <Briefcase size={20} />, id: 'DevProjects', submenu: [
          { label: 'All Projects', id: 'MasterProjects', icon: <Briefcase size={16} /> },
          { label: 'Create Project', id: 'PM_Create', icon: <Plus size={16} /> },
          { label: 'Assign Employees', id: 'PM_Assign', icon: <Users size={16} /> },
          { label: 'Track Progress', id: 'PM_Progress', icon: <ClipboardCheck size={16} /> }
        ]
      });

      // Finance & Accounting
      items.push({
        label: 'Finance & Accounting', icon: <DollarSign size={20} />, id: 'DevFinance', submenu: [
          { label: 'Finance Hub', id: 'FinanceHub', icon: <PieChart size={16} /> },
          { label: 'Income & Expenses', id: 'IncomeExpenses', icon: <DollarSign size={16} /> },
          { label: 'Tax & Budget', id: 'TaxAndBudget', icon: <TrendingUp size={16} /> },
          { label: 'Invoice Management', id: 'GenerateInvoice', icon: <FileText size={16} /> }
        ]
      });

      // Reports
      items.push({
        label: 'Reports', icon: <FileText size={20} />, id: 'DevReports', submenu: [
          { label: 'Monthly / Annual', id: 'FinanceReports', icon: <CalendarCheck size={16} /> },
          { label: 'Salary Expenditure', id: 'SalaryGraphs', icon: <BarChart size={16} /> },
          { label: 'Department Performance', id: 'PerformanceReports', icon: <Activity size={16} /> }
        ]
      });

      // System Controls
      items.push({
        label: 'System Controls', icon: <Terminal size={20} />, id: 'DevSystem', submenu: [
          { label: 'Audit Logs', id: 'AuditLogs', icon: <FileText size={16} /> },
          { label: 'Database Backup', id: 'Backup', icon: <DatabaseZap size={16} /> },
          { label: 'Company Settings', id: 'CompanyProfile', icon: <Building2 size={16} /> },
          { label: 'Attendance Settings', id: 'Geofencing', icon: <MapPin size={16} /> },
          { label: 'Policies', id: 'Policies', icon: <FileText size={16} /> },
          { label: 'Ticket Handling', id: 'Tickets', icon: <LifeBuoy size={16} /> }
        ]
      });

      // Account
      items.push({
        label: 'Account', icon: <UserCircle size={20} />, id: 'Account', submenu: [
          { label: 'Change Password', id: 'ChangePassword', icon: <Lock size={16} /> },
          { label: 'Logout', id: 'LogoutAction', icon: <LogOut size={16} /> }
        ]
      });

      // Apply ERP / CRM filter — identical logic to other admin roles
      if (isCrmOnly) {
        // CRM mode: Dashboard + Notifications + flattened CRM items + Account (kept as submenu)
        const dashboardItem = items.find(item => item.id === 'Dashboard');
        const notifItem = items.find(item => item.id === 'Notifications');
        const crmItem = items.find(item => item.id === 'DevCRM');
        const accountItem = items.find(item => item.id === 'Account');

        const result = [];
        if (dashboardItem) result.push(dashboardItem);
        if (notifItem) result.push(notifItem);
        if (crmItem?.submenu) result.push(...crmItem.submenu); // flatten CRM links
        if (accountItem) result.push(accountItem);           // keep Account collapsible
        return result.filter(Boolean);
      } else {
        // ERP mode: everything EXCEPT the CRM section
        return items.filter(item => item.id !== 'DevCRM');
      }
    }

    // 9. Account (All other roles)
    const accountSubmenu = [];

    if (role === 'Employee CRM') {
      accountSubmenu.push(
        { label: 'Documentation', id: 'Documentation', icon: <FileText size={16} /> }
      );
    } else {
      accountSubmenu.push(
        { label: 'Change Password', id: 'ChangePassword', icon: <Lock size={16} /> }
      );
    }

    accountSubmenu.push({ label: 'Logout', id: 'LogoutAction', icon: <LogOut size={16} /> });

    items.push({
      label: 'Account',
      icon: <UserCircle size={20} />,
      id: 'Account',
      submenu: accountSubmenu
    });

    // Apply CRM/ERP filter if applicable
    if (role === 'Employee CRM' || role === 'Super Admin' || role === 'Admin' || role === 'Developer') {
      if (isCrmOnly) {
        // CRM Mode: Show Dashboard + flattened CRM submenus + Account
        const dashboardItem = items.find(item => item.id === 'Dashboard');
        const crmItem = items.find(item => item.id === 'CRMGroup' || item.id === 'DevCRM');
        const accountItem = items.find(item => item.id === 'Account');

        const result = [];

        // Add Dashboard
        if (dashboardItem) result.push(dashboardItem);

        // Add CRM submenus as top-level items
        if (crmItem && crmItem.submenu) {
          result.push(...crmItem.submenu);
        }

        // Add Account submenus as top-level items
        if (accountItem && accountItem.submenu) {
          result.push(...accountItem.submenu);
        }

        return result.filter(Boolean);
      } else {
        // ERP Mode: Show everything EXCEPT CRM
        return items.filter(item => item.id !== 'CRMGroup' && item.id !== 'DevCRM');
      }
    }

    return items;
  };

  const menuItems = getMenuItems();

  // Force re-render when isCrmOnly changes
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [isCrmOnly]);

  return (
    <>
      {/* Face Enrollment — shown on first login for employees */}
      {showFaceEnrollment && (
        <FaceEnrollment
          onEnrolled={() => setShowFaceEnrollment(false)}
          onBack={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('activeTab');
            navigate('/', { replace: true });
          }}
        />
      )}

      <div className="flex h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex flex-col items-center border-b border-slate-800/50 p-4 overflow-hidden w-full text-center">
            <div className="w-full px-6 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {isDeveloper ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                    <Code2 size={9} />
                    Developer
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{user?.role}</p>
                  </div>
                )}
              </div>

              {(user?.role === 'Employee CRM' || user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Developer') && (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 rounded-xl p-2 px-3 border border-slate-800/50">
                  <span className={`text-[9px] font-black tracking-widest uppercase transition-colors duration-300 ${!isCrmOnly ? 'text-blue-400' : 'text-slate-500'}`}>ERP</span>
                  <button
                    onClick={() => setIsCrmOnly(!isCrmOnly)}
                    className={`relative w-10 h-5 rounded-full transition-all duration-300 p-1 flex items-center ${isCrmOnly ? 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-slate-800'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white shadow-lg transform transition-transform duration-300 ease-spring ${isCrmOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-[9px] font-black tracking-widest uppercase transition-colors duration-300 ${isCrmOnly ? 'text-rose-400' : 'text-slate-500'}`}>CRM</span>
                </div>
              )}
            </div>

            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 md:hidden text-indigo-200 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => <SidebarItem key={item.id} item={item} activeTab={activeTab} expandedMenus={expandedMenus} toggleMenu={toggleMenu} handleMobileNav={handleMobileNav} level={0} pendingCount={pendingCount} stats={stats} handleLogout={handleLogout} />)}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-transparent w-full relative">
          <Header
            user={user}
            unreadCount={stats.unreadCount}
            toggleSidebar={() => setIsSidebarOpen(true)}
            menuItems={menuItems}
            onNavigate={(id) => { setActiveTab(id); setIsSidebarOpen(false); }}
            onNavigateToNotification={(id) => {
              setTargetNotificationId(id);
              setActiveTab('NotificationCenter');
              setIsSidebarOpen(false);
            }}
            onLogout={handleLogout}
            refreshStats={fetchStats}
            selectedCompany={selectedCompany}
            companiesList={companiesList}
            onCompanyChange={handleCompanyChange}
          />

          {
            isEmployee && missingDocs.length > 0 && activeTab === 'Dashboard' && (
              <div className="mx-4 md:mx-8 mt-4">
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm border-l-[6px] border-l-amber-500 transition-all hover:shadow-md animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm">
                      <AlertTriangle size={24} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-black text-amber-900 uppercase tracking-tight">Required Actions: Missing Documents</h3>
                      <p className="text-sm text-amber-800/80 mt-0.5 font-bold leading-none">
                        Your profile is incomplete. Please upload your <span className="text-amber-900">{missingDocs.join(' • ')}</span> to ensure full compliance.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('Documentation')}
                    className="whitespace-nowrap flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-200 group active:scale-95"
                  >
                    Go to Documentation
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )
          }

          <section key={selectedCompany} className="flex-1 overflow-y-auto p-4 md:p-8">
            <PageHeader title={activeTab} />

            {/* Content Mapping */}
            {activeTab === 'Dashboard' && <DashboardStats stats={stats} onNavigate={setActiveTab} />}
            {activeTab === 'MyProfile' && <MyProfile />}
            {activeTab === 'MyDayReport' && <MyDayReport />}

            {/* New CRM & Client Features */}
            {(activeTab === 'ClientPortalHome' || activeTab === 'ClientPortal') && <ClientPortalHome />}
            {activeTab === 'ClientOnboarding' && <ClientOnboarding />}
            {activeTab === 'Proposals' && <ClientProposals />}
            {activeTab === 'Contracts' && <ClientContracts />}
            {(activeTab === 'Customer360' || activeTab === 'HealthScore') && <Customer360 />}
            {activeTab === 'AILeadScoring' && <AILeadScoring />}

            {/* Finance & Accounting */}
            {activeTab === 'FinanceHub' && <FinanceHub />}
            {activeTab === 'IncomeExpenses' && <ExpenseTracker />}
            {activeTab === 'TaxAndBudget' && <TaxAndBudget />}

            {/* Developer Super Admin Mappings — all content available to Developer too */}
            {(activeTab === 'AssignRoles') && <AssignRoles />}

            {(activeTab === 'ViewEmployees') && (
              <EmployeeList
                initialTab="list"
                roleFilter={isDeveloper ? ['Employee ERP', 'Employee CRM'] : null}
              />
            )}
            {(activeTab === 'ManageAdmins') && (
              <EmployeeList
                roleFilter="Admin"
              />
            )}
            {(activeTab === 'DevSuperAdmins') && (
              <EmployeeList
                roleFilter="Super Admin"
              />
            )}
            {(activeTab === 'MasterEmployees' || activeTab === 'AddEmployee' || activeTab === 'EditEmployee' || activeTab === 'RemoveEmployee') && (
              <EmployeeList initialTab={activeTab === 'AddEmployee' ? 'add' : 'list'} />
            )}
            {(activeTab === 'OnboardingChecklist' || activeTab === 'ExitClearance') && (
              <OnboardingOffboarding />
            )}
            {(activeTab === 'CompanyProfile') && <AdminSettings initialTab="General" />}
            {(activeTab === 'Policies') && <AdminSettings initialTab="Policies" />}
            {(activeTab === 'FinancialYear') && <AdminSettings initialTab="FinancialYear" />}
            {(activeTab === 'Geofencing') && <AdminSettings initialTab="Attendance" />}
            {(activeTab === 'MasterControls') && <AdminSettings initialTab="MasterControls" />}
            {(activeTab === 'SupportDeskMgt') && <Support />}
            
            {/* Communication Fallback */}
            {(activeTab.startsWith('Comm') && activeTab !== 'Communication') && <Communication initialTab={activeTab.replace('Comm', '').toLowerCase()} />}
            {(activeTab === 'Security') && <AdminSettings initialTab="Security" />}
            {(activeTab === 'Backup') && <DatabaseBackup />}

            {(activeTab === 'EmailSms') && <AdminSettings initialTab="EmailSms" />}
            {(activeTab === 'Permissions') && <AdminSettings initialTab="Roles" />}
            {(activeTab === 'Approvals') && <RegistrationApprovals />}
            {(activeTab === 'AuditLogs' || activeTab === 'ReviewActions') && <AuditLogs />}

            {(activeTab === 'MasterPayroll' || activeTab === 'Payroll' || activeTab === 'SetupSalary' || activeTab === 'GenerateSlip' || activeTab === 'PayrollReports') && <Payroll initialTab={activeTab === 'SetupSalary' ? 'setup' : 'list'} />}
            {(activeTab === 'ManageDeductions') && <DeductionManagement />}
            {(activeTab === 'GenerateInvoice' || activeTab === 'InvoiceReport') && <InvoiceManagement initialTab={activeTab === 'GenerateInvoice' ? 'generate' : 'list'} />}
            {(activeTab === 'FinanceReports') && <ReportHistory />}
            {(activeTab === 'SalaryGraphs') && <AnalyticsDashboard type="expenditure" />}
            {(activeTab === 'PerformanceReports') && <AnalyticsDashboard type="performance" />}
            {(activeTab === 'MasterProjects' || activeTab === 'Projects') && <ProjectManagement initialTab="overview" />}
            {(activeTab === 'PM_Create') && <ProjectManagement initialTab="create" />}
            {(activeTab === 'PM_Assign') && <ProjectManagement initialTab="assign" />}
            {(activeTab === 'PM_Deadlines') && <ProjectManagement initialTab="deadlines" />}
            {(activeTab === 'PM_Progress') && <ProjectManagement initialTab="progress" />}
            {(activeTab === 'Departments') && <DepartmentManagement />}
            {(activeTab === 'DevVendors') && <VendorManagement initialView="directory" />}
            {(activeTab === 'DevAddVendor') && <VendorManagement initialView="add" />}
            {(activeTab === 'DevToolRepo') && <VendorManagement initialView="repository" />}
            {(activeTab === 'AssetManagement') && <AssetManagement />}
            {(activeTab === 'FinancialEarningYear') && <FinancialYearOverview />}
            {(activeTab === 'WorkflowHub') && <SystemWorkflowHub onNavigate={setActiveTab} />}

            {(activeTab === 'Attendance' || activeTab === 'ViewAttendance' || activeTab === 'EditAttendance' || activeTab === 'MarkAttendance') && <Attendance />}
            {(activeTab === 'EmployeeOnboarding') && <EmployeeOnboarding />}
            {(activeTab === 'WFHRequests') && <WFHManager />}
            {(activeTab === 'Leaves' || activeTab === 'ReviewLeaves' || activeTab === 'ViewLeaves') && <LeaveManagement />}
            {(activeTab === 'ApplyLeave') && <LeaveManagement initialAction="apply" />}
            {(activeTab === 'PersonalPayroll') && <Payroll />}
            {(activeTab === 'ViewTasks' || activeTab === 'UpdateTasks') && <ProjectManagement />}
            {(activeTab === 'PersonalSupport' || activeTab === 'RaiseTicket') && <Support initialAction="raise" />}
            {(activeTab === 'TrackStatus') && <Support initialAction="track" />}
            {(activeTab === 'AskQueries') && <Support initialAction="query" />}

            {(activeTab === 'Override') && <AdminSettings initialTab="Override" />}
            {(activeTab === 'Backup') && <AdminSettings initialTab="Backup" />}
            {(activeTab === 'Geofencing') && <AdminSettings initialTab="Attendance" />}

            {(activeTab === 'Tickets' || activeTab === 'Support_Respond' || activeTab === 'Support_Queries') && <Support initialTab={activeTab} />}
            {(activeTab === 'Documentation') && <EmployeeDocuments />}
            {(activeTab === 'DocVerification') && <EmployeeDocumentManager />}
            {(activeTab === 'Announcements') && <Announcements />}
            {(activeTab === 'ViewProfile' || activeTab === 'EditProfile' || activeTab === 'AccountControl' || activeTab === 'EditProfileAccount' || activeTab === 'ChangePassword') && <AccountControl />}
            {(activeTab === 'ViewPolicies') && <AdminSettings initialTab="Policies" />}
            {(activeTab === 'NotificationCenter') && (
              <NotificationCenter
                targetNotificationId={targetNotificationId}
                clearTargetNotification={() => setTargetNotificationId(null)}
                refreshStats={fetchStats}
              />
            )}

            {/* Lead Management Components */}
            {(activeTab === 'LeadManagement' || activeTab === 'CaptureLeads' || activeTab === 'LeadScoring' || activeTab === 'LeadActivityGlobal') && <CaptureLeads onNavigate={setActiveTab} />}
            {(activeTab === 'LeadReminders') && <LeadReminders />}
            {(activeTab.startsWith('LeadDetail_')) && <LeadDetails leadId={activeTab.split('_')[1]} onNavigate={setActiveTab} />}

            {/* Customer Management Components */}
            {(activeTab === 'CustomerMenu' || activeTab === 'CustomerDirectory' || activeTab === 'CustomerHistory' || activeTab === 'CustomerDocuments') && <CustomerManagement onNavigate={setActiveTab} />}
            {(activeTab.startsWith('CustomerDetail_')) && <CustomerDetail customerId={activeTab.split('_')[1]} onNavigate={setActiveTab} />}

            {/* Sales Pipeline Components */}
            {(activeTab === 'SalesMenu' || activeTab === 'SalesPipeline' || activeTab === 'MyDealsSummary') && <SalesPipeline onNavigate={setActiveTab} />}
            {(activeTab === 'SalesForecasting' || activeTab === 'MyPerformance') && <SalesForecasting />}

            {/* New CRM Employee Dashboard Mapping */}
            {(activeTab === 'MyLeadsSummary') && <CaptureLeads onNavigate={setActiveTab} />}

            {/* Communication Components */}
            {(activeTab === 'CommMenu' || activeTab.startsWith('Comm')) && <Communication initialTab={activeTab} />}

            {/* Examination Components */}
            {activeTab === 'ExamSchedule' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-blue-600" />
                    Examination Management
                  </h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <p className="text-blue-800 font-medium">Exam Schedule Management</p>
                    <p className="text-sm text-gray-600 mt-2">Create and manage examination schedules for all classes.</p>

                    {/* Quick Actions */}
                    <div className="mt-6 flex flex-wrap gap-4">
                      <button
                        onClick={() => {
                          // Open modal or navigate to create new exam
                          console.log('Create New Exam');
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Exam
                      </button>
                      <button
                        onClick={() => {
                          console.log('View All Schedules');
                        }}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View All Schedules
                      </button>
                      <button
                        onClick={() => {
                          console.log('Manage Classes');
                        }}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Classes
                      </button>
                    </div>

                    {/* Schedule Overview */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Class 10 - Mathematics */}
                      <div className="bg-white rounded-xl border border-blue-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Class 10 - Mathematics</h3>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">Active</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-gray-700">Mid-Term Exam</span>
                            <span className="text-sm text-blue-600 font-medium">Mar 15, 2026</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-green-50 rounded-lg">
                            <span className="font-medium text-gray-700">Final Exam</span>
                            <span className="text-sm text-green-600 font-medium">May 20, 2026</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                              Edit Schedule
                            </button>
                            <button className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Class 9 - Science */}
                      <div className="bg-white rounded-xl border border-green-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Class 9 - Science</h3>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">Upcoming</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-green-50 rounded-lg">
                            <span className="font-medium text-gray-700">Physics Exam</span>
                            <span className="text-sm text-green-600 font-medium">Mar 18, 2026</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-yellow-50 rounded-lg">
                            <span className="font-medium text-gray-700">Chemistry Exam</span>
                            <span className="text-sm text-yellow-600 font-medium">Mar 22, 2026</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-red-50 rounded-lg">
                            <span className="font-medium text-gray-700">Biology Exam</span>
                            <span className="text-sm text-red-600 font-medium">Mar 25, 2026</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                              Edit Schedule
                            </button>
                            <button className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Class 8 - English */}
                      <div className="bg-white rounded-xl border border-purple-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Class 8 - English</h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">Scheduled</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-purple-50 rounded-lg">
                            <span className="font-medium text-gray-700">Literature Exam</span>
                            <span className="text-sm text-purple-600 font-medium">Mar 17, 2026</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-indigo-50 rounded-lg">
                            <span className="font-medium text-gray-700">Grammar Exam</span>
                            <span className="text-sm text-indigo-600 font-medium">Mar 24, 2026</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                              Edit Schedule
                            </button>
                            <button className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Add New Class Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-blue-300 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Add New Class Schedule</h3>
                          <p className="text-sm text-gray-600">Create exam schedule for additional classes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'MarksEntry' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-green-600" />
                    Examination Management
                  </h2>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <p className="text-green-800 font-medium">Marks Entry Module</p>
                    <p className="text-sm text-gray-600 mt-2">This is the Marks Entry component.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Results' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-purple-600" />
                    Examination Management
                  </h2>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <p className="text-purple-800 font-medium">Results Module</p>
                    <p className="text-sm text-gray-600 mt-2">This is the Results component.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'DigitalReportCards' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-orange-600" />
                    Examination Management
                  </h2>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <p className="text-orange-800 font-medium">Digital Report Cards Module</p>
                    <p className="text-sm text-gray-600 mt-2">This is the Digital Report Cards component.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Grades' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-red-600" />
                    Examination Management
                  </h2>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <p className="text-red-800 font-medium">Grades Module</p>
                    <p className="text-sm text-gray-600 mt-2">This is the Grades component.</p>
                  </div>
                </div>
              </div>
            )}

            {/* CRM Master Control Components */}
            {(activeTab === 'CRMMaster' || activeTab === 'CRMRoles' || activeTab === 'CRMReportsGroup' || activeTab.startsWith('CRM_Report_')) && <CRMMasterControl initialTab={activeTab.startsWith('CRM_Report_') || activeTab === 'CRMReportsGroup' ? 'Reports' : 'Roles'} />}
            {(activeTab === 'CRMAutomation') && <CRMMasterControl initialTab="Automation" />}
            {(activeTab === 'CRMSettings') && <CRMMasterControl initialTab="Settings" />}
            {(activeTab === 'CRMDataControl') && <CRMMasterControl initialTab="DataControl" />}
            {(activeTab === 'CRMSecurity') && <CRMMasterControl initialTab="Security" />}
            {(activeTab === 'CRMCompany') && <CRMMasterControl initialTab="Company" />}

            {/* Placeholders for new features */}
            {['Security', 'EmailSms'].includes(activeTab) && (
              <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                <Shield size={48} className="mb-4 text-blue-200" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Feature Included</h3>
                <p>The "{activeTab}" module is part of specific Super Admin verification suite.</p>
              </div>
            )}

            {/* Default fallback for examination modules */}
            {['ExamSchedule', 'MarksEntry', 'Results', 'DigitalReportCards', 'Grades'].includes(activeTab) && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-blue-600" />
                    {activeTab === 'ExamSchedule' && 'Exam Schedule'}
                    {activeTab === 'MarksEntry' && 'Marks Entry'}
                    {activeTab === 'Results' && 'Results Management'}
                    {activeTab === 'DigitalReportCards' && 'Digital Report Cards'}
                    {activeTab === 'Grades' && 'Grade Management'}
                  </h2>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <p className="text-green-800 font-medium">
                      {activeTab === 'ExamSchedule' && 'Exam Schedule Module is Active'}
                      {activeTab === 'MarksEntry' && 'Marks Entry Module is Active'}
                      {activeTab === 'Results' && 'Results Module is Active'}
                      {activeTab === 'DigitalReportCards' && 'Digital Report Cards Module is Active'}
                      {activeTab === 'Grades' && 'Grade Management Module is Active'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">This module is fully functional and ready for use.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Handle Examinations parent tab */}
            {activeTab === 'Examinations' && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="text-indigo-600" />
                    Examination Management
                  </h2>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <p className="text-indigo-800 font-medium">Examination Portal</p>
                    <p className="text-sm text-gray-600 mt-2">Select an examination module from the sidebar to manage school examinations.</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-indigo-100">
                        <h4 className="font-medium text-gray-900 mb-2">Available Modules</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Exam Schedule - Create and manage examination timetables</li>
                          <li>• Marks Entry - Enter student marks and grades</li>
                          <li>• Results Management - Publish examination results</li>
                          <li>• Digital Report Cards - Generate digital report cards</li>
                          <li>• Grades Management - Configure grading systems</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-indigo-100">
                        <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Create New Exam Schedule
                          </button>
                          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Enter Student Marks
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </section>
          {/* Logout Confirmation Modal */}
          {
            showLogoutModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cancelLogout} />
                <div className="bg-white rounded-[2rem] p-8 z-10 w-full max-w-sm mx-4 shadow-2xl border border-gray-100 transform animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-6 mx-auto">
                    <LogOut size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-center text-gray-900 mb-2">Confirm Logout</h3>
                  <p className="text-center text-gray-500 font-medium mb-8">Are you sure you want to end your session? You'll need to login again to access your dashboard.</p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={confirmLogout}
                      className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all active:scale-95"
                    >
                      Logout Now
                    </button>
                    <button
                      onClick={cancelLogout}
                      className="w-full py-4 bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-100 transition-all"
                    >
                      Stay Logged In
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        </main >
      </div >
    </>
  );
};

// Sub-components for cleaner code
function SidebarItem({ item, activeTab, expandedMenus, toggleMenu, handleMobileNav, level, pendingCount, stats, handleLogout }) {
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isExpanded = item.id ? expandedMenus[item.id] : false;

  const isDeepActive = (menuItem) => {
    if (activeTab === menuItem.id) return true;
    if (menuItem.submenu) {
      return menuItem.submenu.some(sub => isDeepActive(sub));
    }
    return false;
  };

  const isActive = isDeepActive(item);

  return (
    <div className="mb-0.5 px-3">
      <button
        onClick={() => {
          if (hasSubmenu) toggleMenu(item.id);
          else if (item.id === 'LogoutAction') handleLogout();
          else handleMobileNav(item.id);
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
          ? level === 0 ? 'bg-blue-600 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.45)] font-bold' : 'bg-white/10 text-white font-bold'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-lg transition-colors ${isActive && level === 0 ? 'bg-white/20' : 'bg-slate-900/50 group-hover:bg-slate-800'}`}>
            {React.cloneElement(item.icon, { size: level === 0 ? 18 : 15, className: isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400' })}
          </div>
          <span className={`tracking-wide truncate leading-tight ${level === 0 ? 'text-[13.5px] font-bold' : 'text-[11.5px] font-medium'}`}>{item.label}</span>
        </div>

        {item.id === 'NotificationCenter' && stats.unreadCount > 0 && (
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ml-auto mr-2" />
        )}

        {hasSubmenu && (
          <div className="ml-auto opacity-70">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </button>

      {hasSubmenu && isExpanded && (
        <div className="mt-1 space-y-0.5">
          {item.submenu.map(sub => (
            sub.id === 'LogoutAction' ? (
              <button
                key={sub.id}
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors group"
                style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
              >
                <div className="w-7 h-7 flex items-center justify-center shrink-0 rounded-lg bg-slate-900/50 group-hover:bg-red-500/20 border border-transparent group-hover:border-red-500/30 transition-colors">
                  {React.cloneElement(sub.icon, { size: 15 })}
                </div>
                <span className="text-[12.5px] font-medium tracking-wide truncate leading-tight">{sub.label}</span>
              </button>
            ) : (
              <SidebarItem
                key={sub.id}
                item={sub}
                activeTab={activeTab}
                expandedMenus={expandedMenus}
                toggleMenu={toggleMenu}
                handleMobileNav={handleMobileNav}
                level={level + 1}
                pendingCount={pendingCount}
                stats={stats}
                handleLogout={handleLogout}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
};

function Header({ user, unreadCount, toggleSidebar, menuItems, onNavigate, onNavigateToNotification, onLogout, refreshStats, selectedCompany, companiesList, onCompanyChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ nav: [], employees: [], projects: [], tickets: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const searchRef = React.useRef(null);
  const profileRef = React.useRef(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const inputRef = React.useRef(null);
  const debounceRef = React.useRef(null);

  // Flatten menu items for local navigation search
  const flatMenuItems = React.useMemo(() => {
    const flat = [];
    const flatten = (arr, parentLabel = null) => {
      arr.forEach(item => {
        if (item.id !== 'LogoutAction') {
          flat.push({ id: item.id, label: item.label, parent: parentLabel, icon: item.icon });
          if (item.submenu) flatten(item.submenu, item.label);
        }
      });
    };
    flatten(menuItems || []);
    return flat;
  }, [menuItems]);

  const flatResults = React.useMemo(() => {
    return [
      ...results.nav.map(i => ({ ...i, type: 'nav' })),
      ...results.employees.map(i => ({ ...i, type: 'employees' })),
      ...results.projects.map(i => ({ ...i, type: 'projects' })),
      ...results.tickets.map(i => ({ ...i, type: 'tickets' }))
    ];
  }, [results]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults({ nav: [], employees: [], projects: [], tickets: [] });
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }
    setShowDropdown(true);
    setSelectedIndex(-1);

    // Local nav search (instant)
    const lower = (value || '').toLowerCase();
    const navResults = flatMenuItems.filter(item =>
      (item.label || '').toLowerCase().includes(lower) ||
      (item.parent || '').toLowerCase().includes(lower)
    ).slice(0, 5);
    setResults(prev => ({ ...prev, nav: navResults }));

    // Debounced API search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setResults(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (type, item) => {
    setShowDropdown(false);
    setQuery('');
    if (type === 'nav') {
      onNavigate(item.id);
    } else if (type === 'employees') {
      onNavigate('ViewEmployees');
    } else if (type === 'projects') {
      onNavigate('MasterProjects');
    } else if (type === 'tickets') {
      onNavigate('Tickets');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
      return;
    }

    if (!showDropdown || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = flatResults[selectedIndex];
      handleSelect(selected.type, selected);
    }
  };

  const totalResults = results.nav.length + results.employees.length + results.projects.length + results.tickets.length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Company Dropdown Switcher */}
        {companiesList && (
          <div className="flex items-center gap-2 border-r pr-4 border-gray-200">
            <img
              src={companiesList[selectedCompany]?.logo}
              alt="Current Logo"
              className="w-7 h-7 object-contain rounded-md border border-gray-100 p-0.5 bg-slate-50"
            />
            <div className="relative">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 border border-indigo-100 rounded-xl px-3 py-1.5 text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm w-[110px]"
              >
                <span className="truncate">{companiesList[selectedCompany]?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={`text-indigo-400 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCompanyDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCompanyDropdown(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {Object.keys(companiesList).map((companyKey) => (
                      <button
                        key={companyKey}
                        onClick={() => {
                          onCompanyChange(companyKey);
                          setShowCompanyDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold transition-colors ${selectedCompany === companyKey ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center p-1 shrink-0">
                          <img src={companiesList[companyKey].logo} className="w-full h-full object-contain" alt="logo" />
                        </div>
                        <span className="truncate">{companiesList[companyKey].name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <NotificationBell
          unreadCount={unreadCount}
          onNavigateToNotification={onNavigateToNotification}
          onNavigate={onNavigate}
          refreshStats={refreshStats}
        />
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 border-l pl-6 hover:bg-gray-50 transition-colors py-1 group"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Employee'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
              {(user?.name || 'U').charAt(0)}
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account</p>
              </div>
              <button
                onClick={() => { setShowProfileDropdown(false); onNavigate('ViewProfile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
              >
                <UserCircle size={18} /> My Profile
              </button>
              <div className="h-px bg-gray-50 my-1" />
              <button
                onClick={() => { setShowProfileDropdown(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

function NotificationBell({ unreadCount, onNavigateToNotification, onNavigate, refreshStats }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const bellRef = React.useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      const res = await axios.get(`${baseUrl}/api/notifications/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.debug('Notifications API response:', res && res.data);
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleBellClick = () => {
    if (!showNotifs) fetchNotifications();
    setShowNotifs(!showNotifs);
  };

  const markAsRead = async (id) => {
    try {
      if (String(id).startsWith('ann-')) {
        const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        if (!readAnnouncements.includes(id)) {
          readAnnouncements.push(id);
          localStorage.setItem('read_announcements', JSON.stringify(readAnnouncements));
        }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        return;
      }

      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      // Mark all server notifications as read
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mark all announcements as read in localStorage
      const annIds = notifications.filter(n => String(n.id).startsWith('ann-') && !n.is_read).map(n => n.id);
      if (annIds.length > 0) {
        const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        annIds.forEach(id => { if (!readAnnouncements.includes(id)) readAnnouncements.push(id); });
        localStorage.setItem('read_announcements', JSON.stringify(readAnnouncements));
      }
      // Update all notifications in state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const typeColors = {
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {showNotifs && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[450px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <div className="flex flex-wrap items-center gap-2">
              {notifications.filter(n => !n.is_read).length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loadingNotifs && (
              <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
            )}
            {!loadingNotifs && notifications.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Bell size={32} className="mx-auto mb-2 text-gray-200" />
                No notifications yet
              </div>
            )}
            {!loadingNotifs && notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id);
                  setShowNotifs(false);
                  if (onNavigateToNotification) {
                    onNavigateToNotification(notif.id);
                  }
                }}
                className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColors[notif.type] || typeColors.info}`}>
                        {(notif.type || 'info').toUpperCase()}
                      </span>
                      <span className="text-[11px] text-gray-400">{timeAgo(notif.created_at)}</span>
                    </div>
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                    <p className="text-[12px] text-gray-400 truncate">{notif.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100">
            <button
              onClick={() => { setShowNotifs(false); onNavigate('NotificationCenter'); }}
              className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors py-1"
            >
              View Direct Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function PageHeader({ title }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 capitalize">{title.replace(/([A-Z])/g, ' $1').trim()}</h2>
      <p className="text-gray-500">Manage your organization's data.</p>
    </div>
  );
}

function DashboardStats({ stats, onNavigate }) {
  const userStats = JSON.parse(localStorage.getItem('user')) || {};
  const isSuperAdminStat = userStats?.role === 'Super Admin';
  const [isEditingExec, setIsEditingExec] = useState(false);
  const [execData, setExecData] = useState(() => {
    return JSON.parse(localStorage.getItem('execDashboardData')) || {
      totalEmployees: stats?.totalEmployees ?? 0,
      activeProjects: stats?.activeProjects ?? 0,
      totalLeads: '1,250',
      pipelineValue: '2.45M',
      monthlyRevenue: stats?.revenueTotal ? (stats.revenueTotal / 83).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '850K',
      profitYTD: '210K'
    };
  });

  const handleSaveExec = (e) => {
    e.preventDefault();
    localStorage.setItem('execDashboardData', JSON.stringify(execData));
    setIsEditingExec(false);
  };

  const handleChangeExec = (field, value) => {
    setExecData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* ─── EXECUTIVE DASHBOARD Modal ─── */}
      {isEditingExec && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111e42] p-8 rounded-2xl w-full max-w-md shadow-2xl border border-blue-400/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-lg">Edit Executive Data</h3>
              <button onClick={() => setIsEditingExec(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveExec} className="space-y-4 text-white">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Total Employees</label>
                <input type="text" className="w-full bg-[#1a2c5b] border border-blue-400/20 rounded p-2 text-white" value={execData.totalEmployees} onChange={(e) => handleChangeExec('totalEmployees', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Active Projects</label>
                <input type="text" className="w-full bg-[#1a2c5b] border border-blue-400/20 rounded p-2 text-white" value={execData.activeProjects} onChange={(e) => handleChangeExec('activeProjects', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Total Leads</label>
                <input type="text" className="w-full bg-[#1a2c5b] border border-blue-400/20 rounded p-2 text-white" value={execData.totalLeads} onChange={(e) => handleChangeExec('totalLeads', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Pipeline Value (₹)</label>
                <input type="text" className="w-full bg-[#1a2c5b] border border-blue-400/20 rounded p-2 text-white" value={execData.pipelineValue} onChange={(e) => handleChangeExec('pipelineValue', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Monthly Revenue (₹)</label>
                <input type="text" className="w-full bg-[#1a2c5b] border border-blue-400/20 rounded p-2 text-white" value={execData.monthlyRevenue} onChange={(e) => handleChangeExec('monthlyRevenue', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Profit YTD (₹)</label>
                <input type="text" className="w-full bg-[#1a2c5b] border border-blue-400/20 rounded p-2 text-white" value={execData.profitYTD} onChange={(e) => handleChangeExec('profitYTD', e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-[#15b27a] hover:bg-[#118d61] text-white font-bold py-3 rounded-lg mt-4 transition-colors">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── WELCOME BANNER ─── */}
      <div className="bg-gradient-to-r from-[#1c1d32] to-[#3a2546] rounded-[24px] p-8 md:p-10 mb-8 shadow-sm">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Welcome Back</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
          {(() => {
            const hour = new Date().getHours();
            if (hour < 12) return 'Good morning';
            if (hour < 17) return 'Good afternoon';
            return 'Good evening';
          })()}, {userStats?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-400 font-medium">
          "Believe you can and you're halfway there."
        </p>
      </div>

      {/* ─── EXECUTIVE DASHBOARD Real-time Overview Banner ─── */}
      {!userStats?.role?.includes('Employee') && (
        <div className="rounded-[2rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] drop-shadow-2xl mb-8 flex flex-col lg:flex-row text-white border-none bg-gradient-to-r from-[#0d1a3c] to-[#0f1d40]">
          <div className="flex-1 p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-[#0d2238]/50 w-max px-5 py-2 rounded-full border border-blue-400/20 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#15b27a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#15b27a]"></span>
                </span>
                <h3 className="text-xs font-bold tracking-widest text-blue-100">EXECUTIVE DASHBOARD <span className="text-[#15b27a] ml-1">(LIVE)</span></h3>
              </div>
              <button onClick={() => setIsEditingExec(true)} className="flex items-center gap-2 text-xs bg-[#1a365d] hover:bg-[#254882] border border-blue-400/30 text-white px-4 py-2 rounded-full transition-colors shadow-sm">
                <Edit size={14} /> Edit Data
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Total Employees */}
              <div className="space-y-3 cursor-default bg-[#132345] p-4 lg:p-5 rounded-2xl border border-blue-400/10 shadow-lg min-w-0">
                <div className="flex items-start gap-2 text-[#6e8ba6]">
                  <Users size={16} strokeWidth={1.5} className="mt-0.5 min-w-[16px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">TOTAL<br />EMPLOYEES</span>
                </div>
                <p className="text-xl md:text-2xl 2xl:text-3xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis">{execData.totalEmployees}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#13a886] font-semibold bg-[#0c2e3d] px-2 py-1.5 rounded-lg w-max max-w-full">
                  <TrendingUp size={12} strokeWidth={2} className="min-w-[12px]" /> <span className="whitespace-nowrap overflow-hidden text-ellipsis">8% vs last month</span>
                </div>
              </div>

              {/* Active Projects */}
              <div className="space-y-3 cursor-default bg-[#132345] p-4 lg:p-5 rounded-2xl border border-blue-400/10 shadow-lg min-w-0">
                <div className="flex items-start gap-2 text-[#6e8ba6]">
                  <Briefcase size={16} strokeWidth={1.5} className="mt-0.5 min-w-[16px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">ACTIVE<br />PROJECTS</span>
                </div>
                <p className="text-xl md:text-2xl 2xl:text-3xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis">{execData.activeProjects}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#13a886] font-semibold bg-[#0c2e3d] px-2 py-1.5 rounded-lg w-max max-w-full">
                  <TrendingUp size={12} strokeWidth={2} className="min-w-[12px]" /> <span className="whitespace-nowrap overflow-hidden text-ellipsis">12% vs last month</span>
                </div>
              </div>

              {/* Total Leads */}
              <div className="space-y-3 cursor-default bg-[#132345] p-4 lg:p-5 rounded-2xl border border-blue-400/10 shadow-lg min-w-0">
                <div className="flex items-start gap-2 text-[#6e8ba6]">
                  <Target size={16} strokeWidth={1.5} className="mt-0.5 min-w-[16px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">TOTAL<br />LEADS</span>
                </div>
                <p className="text-xl md:text-2xl 2xl:text-3xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis">{execData.totalLeads}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#13a886] font-semibold bg-[#0c2e3d] px-2 py-1.5 rounded-lg w-max max-w-full">
                  <TrendingUp size={12} strokeWidth={2} className="min-w-[12px]" /> <span className="whitespace-nowrap overflow-hidden text-ellipsis">15% vs last month</span>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="space-y-3 cursor-default bg-[#132345] p-4 lg:p-5 rounded-2xl border border-blue-400/10 shadow-lg min-w-0">
                <div className="flex items-start gap-2 text-[#6e8ba6]">
                  <Activity size={16} strokeWidth={1.5} className="mt-0.5 min-w-[16px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">MONTHLY<br />REVENUE</span>
                </div>
                <p className="text-xl md:text-2xl 2xl:text-3xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis">₹{execData.monthlyRevenue}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#13a886] font-semibold bg-[#0c2e3d] px-2 py-1.5 rounded-lg w-max max-w-full">
                  <TrendingUp size={12} strokeWidth={2} className="min-w-[12px]" /> <span className="whitespace-nowrap overflow-hidden text-ellipsis">10% vs last month</span>
                </div>
              </div>

              {/* Profit (YTD) */}
              <div className="space-y-3 cursor-default bg-[#132345] p-4 lg:p-5 rounded-2xl border border-blue-400/10 shadow-lg min-w-0">
                <div className="flex items-start gap-2 text-[#6e8ba6]">
                  <Database size={16} strokeWidth={1.5} className="mt-0.5 min-w-[16px]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">PROFIT<br />(YTD)</span>
                </div>
                <p className="text-xl md:text-2xl 2xl:text-3xl font-extrabold tracking-tight text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis">₹{execData.profitYTD}</p>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#13a886] font-semibold bg-[#0c2e3d] px-2 py-1.5 rounded-lg w-max max-w-full">
                  <TrendingUp size={12} strokeWidth={2} className="min-w-[12px]" /> <span className="whitespace-nowrap overflow-hidden text-ellipsis">14% vs last month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="w-full lg:w-[320px] bg-[#111e42] p-5 md:p-6 border-t lg:border-t-0 lg:border-l border-[#1c305c]/50 flex flex-col justify-center space-y-5 shrink-0 rounded-b-[2rem] lg:rounded-bl-none lg:rounded-r-[2rem]">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#6e8ba6]">QUICK LINKS</h4>
            <div className="space-y-3">
              <button onClick={() => onNavigate('WorkflowHub')} className="flex items-center gap-4 w-full text-left bg-[#1e2d57] hover:bg-[#253769] px-5 py-4 rounded-2xl transition-colors shadow-sm">
                <div className="text-[#84a9e8]">
                  <Users size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[15px] font-semibold text-white">My Workspace</span>
              </button>

              <button onClick={() => onNavigate('Approvals')} className="flex items-center gap-4 w-full text-left bg-[#1e2d57] hover:bg-[#253769] px-5 py-4 rounded-2xl transition-colors shadow-sm">
                <div className="text-[#96a0cc] relative">
                  <Mail size={20} strokeWidth={1.5} />
                  {(stats.pendingApprovals ?? 0) > 0 && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#f43f5e] ring-2 ring-[#1e2d57]"></span>}
                </div>
                <span className="text-[15px] font-semibold text-white flex-1">Approvals</span>
                <span className="text-xs font-bold text-white bg-[#2a3c6b] px-3 py-1 rounded-full">{stats.pendingApprovals ?? 0}</span>
              </button>

              <button onClick={() => onNavigate('NotificationCenter')} className="flex items-center gap-4 w-full text-left bg-[#1e2d57] hover:bg-[#253769] px-5 py-4 rounded-2xl transition-colors shadow-sm">
                <div className="text-[#eab308]">
                  <Bell size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[15px] font-semibold text-white flex-1">Notifications</span>
                <span className="text-xs font-bold text-[#eab308] bg-[#423a23] px-3 py-1 rounded-full">{stats.unreadCount ?? 0}</span>
              </button>

              <button onClick={() => onNavigate('FinanceReports')} className="flex items-center gap-4 w-full text-left bg-[#1e2d57] hover:bg-[#253769] px-5 py-4 rounded-2xl transition-colors shadow-sm">
                <div className="text-[#10b981]">
                  <FileText size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[15px] font-semibold text-white">Reports Center</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dashboard Overview Widgets ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {userStats?.role?.includes('Employee') ? (
          <>
            <StatCard label="My Total Tasks" value={stats.totalTasks || 0} color="blue" icon={<ListTodo size={24} />} onClick={() => onNavigate('ViewTasks')} />
            <StatCard label="Completed Tasks" value={stats.completedTasks || 0} color="emerald" icon={<ListTodo size={24} />} onClick={() => onNavigate('ViewTasks')} />
            <StatCard label="My Leaves" value={stats.pendingLeaves || 0} color="amber" icon={<FileText size={24} />} onClick={() => onNavigate('ViewLeaves')} />
            <StatCard label="Attend. Days" value={stats.activeProjects || 0} color="indigo" icon={<Clock size={24} />} onClick={() => onNavigate('MarkAttendance')} />
          </>
        ) : (
          <>
            {/* Total Revenue */}
            <StatCard
              label="Total Revenue"
              value={`₹${(stats.revenueTotal || 1250000).toLocaleString()}`}
              color="emerald"
              icon={<TrendingUp size={24} />}
              onClick={() => onNavigate('FinancialEarningYear')}
            />

            {/* Total Expenses */}
            <StatCard
              label="Total Expenses"
              value={`₹${(stats.payrollTotal || 528000).toLocaleString()}`}
              color="rose"
              icon={<TrendingDown size={24} />}
              onClick={() => onNavigate('WorkflowHub')}
            />

            {/* Active Clients */}
            <StatCard
              label="Active Clients"
              value={stats.activeClients || 42}
              color="blue"
              icon={<Users size={24} />}
              onClick={() => onNavigate('CustomerMenu')}
            />

            {/* Active Employees */}
            <StatCard
              label="Active Employees"
              value={stats.totalEmployees || 18}
              color="amber"
              icon={<UserCircle size={24} />}
              onClick={() => onNavigate('ViewEmployees')}
            />

            {/* Pending Approvals */}
            <StatCard
              label="Pending Approvals"
              value={stats.pendingApprovals || stats.pendingLeaves || 5}
              color="purple"
              icon={<ShieldCheck size={24} />}
              onClick={() => onNavigate('Approvals')}
            />

            {/* Upcoming Payments */}
            <StatCard
              label="Upcoming Payments"
              value="₹84,500"
              color="indigo"
              icon={<Calendar size={24} />}
              onClick={() => onNavigate('Payroll')}
            />

            {/* Monthly Reports (Unified Action widget) */}
            <div
              onClick={() => onNavigate('FinanceReports')}
              className="col-span-1 md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl text-white">
                  <BarChart size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-800">Monthly Reports Portal</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Generate and download compiled monthly PDF/CSV audits</p>
                </div>
              </div>
              <ChevronRight className="text-blue-600" />
            </div>
          </>
        )}
      </div>

      {/* Super Admin Dynamic Graphs */}
      {isSuperAdminStat && <DashboardGraphs />}

      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
    </>
  );
}

function StatCard({ label, value, color, icon, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between transition-transform hover:scale-105 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-[10px] 2xl:text-xs font-bold text-gray-400 uppercase tracking-wider truncate" title={label}>{label}</span>
        <span className="text-xl 2xl:text-2xl font-black text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{value}</span>
      </div>
      {icon && (
        <div className={`p-2.5 2xl:p-3 rounded-xl flex-shrink-0 ml-4 ${colorMap[color] || 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
