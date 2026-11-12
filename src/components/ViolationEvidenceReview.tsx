import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { ViolationRecord, GlassTheme } from '../types';
import { GLASS_THEMES } from '../utils/theme';

interface ViolationEvidenceReviewProps {
  violations: ViolationRecord[];
  onReviewViolation: (id: string, status: 'UPHELD' | 'DISMISSED', notes?: string) => void;
  onPurgeSnapshot?: (id: string) => void;
  onPurgeAllSnapshots?: () => void;
  selectedStudentFilter?: string;
  currentTheme: GlassTheme;
}

export const ViolationEvidenceReview: React.FC<ViolationEvidenceReviewProps> = ({
  violations,
  onReviewViolation,
  onPurgeSnapshot,
  onPurgeAllSnapshots,
  selectedStudentFilter,
  currentTheme,
}) => {
  const [selectedViolation, setSelectedViolation] = useState<ViolationRecord | null>(
    violations[0] || null
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [proctorNoteInput, setProctorNoteInput] = useState('');
  const [showBoxes, setShowBoxes] = useState(true);

  const theme = GLASS_THEMES[currentTheme];

  const filteredViolations = violations.filter((v) => {
    const matchesStudent = selectedStudentFilter
      ? v.studentId === selectedStudentFilter ||
        v.studentName.toLowerCase().includes(selectedStudentFilter.toLowerCase())
      : true;
    const matchesType = filterType === 'ALL' ? true : v.violationType === filterType;
    const matchesStatus = filterStatus === 'ALL' ? true : v.status === filterStatus;
    return matchesStudent && matchesType && matchesStatus;
  });

  const handleReviewAction = (status: 'UPHELD' | 'DISMISSED') => {
    if (!selectedViolation) return;
    onReviewViolation(selectedViolation.id, status, proctorNoteInput || undefined);
    setSelectedViolation((prev) =>
      prev ? { ...prev, status, proctorNotes: proctorNoteInput || prev.proctorNotes } : null
    );
    setProctorNoteInput('');
  };

  const handlePurgeSingleSnapshot = () => {
    if (!selectedViolation || !onPurgeSnapshot) return;
    onPurgeSnapshot(selectedViolation.id);
    setSelectedViolation((prev) =>
      prev ? { ...prev, snapshotUrl: '', snapshotDeletedAt: new Date().toISOString() } : null
    );
  };

  const exportAuditReport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(violations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ordeal-audit-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Incident Evidence Review & Privacy Retention Controls
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Inspect monitoring indicators, distinguish TensorFlow.js object detections from pixel/visibility heuristics, and manage snapshot retention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPurgeAllSnapshots && (
            <button
              onClick={onPurgeAllSnapshots}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-2xl transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Purge All Stored Snapshots</span>
            </button>
          )}
          <button
            onClick={exportAuditReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-semibold rounded-2xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Audit Log (JSON)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className={`rounded-2xl border ${theme.border} ${theme.cardBg} p-4 flex flex-wrap items-center justify-between gap-4`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Indicator Types</option>
            <option value="MOBILE_PHONE_DETECTED">Mobile Phone Detected (COCO-SSD)</option>
            <option value="MULTIPLE_FACES_DETECTED">Multiple Persons Detected (COCO-SSD)</option>
            <option value="SPOOF_PHOTO_ATTACK">Static Frame Heuristic</option>
            <option value="SCREEN_REPLAY_ATTACK">Screen Contrast Heuristic</option>
            <option value="FACE_NOT_FOUND">Candidate Absent Heuristic</option>
            <option value="SUSPICIOUS_GAZE_DEVIATION">Position Offset Heuristic</option>
            <option value="TAB_SWITCH_ATTACK">Page Visibility / Window Blur</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="PENDING_REVIEW">Pending Human Review</option>
            <option value="UPHELD">Upheld (Confirmed by Proctor)</option>
            <option value="DISMISSED">Dismissed (False Positive)</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono tabular-nums">
          Showing <span className="text-white font-bold">{filteredViolations.length}</span> recorded incident items
        </div>
      </div>

      {/* Main Split Layout: Evidence Feed on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          {filteredViolations.length === 0 ? (
            <div
              className={`rounded-3xl border ${theme.border} ${theme.cardBg} p-12 text-center text-slate-400`}
            >
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white">
                No Flagged Incidents Matching Filter
              </p>
              <p className="text-xs text-slate-400 mt-1">
                All examined sessions adhere to review parameters.
              </p>
            </div>
          ) : (
            filteredViolations.map((v) => {
              const isSelected = selectedViolation?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedViolation(v)}
                  className={`cursor-pointer rounded-3xl border p-4 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected
                      ? `border-rose-400/80 ring-2 ring-rose-500/20 ${theme.cardBg} shadow-xl`
                      : `border-white/10 ${theme.cardBg} hover:border-white/20`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shrink-0 flex items-center justify-center">
                      {v.snapshotUrl ? (
                        <img
                          src={v.snapshotUrl}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1 text-[11px] font-mono">
                        <span className="font-bold text-rose-400">
                          {v.violationType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-cyan-400">
                          {v.signalSource || 'PIXEL_AUDIO_HEURISTIC'}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 tabular-nums">
                          {new Date(v.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white">
                        {v.studentName}{' '}
                        <span className="text-xs font-mono text-slate-400 font-normal">
                          ({v.studentId})
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-1 max-w-md">{v.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold font-mono ${
                        v.status === 'UPHELD'
                          ? 'text-rose-400'
                          : v.status === 'DISMISSED'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Forensic Detail Inspector */}
        <div className="space-y-4">
          {selectedViolation ? (
            <div
              className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-2xl space-y-4 sticky top-20`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-rose-400" />
                  Incident Evidence Inspector
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {selectedViolation.id}
                </span>
              </div>

              {/* Snapshot Viewport */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] border border-white/15 shadow-inner">
                {selectedViolation.snapshotUrl ? (
                  <img
                    src={selectedViolation.snapshotUrl}
                    alt="Violation snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs space-y-1">
                    <AlertTriangle className="w-8 h-8 text-amber-400/70 mb-1" />
                    <span className="font-semibold text-white">
                      {selectedViolation.snapshotDeletedAt
                        ? 'Snapshot Purged Under Privacy Retention Policy'
                        : 'No Webcam Frame Stored'}
                    </span>
                    {selectedViolation.snapshotDeletedAt && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Purged at {new Date(selectedViolation.snapshotDeletedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}

                {showBoxes &&
                  selectedViolation.boundingBoxes?.map((box, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${(box.x / 640) * 100}%`,
                        top: `${(box.y / 480) * 100}%`,
                        width: `${(box.width / 640) * 100}%`,
                        height: `${(box.height / 480) * 100}%`,
                        borderColor: box.color || '#ef4444',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        pointerEvents: 'none',
                      }}
                    >
                      <span
                        style={{ backgroundColor: box.color || '#ef4444' }}
                        className="text-[9px] font-bold text-slate-950 px-1 py-0.2 rounded-sm absolute -top-4 left-0 uppercase font-mono"
                      >
                        {box.label}
                      </span>
                    </div>
                  ))}

                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  {selectedViolation.snapshotUrl && onPurgeSnapshot && (
                    <button
                      onClick={handlePurgeSingleSnapshot}
                      className="bg-rose-600/90 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Purge Snapshot</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowBoxes(!showBoxes)}
                    className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] text-slate-300 border border-white/10 hover:bg-black/90"
                  >
                    {showBoxes ? 'Hide Boxes' : 'Show Boxes'}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Candidate:</span>
                  <span className="font-semibold text-white">
                    {selectedViolation.studentName} ({selectedViolation.studentId})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Signal Provenance:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {selectedViolation.signalSource || 'PIXEL_AUDIO_HEURISTIC'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Indicator Confidence:</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {Math.round(selectedViolation.confidence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Recorded At:</span>
                  <span className="font-mono text-slate-300 tabular-nums">
                    {new Date(selectedViolation.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Signal Details */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Signal Provenance & Audit Note:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {selectedViolation.aiForensicAnalysis || selectedViolation.details}
                </p>
              </div>

              {/* Proctor Action & Notes */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supervisor Notes & Adjudication Rationale
                  </label>
                  <textarea
                    rows={2}
                    value={proctorNoteInput}
                    onChange={(e) => setProctorNoteInput(e.target.value)}
                    placeholder={
                      selectedViolation.proctorNotes || 'Enter human review rationale...'
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReviewAction('UPHELD')}
                    className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Uphold Incident</span>
                  </button>

                  <button
                    onClick={() => handleReviewAction('DISMISSED')}
                    className="py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Dismiss Flag</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-3xl border ${theme.border} ${theme.cardBg} p-8 text-center text-slate-400 text-xs`}
            >
              Select an incident item from the list to inspect evidence and retention controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
