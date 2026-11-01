import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Eye,
  AlertTriangle,
  Cpu,
  Sparkles,
  LogOut,
  Layers,
  FileCheck,
  PlusCircle,
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

  return (
    <header className={`sticky top-0 z-40 border-b border-white/10 ${theme.navBg} text-slate-100 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Ordeal
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme.badgeBg} ${theme.badgeText}`}>
                  {isProctor ? 'Proctor Center' : 'Candidate Room'}
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'proctor'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Surveillance Grid</span>
                </button>

                <button
                  onClick={() => setCurrentTab('violations')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                    currentTab === 'violations'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Evidence Audit</span>
                  {pendingViolationsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {pendingViolationsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCurrentTab('lab')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    currentTab === 'lab'
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Anti-Spoof AI Lab</span>
                </button>

                {/* Proctor Ingestion Modals Actions */}
                {onOpenDocScanner && (
                  <button
                    onClick={onOpenDocScanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all ml-2"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Scan Document</span>
                  </button>
                )}

                {onOpenQuestionBuilder && (
                  <button
                    onClick={onOpenQuestionBuilder}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Question Builder</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300">
                  Candidate Examination Portal
                </span>
                {isExamInProgress && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    MONITOR ACTIVE
                  </span>
                )}
              </div>
            )}
          </nav>

          {/* Zone 3: Theme Switcher & User Profile & Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Glass Style Dropdown */}
            <div className="hidden sm:flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
              {(Object.keys(GLASS_THEMES) as GlassTheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => setCurrentTheme(thm)}
                  title={GLASS_THEMES[thm].tagline}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    currentTheme === thm
                      ? 'bg-white/20 text-white shadow-sm'
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
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="font-bold text-white text-[11px] truncate max-w-[110px]">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{currentUser.studentId || currentUser.staffId}</p>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={onLogout}
              title="Sign Out / Switch Portal"
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all text-xs font-semibold flex items-center gap-1.5"
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
