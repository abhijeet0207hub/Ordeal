import { GlassTheme } from '../types';

export interface ThemeConfig {
  id: GlassTheme;
  name: string;
  tagline: string;
  accentColor: string;
  cardBg: string;
  navBg: string;
  border: string;
  glow: string;
  badgeBg: string;
  badgeText: string;
  accentBtn: string;
  subtleBg: string;
  previewGradient: string;
}

export const GLASS_THEMES: Record<GlassTheme, ThemeConfig> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Frosted',
    tagline: 'Deep dark acrylic with soft emerald refractions',
    accentColor: '#10b981',
    cardBg: 'bg-slate-900/60 backdrop-blur-xl',
    navBg: 'bg-slate-950/80 backdrop-blur-2xl',
    border: 'border-white/10 hover:border-white/20',
    glow: 'shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25',
    badgeText: 'text-emerald-400',
    accentBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20',
    subtleBg: 'bg-slate-800/40 border-slate-700/50',
    previewGradient: 'from-slate-950 via-slate-900 to-emerald-950/40',
  },
  smoky: {
    id: 'smoky',
    name: 'Smoky Charcoal',
    tagline: 'High-contrast smoke glass with razor silver hairlines',
    accentColor: '#38bdf8',
    cardBg: 'bg-zinc-950/75 backdrop-blur-md',
    navBg: 'bg-black/85 backdrop-blur-xl',
    border: 'border-zinc-700/60 hover:border-zinc-500/60',
    glow: 'shadow-[0_8px_30px_rgb(0,0,0,0.55)]',
    badgeBg: 'bg-sky-500/10 border-sky-500/25',
    badgeText: 'text-sky-400',
    accentBtn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20',
    subtleBg: 'bg-zinc-900/50 border-zinc-700/50',
    previewGradient: 'from-zinc-950 via-neutral-900 to-zinc-800/60',
  },
  iridescent: {
    id: 'iridescent',
    name: 'Luminous Iridescent',
    tagline: 'Prismatic acrylic layers with ethereal cyan-violet glow',
    accentColor: '#818cf8',
    cardBg: 'bg-indigo-950/35 backdrop-blur-2xl',
    navBg: 'bg-slate-950/75 backdrop-blur-2xl',
    border: 'border-cyan-400/25 hover:border-cyan-400/40',
    glow: 'shadow-[0_8px_32px_0_rgba(49,46,129,0.35)]',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
    badgeText: 'text-indigo-300',
    accentBtn: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-500/25',
    subtleBg: 'bg-indigo-950/40 border-indigo-800/40',
    previewGradient: 'from-slate-950 via-indigo-950/60 to-purple-950/40',
  },
};
