import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Award,
  TrendingUp,
  Layers,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import { StudentSession, Exam, GlassTheme } from '../types';
import { GLASS_THEMES } from '../utils/theme';

interface ProctorRechartsPanelProps {
  sessions: StudentSession[];
  exams: Exam[];
  currentTheme: GlassTheme;
  selectedExamFilter?: string;
  onSelectExamFilter?: (examId: string) => void;
}

export const ProctorRechartsPanel: React.FC<ProctorRechartsPanelProps> = ({
  sessions,
  exams,
  currentTheme,
  selectedExamFilter,
  onSelectExamFilter,
}) => {
  const theme = GLASS_THEMES[currentTheme];
  const isLight = theme.mode === 'light';

  const [internalExamId, setInternalExamId] = useState<string>('ALL');
  const [questionChartExamId, setQuestionChartExamId] = useState<string>(
    exams[0]?.id || 'exam-cs-401'
  );

  const activeExamFilter = selectedExamFilter !== undefined ? selectedExamFilter : internalExamId;
  const setActiveExamFilter = onSelectExamFilter || setInternalExamId;

  // Filtered sessions for Candidate Performance & Pass/Fail Ratio charts
  const filteredSessions = useMemo(() => {
    if (activeExamFilter === 'ALL') return sessions;
    return sessions.filter((s) => s.examId === activeExamFilter);
  }, [sessions, activeExamFilter]);

  // 1. Candidate Performance Metrics Data (Academic Score % vs Integrity % vs Pass Threshold)
  const candidatePerformanceData = useMemo(() => {
    return filteredSessions.map((s) => {
      const exam = exams.find((e) => e.id === s.examId) || exams[0];
      const totalQ = exam?.questions.length || 5;
      const passingRatio = exam ? exam.passingMarks / exam.totalMarks : 0.6;
      const passingPercent = Math.round(passingRatio * 100);

      let academicPercent = 0;
      if (typeof s.score === 'number' && s.totalScore && s.totalScore > 0) {
        academicPercent = Math.round((s.score / s.totalScore) * 100);
      } else if (exam) {
        // Evaluate canonical or displayed answers against exam questions
        const ansSource =
          s.canonicalAnswers && Object.keys(s.canonicalAnswers).length > 0
            ? s.canonicalAnswers
            : s.answers || {};
        let earned = 0;
        exam.questions.forEach((q) => {
          const canonCorrect =
            typeof q.canonicalCorrectAnswer === 'number'
              ? q.canonicalCorrectAnswer
              : q.correctAnswer;
          if (ansSource[q.id] === canonCorrect) {
            earned += q.points;
          }
        });
        academicPercent =
          exam.totalMarks > 0
            ? Math.round((earned / exam.totalMarks) * 100)
            : Math.round((Object.keys(ansSource).length / totalQ) * 100);
      }

      const passed = academicPercent >= passingPercent && s.status !== 'DISQUALIFIED';

      return {
        sessionId: s.sessionId,
        name: s.studentName.split(' ')[0],
        fullName: s.studentName,
        studentId: s.rollNumber || s.studentId,
        examCode: exam?.code || 'EX',
        academicScore: academicPercent,
        integrityScore: s.integrityScore,
        passingThreshold: passingPercent,
        violations: s.violationCount,
        status: s.status,
        outcome: s.status === 'IN_PROGRESS' ? 'In Progress' : passed ? 'Passed' : 'Failed',
      };
    });
  }, [filteredSessions, exams]);

  // 2. Pass / Fail / In-Progress Ratios (Overall + Per Exam)
  const passFailDistribution = useMemo(() => {
    let passedCount = 0;
    let failedCount = 0;
    let inProgressCount = 0;

    candidatePerformanceData.forEach((c) => {
      if (c.status === 'IN_PROGRESS') {
        inProgressCount++;
      } else if (c.academicScore >= c.passingThreshold && c.status !== 'DISQUALIFIED') {
        passedCount++;
      } else {
        failedCount++;
      }
    });

    const total = Math.max(1, passedCount + failedCount + inProgressCount);

    const pieData = [
      {
        name: 'Passed (≥ Threshold)',
        shortName: 'Passed',
        value: passedCount,
        percent: Math.round((passedCount / total) * 100),
        color: isLight ? '#4d7c5f' : '#10b981',
      },
      {
        name: 'Failed / Disqualified',
        shortName: 'Failed',
        value: failedCount,
        percent: Math.round((failedCount / total) * 100),
        color: '#f43f5e',
      },
      {
        name: 'In Progress (Live)',
        shortName: 'In Progress',
        value: inProgressCount,
        percent: Math.round((inProgressCount / total) * 100),
        color: isLight ? '#b45309' : '#38bdf8',
      },
    ].filter((d) => d.value > 0);

    // Per-exam Pass/Fail breakdown
    const perExamData = exams.map((ex) => {
      const exSessions = candidatePerformanceData.filter((c) => c.examCode === ex.code);
      let exPass = 0;
      let exFail = 0;
      let exLive = 0;
      exSessions.forEach((c) => {
        if (c.status === 'IN_PROGRESS') exLive++;
        else if (c.academicScore >= c.passingThreshold && c.status !== 'DISQUALIFIED') exPass++;
        else exFail++;
      });
      return {
        examCode: ex.code,
        examTitle: ex.title,
        Passed: exPass,
        Failed: exFail,
        InProgress: exLive,
        passRate:
          exPass + exFail > 0 ? Math.round((exPass / (exPass + exFail)) * 100) : exLive > 0 ? 100 : 0,
      };
    });

    return {
      pieData,
      perExamData,
      passedCount,
      failedCount,
      inProgressCount,
      overallPassRate:
        passedCount + failedCount > 0
          ? Math.round((passedCount / (passedCount + failedCount)) * 100)
          : 0,
    };
  }, [candidatePerformanceData, exams, isLight]);

  // 3. Average Time Spent on Questions per Exam (Seconds, Target Pacing & Accuracy %)
  const selectedQuestionExam = useMemo(() => {
    const targetId =
      activeExamFilter !== 'ALL' ? activeExamFilter : questionChartExamId || exams[0]?.id;
    return exams.find((e) => e.id === targetId) || exams[0];
  }, [exams, activeExamFilter, questionChartExamId]);

  const questionTimingData = useMemo(() => {
    if (!selectedQuestionExam) return [];
    const examSessions = sessions.filter((s) => s.examId === selectedQuestionExam.id);
    const questionCount = Math.max(1, selectedQuestionExam.questions.length);
    const targetPacingSec = Math.round(
      (selectedQuestionExam.durationMinutes * 60) / questionCount / 2.2
    );

    return selectedQuestionExam.questions.map((q, idx) => {
      let totalSec = 0;
      let sampleCount = 0;
      let correctCount = 0;
      let attemptCount = 0;

      examSessions.forEach((s) => {
        const recordedSec = s.questionTimeSpent?.[q.id];
        if (typeof recordedSec === 'number' && recordedSec > 0) {
          totalSec += recordedSec;
          sampleCount++;
        }

        const ansSource =
          s.canonicalAnswers && Object.keys(s.canonicalAnswers).length > 0
            ? s.canonicalAnswers
            : s.answers || {};
        if (typeof ansSource[q.id] === 'number') {
          attemptCount++;
          const canonCorrect =
            typeof q.canonicalCorrectAnswer === 'number'
              ? q.canonicalCorrectAnswer
              : q.correctAnswer;
          if (ansSource[q.id] === canonCorrect) {
            correctCount++;
          }
        }
      });

      // Deterministic fallback if a newly created question has no session telemetry yet
      const hasCode = Boolean(q.codeSnippet);
      const fallbackSec = 115 + idx * 24 + (hasCode ? 55 : 0);
      const avgTimeSec = sampleCount > 0 ? Math.round(totalSec / sampleCount) : fallbackSec;
      const accuracyRate =
        attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 75;

      const mins = Math.floor(avgTimeSec / 60);
      const remSec = avgTimeSec % 60;

      return {
        questionLabel: `Q${idx + 1}`,
        questionId: q.id,
        promptSnippet: q.question.length > 68 ? q.question.slice(0, 68) + '…' : q.question,
        avgTimeSec,
        formattedTime: `${mins}m ${remSec}s`,
        targetPacingSec,
        accuracyRate,
        points: q.points,
        samples: sampleCount,
      };
    });
  }, [selectedQuestionExam, sessions]);

  const axisColor = isLight ? '#57534e' : '#94a3b8';
  const gridColor = isLight ? 'rgba(68, 64, 60, 0.12)' : 'rgba(255, 255, 255, 0.07)';
  const tooltipBg = isLight ? '#faf7f2' : '#0f172a';
  const tooltipBorder = isLight ? 'rgba(68, 64, 60, 0.2)' : 'rgba(255, 255, 255, 0.15)';
  const tooltipText = isLight ? '#1c1917' : '#f8fafc';

  return (
    <div className="space-y-6">
      {/* Section Header & Exam Filter Toolbar */}
      <div
        className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-5 shadow-xl flex flex-wrap items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Recharts Performance, Pass/Fail & Question Timing Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Recharts SVG Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive visualization of candidate scores vs. integrity, cohort pass/fail ratios, and average seconds spent per question.
            </p>
          </div>
        </div>

        {/* Exam Filter Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter Cohort:</span>
          <div className="flex flex-wrap items-center gap-1 bg-black/30 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveExamFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeExamFilter === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Exams ({sessions.length})
            </button>
            {exams.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => {
                  setActiveExamFilter(ex.id);
                  setQuestionChartExamId(ex.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeExamFilter === ex.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ex.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Row: Candidate Performance Metrics (Left 7 cols) + Pass/Fail Ratios (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Candidate Performance & Integrity Metrics (Recharts ComposedChart) */}
        <div
          className={`lg:col-span-7 rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-6 shadow-xl flex flex-col justify-between`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                Candidate Performance & Integrity Metrics
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Academic score (%) vs. proctoring integrity rating (%) with 60% passing threshold line
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                Academic %
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block"></span>
                Integrity %
              </span>
            </div>
          </div>

          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={candidatePerformanceData}
                margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: gridColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '14px',
                    color: tooltipText,
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}%`,
                    name === 'academicScore' ? 'Academic Score' : 'Integrity Score',
                  ]}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    if (!item) return _label;
                    return `${item.fullName} (${item.studentId}) • ${item.examCode} • ${item.outcome}`;
                  }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Pass Threshold (60%)',
                    position: 'insideTopRight',
                    fill: '#f59e0b',
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="academicScore"
                  name="academicScore"
                  fill={isLight ? '#4d7c5f' : '#10b981'}
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
                <Bar
                  dataKey="integrityScore"
                  name="integrityScore"
                  fill={isLight ? '#0284c7' : '#38bdf8'}
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Pass / Fail / In-Progress Ratios (Recharts PieChart + Exam Breakdown) */}
        <div
          className={`lg:col-span-5 rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-6 shadow-xl flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                Pass / Fail & Completion Ratios
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cohort qualification breakdown & per-exam pass/fail distribution
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {passFailDistribution.overallPassRate}% Pass Rate
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div className="h-[195px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passFailDistribution.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={74}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {passFailDistribution.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '12px',
                      color: tooltipText,
                      fontSize: '12px',
                    }}
                    formatter={(value: any, _name: any, props: any) => [
                      `${value} candidates (${props.payload.percent}%)`,
                      props.payload.name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passed
                </span>
                <span className="font-mono font-bold text-white">
                  {passFailDistribution.passedCount} examinees
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <XCircle className="w-3.5 h-3.5" />
                  Failed / Flagged
                </span>
                <span className="font-mono font-bold text-white">
                  {passFailDistribution.failedCount} examinees
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Timer className="w-3.5 h-3.5" />
                  In Progress
                </span>
                <span className="font-mono font-bold text-white">
                  {passFailDistribution.inProgressCount} examinees
                </span>
              </div>
            </div>
          </div>

          {/* Per-Exam Stacked Pass/Fail Mini BarChart */}
          <div className="pt-3 border-t border-white/10 mt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Pass / Fail Breakdown by Exam Bank:
            </span>
            <div className="h-[75px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={passFailDistribution.perExamData}
                  layout="vertical"
                  margin={{ top: 0, right: 15, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="examCode"
                    width={56}
                    tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '10px',
                      color: tooltipText,
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="Passed"
                    stackId="a"
                    fill={isLight ? '#4d7c5f' : '#10b981'}
                    radius={[4, 0, 0, 4]}
                    barSize={14}
                  />
                  <Bar dataKey="Failed" stackId="a" fill="#f43f5e" barSize={14} />
                  <Bar
                    dataKey="InProgress"
                    stackId="a"
                    fill={isLight ? '#b45309' : '#38bdf8'}
                    radius={[0, 4, 4, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Average Time Spent on Questions per Exam (Recharts ComposedChart) */}
      <div
        className={`rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-6 shadow-xl space-y-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Average Time Spent on Questions per Exam ({selectedQuestionExam?.code}:{' '}
              {selectedQuestionExam?.title})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compares average candidate dwell time (seconds) per question against recommended exam pacing and item accuracy rate (%)
            </p>
          </div>

          {/* Exam Selector for Per-Question Time Chart */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Select Exam:</span>
            {exams.map((ex) => {
              const isSelected = selectedQuestionExam?.id === ex.id;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setQuestionChartExamId(ex.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all border ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {ex.code} ({ex.questions.length} Qs)
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          <div className="lg:col-span-3 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={questionTimingData}
                margin={{ top: 12, right: 20, left: -5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="questionLabel"
                  tick={{ fill: axisColor, fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => `${v}s`}
                  tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: gridColor }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '14px',
                    color: tooltipText,
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'avgTimeSec') return [`${value} sec`, 'Avg Time Spent'];
                    if (name === 'targetPacingSec') return [`${value} sec`, 'Target Pacing Benchmark'];
                    if (name === 'accuracyRate') return [`${value}%`, 'Cohort Accuracy Rate'];
                    return [value, String(name)];
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    if (!item) return label;
                    return `${label} (${item.formattedTime}) — ${item.promptSnippet}`;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                  formatter={(value) => {
                    if (value === 'avgTimeSec') return 'Avg Time Spent (sec)';
                    if (value === 'targetPacingSec') return 'Target Pacing (sec)';
                    if (value === 'accuracyRate') return 'Question Accuracy (%)';
                    return value;
                  }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracyRate"
                  fill={isLight ? 'rgba(77, 124, 95, 0.16)' : 'rgba(16, 185, 129, 0.15)'}
                  stroke={isLight ? '#4d7c5f' : '#10b981'}
                  strokeWidth={2}
                />
                <Bar
                  yAxisId="left"
                  dataKey="avgTimeSec"
                  fill={isLight ? '#d97706' : '#f59e0b'}
                  radius={[6, 6, 0, 0]}
                  barSize={30}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="targetPacingSec"
                  stroke={isLight ? '#0284c7' : '#38bdf8'}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Question Pacing Breakdown List */}
          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {questionTimingData.map((q) => {
              const isSlow = q.avgTimeSec > q.targetPacingSec * 1.15;
              return (
                <div
                  key={q.questionId}
                  className="p-3 rounded-2xl bg-black/25 border border-white/10 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">
                      {q.questionLabel} • {q.formattedTime}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isSlow
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {q.accuracyRate}% Correct
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{q.promptSnippet}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
