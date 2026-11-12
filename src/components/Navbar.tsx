import React from 'react';
import {
  ShieldCheck,
  Eye,
  AlertTriangle,
  Cpu,
  LogOut,
  FileCheck,
  PlusCircle,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react';
import { AuthUser, GlassTheme } from '../types';
import { GLASS_THEMES } from '../utils/theme';

interface NavbarProps {
  currentUser: AuthUser;
  onLogout: () => void;
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  pendingViolationsCount: number;
  currentTheme: GlassTheme;
  setCurrentTheme: (theme: GlassTheme) => void;
  onOpenDocScanner?: () => void;
  onOpenQuestionBuilder?: () => void;
  isExamInProgress?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  currentTab,
  setCurrentTab,
  pendingViolationsCount,
  currentTheme,
  setCurrentTheme,
  onOpenDocScanner,
  onOpenQuestionBuilder,
  isExamInProgress,
}) => {
  const theme = GLASS_THEMES[currentTheme];
  const isProctor = currentUser.role === 'proctor';
  const isLightMode = theme.mode === 'light';

  const handleToggleDarkMode = () => {
    if (isLightMode) {
      setCurrentTheme('obsidian');
    } else {
      setCurrentTheme('alabaster');
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b ${theme.border} ${theme.navBg} ${theme.textPrimary} transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Ordeal
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  · {isProctor ? 'Proctor Center' : 'Candidate Room'}
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links based on Role */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isProctor ? (
              <>
                <button
                  onClick={() => setCurrentTab('proctor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    currentTab === 'proctor'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Surveillance Grid</span>
                </button>

                <button
                  onClick={() => setCurrentTab('analytics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    currentTab === 'analytics'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Analytics</span>
                </button>

                <button
                  onClick={() => setCurrentTab('violations')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative whitespace-nowrap shrink-0 ${
                    currentTab === 'violations'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Evidence Audit</span>
                  {pendingViolationsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-rose-500 text-white keep-white tabular-nums">
                      {pendingViolationsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentTab('lab')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    currentTab === 'lab'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Anti-Spoof Lab</span>
                </button>

                {/* Proctor Ingestion Modals Actions */}
                {onOpenDocScanner && (
                  <button
                    onClick={onOpenDocScanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all ml-1 whitespace-nowrap shrink-0"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Scan Document</span>
                  </button>
                )}

                {onOpenQuestionBuilder && (
                  <button
                    onClick={onOpenQuestionBuilder}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all whitespace-nowrap shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Question Builder</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-300">
                  Candidate Examination Portal
                </span>
                {isExamInProgress && (
                  <span className="text-xs font-mono text-emerald-400">
                    · Monitoring Active
                  </span>
                )}
              </div>
            )}
          </nav>

          {/* Zone 3: Light/Dark Mode Toggle, Theme Switcher & User Profile */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Dedicated Light / Dark Mode Quick Toggle */}
            <button
              onClick={handleToggleDarkMode}
              title={
                isLightMode
                  ? 'Switch to Dark Mode (Obsidian)'
                  : 'Switch to Light Mode (Warm Alabaster)'
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all shadow-xs whitespace-nowrap shrink-0"
            >
              {isLightMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden xl:inline text-[11px]">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline text-[11px]">Light</span>
                </>
              )}
            </button>

            {/* Glass Style Selector */}
            <div className="hidden lg:flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
              {(Object.keys(GLASS_THEMES) as GlassTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => setCurrentTheme(thm)}
                  title={GLASS_THEMES[thm].tagline}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                    currentTheme === thm
                      ? 'bg-white/20 text-white shadow-xs border border-white/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {GLASS_THEMES[thm].name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* User Chip */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="font-bold text-white text-[11px] truncate max-w-[115px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {currentUser.rollNumber || currentUser.studentId || currentUser.staffId}
                </p>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              title="Sign Out / Switch Portal"
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
