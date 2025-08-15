import { useState, useEffect, useRef } from 'react';
import { registerUser } from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from "three";

export default function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [msg, setMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  const navigate = useNavigate();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
    // Calculate password strength
    if (e.target.name === 'password') {
      const password = e.target.value;
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[0-9]/.test(password)) strength += 25;
      if (/[^A-Za-z0-9]/.test(password)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMsg('');
    
    try {
      await registerUser(form);
      setMsg('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'from-red-500 to-red-600';
    if (passwordStrength <= 50) return 'from-yellow-500 to-orange-500';
    if (passwordStrength <= 75) return 'from-blue-500 to-indigo-500';
    return 'from-green-500 to-emerald-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  // 3D Background Animation
  useEffect(() => {
    if (!mountRef.current) return;
    
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    camera.position.set(0, 0, 10);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(
      new THREE.DirectionalLight(0xffffff, 1.2).add(light => light.position.set(3, 4, 5)),
      new THREE.DirectionalLight(0x22d3ee, 0.6).add(light => light.position.set(-4, -3, -2)),
      new THREE.AmbientLight(0xffffff, 0.4)
    );

    // Create morphing blob
    const uniforms = {
      u_time: { value: 0 },
      u_intensity: { value: 0.8 },
      u_c1: { value: new THREE.Color("#8b5cf6") },
      u_c2: { value: new THREE.Color("#ec4899") },
      u_c3: { value: new THREE.Color("#22d3ee") },
    };

    const vertexShader = `
      varying vec3 vNormal, vPos;
      uniform float u_time, u_intensity;
      
      float snoise(vec3 v) {
        return sin(v.x * 1.5 + u_time) * cos(v.y * 1.2 + u_time) * sin(v.z * 1.8 + u_time * 0.8);
      }
      
      void main() {
        vNormal = normal;
        vPos = position;
        float n = snoise(normal * 1.5 + u_time * 0.4) * u_intensity * 0.3;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * n, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      uniform vec3 u_c1, u_c2, u_c3;
      
      void main(){
        vec3 n = normalize(vNormal);
        float fres = pow(1.0 - abs(n.z), 1.5);
        vec3 base = mix(u_c1, u_c2, (n.x + 1.0) * 0.5);
        base = mix(base, u_c3, (n.y + 1.0) * 0.5);
        gl_FragColor = vec4(base + fres * 0.4, 0.7);
      }
    `;

    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2, 60),
      new THREE.ShaderMaterial({ 
        uniforms, 
        vertexShader, 
        fragmentShader,
        transparent: true
      })
    );
    blob.position.set(-3, 2, -5);
    scene.add(blob);

    // Create floating rings
    const rings = [];
    for (let i = 0; i < 12; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5 + i * 0.1, 0.05, 8, 16),
        new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL((i * 0.08) % 1, 0.8, 0.6),
          transparent: true,
          opacity: 0.3,
        })
      );
      
      ring.position.set(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 20
      );
      
      ring.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      ring.userData = {
        rotSpeed: [(Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02],
        floatSpeed: Math.random() * 0.008 + 0.004,
        offset: Math.random() * Math.PI * 2,
      };
      
      rings.push(ring);
      scene.add(ring);
    }

    // Particles with trails
    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 35;
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] = (Math.random() - 0.5) * 25;
      velocities[i] = (Math.random() - 0.5) * 0.012;
      velocities[i + 1] = (Math.random() - 0.5) * 0.012;
      velocities[i + 2] = (Math.random() - 0.5) * 0.012;
      
      const hue = Math.random();
      colors[i] = hue;
      colors[i + 1] = 0.7;
      colors[i + 2] = 0.8;
    }
    
    const particles = new THREE.Points(
      new THREE.BufferGeometry()
        .setAttribute('position', new THREE.BufferAttribute(positions, 3))
        .setAttribute('color', new THREE.BufferAttribute(colors, 3)),
      new THREE.PointsMaterial({
        size: 0.025,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
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
      uniforms.u_time.value = t;
      
      // Animate blob
      blob.rotation.y += 0.005;
      blob.rotation.x = Math.sin(t * 0.3) * 0.2;
      blob.position.y = 2 + Math.sin(t * 0.5) * 0.5;
      
      // Animate rings
      rings.forEach((ring, i) => {
        const { rotSpeed, floatSpeed, offset } = ring.userData;
        ring.rotation.x += rotSpeed[0];
        ring.rotation.y += rotSpeed[1];
        ring.rotation.z += rotSpeed[2];
        ring.position.y += Math.sin(t * floatSpeed + offset) * 0.004;
        ring.material.opacity = 0.2 + Math.sin(t * 3 + i) * 0.15;
      });

      // Animate particles
      particles.rotation.y += 0.0008;
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        if (Math.abs(positions[i]) > 17) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 17) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 12) velocities[i + 2] *= -1;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      camera.position.x = Math.sin(t * 0.08) * 0.8;
      camera.position.y = Math.cos(t * 0.1) * 0.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    sceneRef.current = { scene, renderer, camera, rings, particles };

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

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${
        darkMode ? "bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937]" 
                 : "bg-gradient-to-br from-[#eef2ff] via-white to-[#cffafe]"
      }`}>
        
        {/* 3D Background */}
        <div ref={mountRef} className="absolute inset-0 -z-10" />
        
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className={`absolute inset-0 ${darkMode 
            ? "bg-gradient-to-r from-purple-800/20 via-pink-800/20 to-cyan-800/20"
            : "bg-gradient-to-r from-purple-200/30 via-pink-200/30 to-cyan-200/30"
          } animate-pulse`} />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 -z-5">
          {[...Array(8)].map((_, i) => (
            <div key={`float-${i}`} className={`absolute rounded-full opacity-10 ${darkMode ? "bg-white" : "bg-slate-900"}`}
              style={{
                width: `${15 + i * 8}px`, height: `${15 + i * 8}px`,
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                animation: `float-${i % 3} ${12 + i * 3}s ease-in-out infinite`,
              }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <div key={`glow-${i}`} className="absolute rounded-full blur-2xl opacity-15"
              style={{
                width: `${120 + i * 40}px`, height: `${120 + i * 40}px`,
                background: `radial-gradient(circle, ${['#8b5cf6', '#ec4899', '#22d3ee', '#10b981', '#f59e0b'][i]} 0%, transparent 70%)`,
                left: `${15 + i * 18}%`, top: `${10 + i * 15}%`,
                animation: `drift ${18 + i * 4}s ease-in-out infinite`,
              }} />
          ))}
        </div>

        {/* Back to Home Button */}
        <Link to="/" 
          className={`absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-105 ${
            darkMode ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-800/70 text-white hover:bg-slate-700/80"
          }`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className={`absolute top-6 right-6 z-50 w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            darkMode ? "bg-white/20 text-white hover:bg-white/30" : "bg-slate-800/70 text-white hover:bg-slate-700/80"
          }`}
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Signup Form Container */}
        <div className="relative z-10 w-full max-w-lg">
          <div className={`backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border transform transition-all duration-500 hover:scale-[1.02] ${
            darkMode 
              ? "bg-white/10 border-white/20 shadow-black/20" 
              : "bg-white/80 border-slate-200/50 shadow-slate-900/10"
          }`}>
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <h1 className={`text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse`}>
                  EventSphere
                </h1>
              </div>
              <h2 className={`text-2xl font-semibold mb-2 ${
                darkMode ? "text-white" : "text-slate-800"
              }`}>Create Account</h2>
              <p className={`${
                darkMode ? "text-white/70" : "text-slate-600"
              }`}>Join our community today</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors duration-300 ${
                    darkMode ? "text-white/40 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-500"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-4 rounded-2xl transition-all duration-300 focus:scale-[1.02] focus:shadow-lg outline-none border-2 focus:border-purple-400 ${
                    darkMode 
                      ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/15" 
                      : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* Email Field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors duration-300 ${
                    darkMode ? "text-white/40 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-500"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-4 rounded-2xl transition-all duration-300 focus:scale-[1.02] focus:shadow-lg outline-none border-2 focus:border-purple-400 ${
                    darkMode 
                      ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/15" 
                      : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
                  }`}
                />
              </div>

              {/* Password Field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors duration-300 ${
                    darkMode ? "text-white/40 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-500"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-12 py-4 rounded-2xl transition-all duration-300 focus:scale-[1.02] focus:shadow-lg outline-none border-2 focus:border-purple-400 ${
                    darkMode 
                      ? "bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/15" 
                      : "bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-300 ${
                    darkMode ? "text-white/40 hover:text-white/70" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                
                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="mt-2">
                    <div className={`h-2 rounded-full overflow-hidden ${
                      darkMode ? "bg-white/10" : "bg-slate-200"
                    }`}>
                      <div 
                        className={`h-full bg-gradient-to-r ${getPasswordStrengthColor()} transition-all duration-500`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    {passwordStrength > 0 && (
                      <p className={`text-xs mt-1 font-medium ${
                        darkMode ? "text-white/70" : "text-slate-600"
                      }`}>
                        Password strength: <span className={getPasswordStrengthColor().includes('green') ? 'text-green-500' : 
                          getPasswordStrengthColor().includes('blue') ? 'text-blue-500' :
                          getPasswordStrengthColor().includes('yellow') ? 'text-yellow-500' : 'text-red-500'}>
                          {getPasswordStrengthText()}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 transition-colors duration-300 ${
                    darkMode ? "text-white/40 group-focus-within:text-purple-400" : "text-slate-400 group-focus-within:text-purple-500"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-4 rounded-2xl transition-all duration-300 focus:scale-[1.02] focus:shadow-lg outline-none border-2 focus:border-purple-400 appearance-none cursor-pointer ${
                    darkMode 
                      ? "bg-white/10 border-white/20 text-white focus:bg-white/15" 
                      : "bg-white/70 border-slate-200 text-slate-800 focus:bg-white"
                  }`}
                >
                  <option value="student" className={darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}>🎓 Student</option>
                  <option value="faculty" className={darkMode ? "bg-slate-800 text-white" : "bg-white text-slate-800"}>👨‍🏫 Faculty</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className={`w-5 h-5 ${darkMode ? "text-white/40" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLoading
                    ? "bg-gradient-to-r from-gray-400 to-gray-500"
                    : "bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600"
                } text-white relative overflow-hidden`}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-cyan-500/50 animate-pulse" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Message */}
            {msg && (
              <div className={`mt-6 p-4 rounded-2xl text-center font-medium transition-all duration-300 ${
                msg.includes("successful") 
                  ? darkMode ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-green-100 text-green-700 border border-green-200"
                  : darkMode ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-red-100 text-red-700 border border-red-200"
              }`}>
                {msg}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className={`text-sm ${darkMode ? "text-white/70" : "text-slate-600"}`}>
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float-0 { 
            0%, 100% { transform: translateY(0px) translateX(0px); } 
            25% { transform: translateY(-25px) translateX(15px); } 
            50% { transform: translateY(-45px) translateX(-8px); } 
            75% { transform: translateY(-15px) translateX(-18px); } 
          }
          @keyframes float-1 { 
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); } 
            33% { transform: translateY(-35px) translateX(20px) rotate(120deg); } 
            66% { transform: translateY(-20px) translateX(-15px) rotate(240deg); } 
          }
          @keyframes float-2 { 
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); } 
            50% { transform: translateY(-30px) translateX(25px) scale(1.15); } 
          }
          @keyframes drift { 
            0%, 100% { transform: translate(0px, 0px) scale(1) rotate(0deg); } 
            25% { transform: translate(40px, -30px) scale(1.1) rotate(90deg); } 
            50% { transform: translate(-30px, -50px) scale(0.9) rotate(180deg); } 
            75% { transform: translate(-50px, 30px) scale(1.05) rotate(270deg); } 
          }
        `}</style>
      </div>
    </div>
  );
}
