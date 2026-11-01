import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  IdCard,
  FileSpreadsheet,
  Sun,
  Moon,
} from 'lucide-react';
import { AuthUser, GlassTheme } from '../types';
import { GLASS_THEMES } from '../utils/theme';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  currentTheme: GlassTheme;
  setCurrentTheme: (theme: GlassTheme) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  currentTheme,
  setCurrentTheme,
}) => {
  const [role, setRole] = useState<'candidate' | 'proctor'>('candidate');
  const [studentId, setStudentId] = useState('STD-2026-904');
  const [candidateName, setCandidateName] = useState('Abhijeet');
  const [candidatePassword, setCandidatePassword] = useState('pass123');

  const [staffId, setStaffId] = useState('PRC-801');
  const [proctorPassword, setProctorPassword] = useState('proctor123');
  const [showThemeModal, setShowThemeModal] = useState(false);

  const themeConfig = GLASS_THEMES[currentTheme];

  const handleCandidateLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onLogin({
      id: 'usr-' + Math.floor(1000 + Math.random() * 9000),
      name: candidateName || 'Abhijeet',
      email: `${(candidateName || 'abhijeet').toLowerCase().replace(/\s+/g, '.')}@univ.edu`,
      role: 'candidate',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      studentId: studentId || 'STD-2026-904',
      department: 'Computer Science & Engineering',
    });
  };

  const handleProctorLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onLogin({
      id: 'prc-9901',
      name: 'Chief Proctor Henderson',
      email: 'proctor.henderson@univ.edu',
      role: 'proctor',
      avatarUrl:
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      staffId: staffId || 'PRC-801',
      department: 'Examination Conduct & Academic Integrity Board',
    });
  };

  const isLightMode = themeConfig.mode === 'light';

  const handleToggleDarkMode = () => {
    if (isLightMode) {
      setCurrentTheme('obsidian');
    } else {
      setCurrentTheme('alabaster');
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br ${themeConfig.previewGradient} ${themeConfig.textPrimary} overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300`}>
      {/* Quick Light / Dark Mode Toggle in Top-Right */}
      <div className="fixed top-5 right-5 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleDarkMode}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${themeConfig.border} ${themeConfig.cardBg} ${themeConfig.glow} text-xs font-bold text-white transition-all`}
        >
          {isLightMode ? (
            <>
              <Moon className="w-4 h-4 text-slate-400" />
              <span>Switch to Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Switch to Warm Alabaster (Light)</span>
            </>
          )}
        </button>
      </div>

      {/* Ambient Glass Glow Orbs */}
      {isLightMode ? (
        <>
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#4d7c5f]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#d6c9b3]/35 rounded-full blur-3xl pointer-events-none"></div>
        </>
      ) : (
        <>
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg mb-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Ordeal
          </h1>
          <p className="text-xs text-slate-300 font-medium tracking-wide">
            Autonomous Neural Anti-Spoofing Examination Platform
          </p>
        </div>

        {/* Glass Card Container */}
        <div className={`rounded-3xl border ${themeConfig.border} ${themeConfig.cardBg} ${themeConfig.glow} p-7 space-y-6 shadow-2xl`}>
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5">
            <button
              onClick={() => setRole('candidate')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                role === 'candidate'
                  ? 'bg-white/15 text-white shadow-md border border-white/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Candidate Portal</span>
            </button>
            <button
              onClick={() => setRole('proctor')}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                role === 'proctor'
                  ? 'bg-white/15 text-white shadow-md border border-white/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Proctor Center</span>
            </button>
          </div>

          {/* Form Content */}
          {role === 'candidate' ? (
            <form onSubmit={handleCandidateLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Candidate Name
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate full name"
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student Enrollment ID
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STD-2026-904"
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 backdrop-blur-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Session Access Code
                </label>
                <input
                  type="password"
                  value={candidatePassword}
                  onChange={(e) => setCandidatePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 backdrop-blur-md font-mono"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${themeConfig.accentBtn}`}
              >
                <span>Enter Candidate Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Demo Shortcut */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCandidateName('Abhijeet');
                    setStudentId('STD-2026-904');
                    handleCandidateLogin();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1-Click Candidate Demo: Abhijeet (STD-2026-904)</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleProctorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Staff Supervisory ID
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. PRC-801"
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 backdrop-blur-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Proctor Security Key / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={proctorPassword}
                    onChange={(e) => setProctorPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 backdrop-blur-md font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Restricted Supervisory Access:
                </p>
                <p className="text-slate-300/80">
                  Authorizes real-time candidate video feeds, document test scanning, question authoring, and forensic review.
                </p>
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${themeConfig.accentBtn}`}
              >
                <span>Access Proctor Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 1-Click Proctor Demo */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStaffId('PRC-801');
                    handleProctorLogin();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1-Click Demo: Chief Proctor Henderson (PRC-801)</span>
                </button>
              </div>
            </form>
          )}

          {/* Interactive Glass Theme Switcher bar */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Active Design System:
              </span>
              <button
                onClick={() => setShowThemeModal(true)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Compare All 4 Styles
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(GLASS_THEMES) as GlassTheme[]).map((thm) => (
                <button
                  key={thm}
                  type="button"
                  onClick={() => setCurrentTheme(thm)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-all truncate border ${
                    currentTheme === thm
                      ? 'bg-white/20 border-white/30 text-white shadow-xs'
                      : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {GLASS_THEMES[thm].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Glass Style Comparison Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-white/20 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Ordeal Design System Presets
                </h3>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select from Warm Alabaster (Default Light) or any of the 3 dark glassmorphic systems:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {(Object.keys(GLASS_THEMES) as GlassTheme[]).map((thm) => {
                const cfg = GLASS_THEMES[thm];
                const isSelected = currentTheme === thm;
                return (
                  <div
                    key={thm}
                    onClick={() => setCurrentTheme(thm)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all space-y-3 relative overflow-hidden ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-white/10 shadow-xl'
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`aspect-video rounded-xl border ${cfg.border} ${cfg.cardBg} ${cfg.glow} p-3 flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white">{cfg.name}</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.accentColor }}></span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-16 bg-white/20 rounded-full"></div>
                        <div className="h-1.5 w-10 bg-white/10 rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">{cfg.name} ({cfg.mode === 'light' ? 'Light' : 'Dark'})</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{cfg.tagline}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTheme(thm);
                      }}
                      className={`w-full py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white keep-white border-emerald-500'
                          : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                      }`}
                    >
                      {isSelected ? 'Active Theme' : 'Apply Style'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
