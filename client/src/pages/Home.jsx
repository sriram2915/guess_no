import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Home() {
  const mountRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!mountRef.current) return;
    
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    camera.position.set(0, 0, 6);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(
      new THREE.DirectionalLight(0xffffff, 1.2).add(light => light.position.set(3, 4, 5)),
      new THREE.DirectionalLight(0xff66cc, 0.6).add(light => light.position.set(-5, -2, -3)),
      new THREE.AmbientLight(0xffffff, 0.35)
    );

    // Shader uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_intensity: { value: 0.7 },
      u_hover: { value: 0.0 },
      u_c1: { value: new THREE.Color("#8b5cf6") },
      u_c2: { value: new THREE.Color("#ec4899") },
      u_c3: { value: new THREE.Color("#22d3ee") },
    };

    // Simplified shader strings (keeping same visual effect)
    const vertexShader = `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      void main() {
        gl_FragColor = vec4(1.0);
      }
    `;

    // Create blob
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 80),
      new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    );
    scene.add(blob);

    // Create particles
    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const k = i * 3;
        positions[k] = (Math.random() - 0.5) * 25;
        positions[k + 1] = (Math.random() - 0.5) * 25;
        positions[k + 2] = (Math.random() - 0.5) * 25;
        velocities[k] = (Math.random() - 0.5) * 0.015;
        velocities[k + 1] = (Math.random() - 0.5) * 0.015;
        velocities[k + 2] = (Math.random() - 0.5) * 0.015;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: 0.03,
        color: darkMode ? 0xffffff : 0x0f172a,
        transparent: true,
        opacity: 0.4,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Floating shapes
    const shapes = [];
    for (let i = 0; i < 10; i++) {
      const geometries = [
        new THREE.TetrahedronGeometry(0.1),
        new THREE.OctahedronGeometry(0.08),
        new THREE.IcosahedronGeometry(0.06)
      ];
      const shape = new THREE.Mesh(
        geometries[i % 3],
        new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
          transparent: true,
          opacity: 0.3,
          wireframe: true,
        })
      );
      shape.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
      shape.userData = {
        rotSpeed: [(Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02],
        floatSpeed: Math.random() * 0.01 + 0.005,
        offset: Math.random() * Math.PI * 2,
      };
      shapes.push(shape);
      scene.add(shape);
    }

    // Event handlers
    let hoverTarget = 0;
    const onEnter = () => (hoverTarget = 1);
    const onLeave = () => (hoverTarget = 0);
    const onResize = () => {
      if (!mount || !renderer || !camera) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    
    mount.addEventListener("mouseenter", onEnter);
    mount.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      if (!renderer || !scene || !camera) return;
      
      const t = clock.getElapsedTime();
      uniforms.u_time.value = t;
      uniforms.u_hover.value += (hoverTarget - uniforms.u_hover.value) * 0.08;

      // Animate objects
      blob.rotation.y += 0.003;
      blob.rotation.x = Math.sin(t * 0.5) * 0.1;
      blob.position.y = Math.sin(t * 0.3) * 0.2;
      
      particles.rotation.y -= 0.001;
      
      // Update particle positions
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        if (Math.abs(positions[i]) > 12) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 12) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 12) velocities[i + 2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Animate shapes
      shapes.forEach((shape, i) => {
        const { rotSpeed, floatSpeed, offset } = shape.userData;
        shape.rotation.x += rotSpeed[0];
        shape.rotation.y += rotSpeed[1];
        shape.rotation.z += rotSpeed[2];
        shape.position.y += Math.sin(t * floatSpeed + offset) * 0.002;
        shape.material.opacity = 0.2 + Math.sin(t * 2 + i) * 0.1;
      });

      camera.position.x = Math.sin(t * 0.1) * 0.1;
      camera.position.y = Math.cos(t * 0.15) * 0.1;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("mouseenter", onEnter);
      mount.removeEventListener("mouseleave", onLeave);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
    };
  }, [darkMode]);

  const ProfileIcon = ({ isOpen }) => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d={isOpen ? "M6 18L18 6M6 6l12 12" : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"} />
    </svg>
  );

  const MenuItem = ({ to, icon, children, onClick }) => (
    <Link
      to={to}
      className="flex items-center px-6 py-3 text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <span className="font-medium">{children}</span>
    </Link>
  );

  const MenuButton = ({ icon, children, onClick }) => (
    <button 
      onClick={onClick}
      className="flex items-center w-full px-6 py-3 text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-200 group"
    >
      <div className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <span className="font-medium">{children}</span>
    </button>
  );

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={`relative min-h-screen overflow-hidden ${
        darkMode ? "bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937]" 
                 : "bg-gradient-to-br from-[#eef2ff] via-white to-[#cffafe]"
      }`}>
        
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30">
            <div className={`absolute inset-0 ${darkMode 
                ? "bg-gradient-to-r from-purple-800/20 via-pink-800/20 to-cyan-800/20"
                : "bg-gradient-to-r from-purple-200/30 via-pink-200/30 to-cyan-200/30"
            } animate-pulse`} />
        </div>

        <div className="absolute inset-0 -z-5">
            {[...Array(8)].map((_, i) => (
                <div key={i} className={`absolute rounded-full opacity-10 ${darkMode ? "bg-white" : "bg-slate-900"}`}
                    style={{
                        width: `${20 + i * 10}px`,
                        height: `${20 + i * 10}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float-${i % 3} ${8 + i * 2}s ease-in-out infinite`
                    }} />
            ))}
            {[...Array(5)].map((_, i) => (
                <div key={`orb-${i}`} className="absolute rounded-full blur-xl opacity-20"
                    style={{
                        width: `${100 + i * 50}px`,
                        height: `${100 + i * 50}px`,
                        background: `radial-gradient(circle, ${['#8b5cf6','#ec4899','#22d3ee','#f59e0b','#10b981'][i]} 0%, transparent 70%)`,
                        left: `${20 + i * 15}%`,
                        top: `${10 + i * 20}%`,
                        animation: `drift-${i % 2} ${15 + i * 3}s ease-in-out infinite`
                    }} />
            ))}
        </div>

        <div ref={mountRef} className="absolute inset-0 -z-10 select-none" />

        <style jsx>{`
            @keyframes float-0 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-10px, -10px); } }
            @keyframes float-1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(10px, 10px); } }
            @keyframes float-2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-5px, 5px); } }
            @keyframes drift-0 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -20px); } }
            @keyframes drift-1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 20px); } }
            .animate-pulse { animation: pulse 2s ease-in-out infinite; }
            @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        `}</style>

        {/* Profile Menu */}
        <div className="absolute top-5 right-6 z-50">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(prev => !prev)}
              className={`w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                menuOpen ? "bg-gradient-to-r from-purple-500/80 to-pink-500/80 rotate-180 shadow-2xl"
                         : darkMode 
                           ? "bg-white/20 hover:bg-white/30" 
                           : "bg-slate-800/70 hover:bg-slate-700/80"
              }`}
            >
              <div className={`transition-all duration-300 ${menuOpen ? "rotate-45" : ""}`}>
                <ProfileIcon isOpen={menuOpen} />
              </div>
            </button>

            <div className={`absolute right-0 mt-3 w-64 transform transition-all duration-300 ease-out origin-top-right ${
              menuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Account</h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Manage your profile</p>
                </div>
                <div className="py-2">
                  <MenuItem to="/login" onClick={() => setMenuOpen(false)}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}>
                    Login
                  </MenuItem>
                  <MenuItem to="/signup" onClick={() => setMenuOpen(false)}
                    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}>
                    Sign Up
                  </MenuItem>
                  <div className="border-t border-white/10 mt-2 pt-2">
                    <MenuButton onClick={() => setMenuOpen(false)}
                      icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
                      Settings
                    </MenuButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 flex flex-col items-center justify-center text-center min-h-[75vh] px-6 transform-gpu">
          <div className="animate-fade-in-up max-w-4xl">
            <h1 className={`text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight drop-shadow-[0_6px_25px_rgba(236,72,153,0.35)] animate-pulse-glow mb-6 ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>
              EventSphere
            </h1>
            <p className={`mt-6 max-w-3xl text-xl md:text-2xl animate-fade-in-up leading-relaxed ${
              darkMode ? 'text-white/95' : 'text-slate-700'
            }`}>
              Manage, discover, and participate in events seamlessly. Built for{" "}
              <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">Admins</span>,{" "}
              <span className="font-bold bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">Faculty</span>, and{" "}
              <span className="font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">Students</span>.
            </p>
            <div className="mt-12 animate-fade-in-up">
              <Link to="/dashboard"
                className={`group relative inline-flex items-center gap-3 px-10 py-5 rounded-3xl font-bold text-lg shadow-2xl border-2 hover:scale-105 hover:shadow-[0_20px_40px_rgba(236,72,153,0.3)] transition-all duration-500 backdrop-blur-xl ${
                  darkMode 
                    ? 'border-white/30 bg-gradient-to-r from-white/30 to-white/20 text-white hover:border-white/50' 
                    : 'border-slate-700/30 bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-white hover:border-slate-600/50'
                }`}>
                <span className="group-hover:translate-x-1 transition-transform duration-300">Go to Dashboard</span>
                <div className="text-2xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">🚀</div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-cyan-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
              </Link>
            </div>
            <div className="mt-8 animate-fade-in-up">
              <p className={`text-sm font-medium animate-bounce-subtle ${
                darkMode ? 'text-white/70' : 'text-slate-600'
              }`}>Click the profile icon above to get started</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="relative z-10 max-w-6xl mx-auto grid gap-6 md:grid-cols-3 px-6 pb-16">
          {[
            { t: "Fast & Intuitive", d: "Simple flows to create and manage events in minutes.", e: "🚀" },
            { t: "Smart Scheduling", d: "Powerful tools to organize, publish, and track events.", e: "📅" },
            { t: "For Everyone", d: "Role-aware experience for admins, faculty, and students.", e: "🎓" },
          ].map((f, index) => (
            <div key={f.t} className={`p-6 rounded-2xl border shadow-lg hover:translate-y-[-8px] hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-slide-up group relative backdrop-blur-md ${
              darkMode 
                ? 'border-white/20 bg-white/40 text-white' 
                : 'border-slate-300/30 bg-white/70 text-slate-800'
            }`}
              >
              <div className="text-3xl mb-3 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">{f.e}</div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'group-hover:text-cyan-300' : 'group-hover:text-purple-600'
              }`}>{f.t}</h3>
              <p className={`transition-colors duration-300 ${
                darkMode ? 'text-white/90 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-800'
              }`}>{f.d}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
            </div>
          ))}
          <style jsx>{`
            @keyframes slide-up { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
            .animate-slide-up { animation: slide-up 0.8s ease-out forwards; opacity: 0; }
          `}</style>
        </section>

        <footer className={`relative z-10 text-center pb-8 ${
          darkMode ? 'text-white/70' : 'text-slate-600'
        }`}>
          © {new Date().getFullYear()} EventSphere. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
