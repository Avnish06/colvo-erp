import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  LineChart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const LandingPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        let targetRoute = '/dashboard';
        if (user && user.role === 'Vendor') {
          targetRoute = '/vendor-dashboard';
        }
        setDashboardRoute(targetRoute);
        // Proactive Redirect: If already logged in, don't allow staying on landing page
        navigate(targetRoute, { replace: true });
      } catch (e) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTab');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="group relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-indigo-600 transition-all duration-200 bg-white border-2 border-indigo-200 rounded-full hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                >
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  replace
                  className="group relative inline-flex items-center justify-center px-6 py-2.5 font-medium text-white transition-all duration-200 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5"
                >
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="text-center max-w-4xl mx-auto relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
              Manage Your Enterprise <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                With Ultimate Precision
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The all-in-one management system designed to streamline your operations, empower your team, and accelerate your business growth.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={isAuthenticated ? dashboardRoute : "/login"}
                replace
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 shadow-xl shadow-indigo-200 hover:-translate-y-1 hover:shadow-2xl"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-700 transition-all duration-200 bg-white border-2 border-slate-200 rounded-full hover:border-indigo-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:-translate-y-1 hover:shadow-lg"
              >
                Register an Account
              </Link>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                icon: <Users className="w-8 h-8 text-indigo-500" />,
                title: "Team Management",
                description: "Effortlessly manage roles, permissions, and performance of your entire workforce."
              },
              {
                icon: <LineChart className="w-8 h-8 text-blue-500" />,
                title: "Insightful Analytics",
                description: "Get real-time insights with comprehensive dashboards and detailed reporting tools."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
                title: "Enterprise Security",
                description: "Bank-grade security protocols ensuring your company data remains completely protected."
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
