import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Eye,
  CheckCircle2,
  XCircle,
  Bell,
  Search,
  Filter,
  Maximize2,
  Lock,
  Sparkles,
  FileCheck,
  PlusCircle,
  Shuffle,
  BarChart3,
  Award,
} from 'lucide-react';
import { StudentSession, Exam, ViolationRecord, GlassTheme } from '../types';
import { GLASS_THEMES } from '../utils/theme';
import { ProctorAnalytics } from './ProctorAnalytics';
import { ProctorRechartsPanel } from './ProctorRechartsPanel';
import { StudentReportCard } from './StudentReportCard';

interface ProctorDashboardProps {
  sessions: StudentSession[];
  exams: Exam[];
  violations: ViolationRecord[];
  onSelectCandidateToReview?: (studentId: string) => void;
  onSendProctorWarning?: (sessionId: string, message: string) => void;
  onOpenDocScanner?: () => void;
  onOpenQuestionBuilder?: () => void;
  onToggleRandomization?: (examId: string, currentVal: boolean) => void;
  currentTheme: GlassTheme;
  initialTab?: 'surveillance' | 'analytics';
}

export const ProctorDashboard: React.FC<ProctorDashboardProps> = ({
  sessions,
  exams,
  violations,
  onSelectCandidateToReview,
  onSendProctorWarning,
  onOpenDocScanner,
  onOpenQuestionBuilder,
  onToggleRandomization,
  currentTheme,
  initialTab = 'surveillance',
}) => {
  const [activeTab, setActiveTab] = useState<'surveillance' | 'analytics'>(initialTab);
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(
    sessions[0] || null
  );
  const [showRechartsOverview, setShowRechartsOverview] = useState<boolean>(true);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'FLAGGED' | 'IN_PROGRESS' | 'SUBMITTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [proctorWarningInput, setProctorWarningInput] = useState('');
  const [warningFeedback, setWarningFeedback] = useState<string | null>(null);
  const [reportCardSession, setReportCardSession] = useState<StudentSession | null>(null);

  const theme = GLASS_THEMES[currentTheme];

  const totalCandidates = sessions.length;
  const activeExamsCount = sessions.filter((s) => s.status === 'IN_PROGRESS').length;
  const flaggedIncidentsCount = violations.length;
  const avgIntegrity =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.integrityScore, 0) / sessions.length)
      : 100;

  const filteredSessions = sessions.filter((s) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'FLAGGED'
        ? s.status === 'FLAGGED' || s.violationCount > 0
        : s.status === filterStatus;

    const matchesSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleSendWarning = () => {
    if (!selectedSession || !proctorWarningInput.trim()) return;
    if (onSendProctorWarning) {
      onSendProctorWarning(selectedSession.sessionId, proctorWarningInput);
    }
    setWarningFeedback(`Warning broadcast sent to ${selectedSession.studentName}: "${proctorWarningInput}"`);
    setProctorWarningInput('');
    setTimeout(() => setWarningFeedback(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Banner & Quick Toolbars */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Ordeal Proctor Surveillance Center
            </h1>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono border ${theme.badgeBg} ${theme.badgeText}`}>
              Active Examination Chamber
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Supervisory command center with multi-candidate surveillance grid, document test scanning, and randomized question distribution.
          </p>
        </div>

        {/* Action Buttons for Document Scanning & Question Authoring */}
        <div className="flex items-center gap-2.5">
          {onOpenDocScanner && (
            <button
              onClick={onOpenDocScanner}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md ${theme.accentBtn}`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Scan Test Document (Any Format)</span>
            </button>
          )}

          {onOpenQuestionBuilder && (
            <button
              onClick={onOpenQuestionBuilder}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>AI Distractor Question Builder</span>
            </button>
          )}
        </div>
      </div>

      {/* View Sub-Tabs: Surveillance Grid vs Analytics */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab('surveillance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'surveillance'
                ? 'bg-white/15 text-white border border-white/20 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Surveillance Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-white/15 text-white border border-white/20 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Analytics & Trends</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              Recharts
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'surveillance' && (
            <button
              type="button"
              onClick={() => setShowRechartsOverview((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{showRechartsOverview ? 'Hide Recharts Telemetry' : 'Show Recharts Telemetry'}</span>
            </button>
          )}
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
            <span>Active View:</span>
            <span className="font-semibold text-white">
              {activeTab === 'surveillance' ? 'Live Candidate Surveillance' : 'Recharts Performance & Violation Analytics'}
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <ProctorAnalytics
          sessions={sessions}
          violations={violations}
          exams={exams}
          currentTheme={currentTheme}
          onSelectCandidateToReview={onSelectCandidateToReview}
        />
      ) : (
        <>
          {/* Metric Cards in Glass */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-xl`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Examinees</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{activeExamsCount}</p>
          <span className="text-[11px] text-slate-400">Total Enrolled: {totalCandidates}</span>
        </div>

        <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-xl`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Flagged Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400">{flaggedIncidentsCount}</p>
          <span className="text-[11px] text-slate-400 font-mono">
            {violations.filter((v) => v.status === 'PENDING_REVIEW').length} Pending Review
          </span>
        </div>

        <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-xl`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cohort Integrity</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-cyan-400">{avgIntegrity}%</p>
          <span className="text-[11px] text-slate-400 font-mono">High Authenticity</span>
        </div>

        <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-xl`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Exam Banks</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{exams.length}</p>
          <span className="text-[11px] text-slate-400">
            {exams.reduce((acc, e) => acc + e.questions.length, 0)} Total Questions
          </span>
        </div>
      </div>

      {/* Interactive Recharts Performance, Pass/Fail & Per-Question Timing Panel */}
      {showRechartsOverview && (
        <ProctorRechartsPanel
          sessions={sessions}
          exams={exams}
          currentTheme={currentTheme}
        />
      )}

      {/* Exam Randomization Toggles & Quick Settings Banner */}
      <div className={`rounded-2xl border ${theme.border} ${theme.cardBg} p-4 flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Fisher-Yates Question & Option Shuffling Control:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {exams.map((ex) => {
            const isRandomized = ex.securitySettings?.randomizeQuestionsAndOptions;
            return (
              <button
                key={ex.id}
                onClick={() => onToggleRandomization && onToggleRandomization(ex.id, !isRandomized)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  isRandomized
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isRandomized ? 'bg-cyan-400' : 'bg-slate-500'}`}></span>
                <span>{ex.code}: {isRandomized ? 'Shuffle ON' : 'Fixed Order'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surveillance Controls Bar */}
      <div className={`rounded-2xl border ${theme.border} ${theme.cardBg} p-4 flex flex-wrap items-center justify-between gap-4`}>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, ID, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/80"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            All Examinees ({sessions.length})
          </button>
          <button
            onClick={() => setFilterStatus('FLAGGED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'FLAGGED'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            Flagged ({sessions.filter((s) => s.violationCount > 0).length})
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            In Session ({activeExamsCount})
          </button>
        </div>
      </div>

      {/* Main Grid: Candidate Video Streams & Deep Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Candidate Feed Cards */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {filteredSessions.map((candidate) => {
            const isSelected = selectedSession?.sessionId === candidate.sessionId;
            const hasViolations = candidate.violationCount > 0;

            return (
              <div
                key={candidate.sessionId}
                onClick={() => setSelectedSession(candidate)}
                className={`cursor-pointer rounded-3xl border p-4 transition-all duration-200 relative group overflow-hidden ${
                  isSelected
                    ? `border-cyan-400/80 ring-2 ring-cyan-500/30 ${theme.cardBg} shadow-2xl`
                    : `border-white/10 ${theme.cardBg} hover:border-white/25`
                }`}
              >
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 mb-3 border border-white/10 shadow-inner">
                  <img
                    src={candidate.studentAvatar}
                    alt={candidate.studentName}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono border border-white/10">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasViolations ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'
                      }`}
                    ></span>
                    <span className={hasViolations ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {hasViolations ? `${candidate.violationCount} Violations` : 'Verified Live'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-semibold text-slate-300 border border-white/10">
                    Integrity: {candidate.integrityScore}%
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {candidate.studentName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">{candidate.studentId}</p>
                    <p className="text-[11px] text-slate-400 mt-1 truncate max-w-[200px]">
                      {candidate.examTitle}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      candidate.status === 'IN_PROGRESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : candidate.status === 'FLAGGED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {candidate.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Candidate Focus Stream */}
        <div className="space-y-4">
          {selectedSession ? (
            <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-2xl space-y-5 sticky top-20`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Candidate Focus Stream
                </span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {selectedSession.sessionId}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] border border-white/15 shadow-inner">
                <img
                  src={selectedSession.studentAvatar}
                  alt={selectedSession.studentName}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-4 border border-dashed border-cyan-400/60 rounded-xl pointer-events-none flex items-start justify-between p-2">
                  <span className="text-[9px] font-mono text-cyan-300 bg-black/80 px-1.5 py-0.5 rounded">
                    LIVENESS: 98%
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded">
                    GAZE: CENTER
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Candidate:</span>
                  <span className="font-semibold text-white">{selectedSession.studentName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">ID:</span>
                  <span className="font-mono text-slate-300">{selectedSession.studentId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Current Integrity:</span>
                  <span className={`font-bold ${selectedSession.integrityScore >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedSession.integrityScore}%
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Flagged Incidents:</span>
                  <span className="font-bold text-rose-400">
                    {selectedSession.violationCount} Violations
                  </span>
                </div>
              </div>

              {warningFeedback && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{warningFeedback}</span>
                </div>
              )}

              {/* Direct Warning Broadcast */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Broadcast Direct Warning to Candidate
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Please look directly at screen..."
                    value={proctorWarningInput}
                    onChange={(e) => setProctorWarningInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/80"
                  />
                  <button
                    onClick={handleSendWarning}
                    className={`px-3 py-2 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all ${theme.accentBtn}`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (onSelectCandidateToReview) {
                        onSelectCandidateToReview(selectedSession.studentId);
                      }
                    }}
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl text-center transition-all"
                  >
                    Audit Snapshots
                  </button>

                  <button
                    onClick={() => {
                      setWarningFeedback(`Re-verifying liveness challenge for ${selectedSession.studentName}`);
                      setTimeout(() => setWarningFeedback(null), 3000);
                    }}
                    className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl text-center transition-all"
                  >
                    Request Liveness
                  </button>
                </div>

                <button
                  onClick={() => setReportCardSession(selectedSession)}
                  className="w-full mt-2 py-2.5 px-3 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>View Report Card & Analysis</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={`rounded-3xl border ${theme.border} ${theme.cardBg} p-8 text-center text-slate-400 text-xs`}>
              Select a candidate card to view live telemetry and proctor controls.
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Interactive Report Card Modal */}
      {reportCardSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto">
            <StudentReportCard
              session={reportCardSession}
              exam={exams.find((e) => e.id === reportCardSession.examId) || exams[0]}
              cohortSessions={sessions}
              onClose={() => setReportCardSession(null)}
              currentTheme={currentTheme}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
