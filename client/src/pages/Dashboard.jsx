import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import EventManager from "../components/EventManager";
import * as THREE from "three";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "event", message: "New event registration deadline approaching", time: "2 hours ago" },
    { id: 2, type: "update", message: "Event 'Tech Conference 2025' has been updated", time: "1 day ago" },
    { id: 3, type: "reminder", message: "Don't forget to check your upcoming events", time: "3 days ago" }
  ]);
  const mountRef = useRef(null);
  const animationIdRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Save theme preference
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // 3D Background Animation
  useEffect(() => {
    if (!mountRef.current) return;
    
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    camera.position.set(0, 0, 15);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(
      new THREE.DirectionalLight(0xffffff, 0.8).add(light => light.position.set(5, 5, 5)),
      new THREE.DirectionalLight(0x8b5cf6, 0.4).add(light => light.position.set(-3, -2, -4)),
      new THREE.AmbientLight(0xffffff, 0.3)
    );

    // Create floating dashboard elements
    const dashboardElements = [];
    for (let i = 0; i < 20; i++) {
      const geometries = [
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.CylinderGeometry(0.3, 0.3, 0.6),
        new THREE.SphereGeometry(0.25),
        new THREE.TetrahedronGeometry(0.4)
      ];
      
      const element = new THREE.Mesh(
        geometries[i % 4],
        new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL((i * 0.05) % 1, 0.6, 0.7),
          transparent: true,
          opacity: 0.2,
          wireframe: i % 3 === 0,
        })
      );
      
      element.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      
      element.userData = {
        rotSpeed: [(Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01],
        floatSpeed: Math.random() * 0.005 + 0.002,
        offset: Math.random() * Math.PI * 2,
      };
      
      dashboardElements.push(element);
      scene.add(element);
    }

    // Particles
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 25;
      positions[i + 2] = (Math.random() - 0.5) * 25;
      velocities[i] = (Math.random() - 0.5) * 0.008;
      velocities[i + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i + 2] = (Math.random() - 0.5) * 0.008;
    }
    
    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
      new THREE.PointsMaterial({
        size: 0.02,
        color: darkMode ? 0xffffff : 0x1e293b,
        transparent: true,
        opacity: 0.4,
      })
    );
    scene.add(particles);

    const onResize = () => {
      if (!mount || !renderer || !camera) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    
    window.addEventListener("resize", onResize);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (!renderer || !scene || !camera) return;
      
      const t = clock.getElapsedTime();
      
      // Animate dashboard elements
      dashboardElements.forEach((element, i) => {
        const { rotSpeed, floatSpeed, offset } = element.userData;
        element.rotation.x += rotSpeed[0];
        element.rotation.y += rotSpeed[1];
        element.rotation.z += rotSpeed[2];
        element.position.y += Math.sin(t * floatSpeed + offset) * 0.002;
        element.material.opacity = 0.15 + Math.sin(t * 2 + i) * 0.1;
      });

      // Animate particles
      particles.rotation.y += 0.0005;
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        if (Math.abs(positions[i]) > 20) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 12) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 12) velocities[i + 2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      camera.position.x = Math.sin(t * 0.05) * 2;
      camera.position.y = Math.cos(t * 0.08) * 1;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
    };
  }, [darkMode]);

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '👑';
      case 'faculty': return '👨‍🏫';
      case 'student': return '🎓';
      default: return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'from-red-500 to-pink-500';
      case 'faculty': return 'from-blue-500 to-indigo-500';
      case 'student': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const TabButton = ({ id, icon, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
        isActive 
          ? darkMode 
            ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white border-2 border-purple-400/50" 
            : "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-2 border-purple-300"
          : darkMode 
            ? "hover:bg-white/10 text-white/70 hover:text-white" 
            : "hover:bg-slate-100 text-slate-600 hover:text-slate-800"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className={sidebarOpen ? "block" : "hidden lg:block"}>{label}</span>
    </button>
  );

  const StatCard = ({ icon, title, value, change, color }) => (
    <div className={`p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-xl ${
      darkMode 
        ? "bg-white/10 border-white/20 shadow-black/20" 
        : "bg-white/80 border-slate-200/50 shadow-slate-900/10"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
            change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {change}
          </span>
        )}
      </div>
      <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>{title}</h3>
      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p>
    </div>
  );

  const NotificationItem = ({ notification, onDismiss }) => {
    const getNotificationIcon = (type) => {
      switch(type) {
        case 'event': return '📅';
        case 'update': return '🔄';
        case 'reminder': return '⏰';
        default: return '📢';
      }
    };

    return (
      <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
        darkMode 
          ? "bg-white/5 border-white/10 hover:bg-white/10" 
          : "bg-white/70 border-slate-200/50 hover:bg-white"
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-xl">{getNotificationIcon(notification.type)}</span>
          <div className="flex-1">
            <p className={`text-sm ${darkMode ? 'text-white/90' : 'text-slate-700'}`}>{notification.message}</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-white/50' : 'text-slate-500'}`}>{notification.time}</p>
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className={`text-xl hover:scale-110 transition-transform duration-200 ${
              darkMode ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={`min-h-screen relative overflow-hidden ${
        darkMode ? "bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937]" 
                 : "bg-gradient-to-br from-[#eef2ff] via-white to-[#cffafe]"
      }`}>
        
        {/* 3D Background */}
        <div ref={mountRef} className="fixed inset-0 -z-10 opacity-30" />
        
        {/* Background Elements */}
        <div className="fixed inset-0 opacity-10">
          <div className={`absolute inset-0 ${darkMode 
            ? "bg-gradient-to-r from-purple-800/20 via-pink-800/20 to-cyan-800/20"
            : "bg-gradient-to-r from-purple-200/30 via-pink-200/30 to-cyan-200/30"
          } animate-pulse`} />
        </div>

        {/* Top Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
          darkMode 
            ? "bg-slate-900/80 border-white/10" 
            : "bg-white/80 border-slate-200/50"
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden p-2 rounded-xl transition-all duration-300 ${
                  darkMode ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center gap-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  EventSphere
                </h1>
              </Link>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                  darkMode ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 relative ${
                  darkMode ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-600"
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                  darkMode ? "bg-white/10" : "bg-slate-100"
                }`}>
                  <span className="text-xl">{getRoleIcon(user?.role)}</span>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {user?.name}
                    </p>
                    <p className={`text-xs capitalize ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                      {user?.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} lg:w-64 transition-all duration-300 ${
            darkMode 
              ? "bg-slate-900/50 border-white/10" 
              : "bg-white/50 border-slate-200/50"
          } backdrop-blur-xl border-r min-h-screen sticky top-16 z-40`}>
            <nav className="p-6 space-y-2">
              <TabButton
                id="overview"
                icon="📊"
                label="Overview"
                isActive={activeTab === "overview"}
                onClick={setActiveTab}
              />
              <TabButton
                id="events"
                icon="📅"
                label="Events"
                isActive={activeTab === "events"}
                onClick={setActiveTab}
              />
              <TabButton
                id="analytics"
                icon="📈"
                label="Analytics"
                isActive={activeTab === "analytics"}
                onClick={setActiveTab}
              />
              <TabButton
                id="settings"
                icon="⚙️"
                label="Settings"
                isActive={activeTab === "settings"}
                onClick={setActiveTab}
              />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Welcome back, {user?.name}! 👋
              </h1>
              <p className={`${darkMode ? 'text-white/70' : 'text-slate-600'}`}>
                Here's what's happening with your events today.
              </p>
            </div>

            {/* Role Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getRoleColor(user?.role)} text-white font-medium mb-6 shadow-lg`}>
              <span className="text-lg">{getRoleIcon(user?.role)}</span>
              <span className="capitalize">{user?.role} Dashboard</span>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon="📅"
                    title="Total Events"
                    value="24"
                    change="+12%"
                    color="from-blue-500 to-blue-600"
                  />
                  <StatCard
                    icon="👥"
                    title="Participants"
                    value="1,248"
                    change="+8%"
                    color="from-green-500 to-green-600"
                  />
                  <StatCard
                    icon="⭐"
                    title="Rating"
                    value="4.8"
                    change="+0.2"
                    color="from-yellow-500 to-orange-500"
                  />
                  <StatCard
                    icon="🎯"
                    title="Completion"
                    value="92%"
                    change="+5%"
                    color="from-purple-500 to-pink-500"
                  />
                </div>

                {/* Recent Activity */}
                <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                  darkMode 
                    ? "bg-white/10 border-white/20" 
                    : "bg-white/80 border-slate-200/50"
                }`}>
                  <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    📢 Recent Notifications
                  </h3>
                  <div className="space-y-3">
                    {notifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                      />
                    ))}
                    {notifications.length === 0 && (
                      <p className={`text-center py-8 ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>
                        No new notifications 🎉
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "events" && (
              <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                darkMode 
                  ? "bg-white/10 border-white/20" 
                  : "bg-white/80 border-slate-200/50"
              }`}>
                <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  📌 Event Management
                </h3>
                <EventManager />
              </div>
            )}

            {activeTab === "analytics" && (
              <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                darkMode 
                  ? "bg-white/10 border-white/20" 
                  : "bg-white/80 border-slate-200/50"
              }`}>
                <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  📈 Analytics & Insights
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-xl border ${
                    darkMode ? "bg-white/5 border-white/10" : "bg-white/50 border-slate-200/30"
                  }`}>
                    <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Event Trends</h4>
                    <p className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>
                      Your events have seen a 15% increase in participation this month.
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    darkMode ? "bg-white/5 border-white/10" : "bg-white/50 border-slate-200/30"
                  }`}>
                    <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Popular Categories</h4>
                    <p className={`text-sm ${darkMode ? 'text-white/70' : 'text-slate-600'}`}>
                      Technology and Education events are performing best.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                darkMode 
                  ? "bg-white/10 border-white/20" 
                  : "bg-white/80 border-slate-200/50"
              }`}>
                <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  ⚙️ Settings & Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`${darkMode ? 'text-white' : 'text-slate-800'}`}>Dark Mode</span>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-12 h-6 rounded-full transition-all duration-300 ${
                        darkMode ? 'bg-purple-500' : 'bg-slate-300'
                      } relative`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 absolute top-0.5 ${
                        darkMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`${darkMode ? 'text-white' : 'text-slate-800'}`}>Email Notifications</span>
                    <button className="w-12 h-6 bg-purple-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full transition-transform duration-300 absolute top-0.5 translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
}
