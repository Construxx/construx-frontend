import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Command,
  ArrowRight,
  HardHat,
  Boxes,
  Building2,
  AlertTriangle,
  FileText,
  Sliders,
  Award,
  Zap,
  CheckCircle2,
  X,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Project, Building } from '../../types';
import { Smartphone } from 'lucide-react';
import { api } from '../../lib/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: 'command_center' | 'build' | 'supply' | 'operate' | 'portfolio' | 'site') => void;
  onOpenSimulator?: () => void;
  onOpenHandoverCert?: () => void;
  onOpenPricing?: () => void;
  projects: Project[];
  activeProject: Project | null;
  buildings: Building[];
  activeBuilding: Building | null;
  onOpenBoQImport?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSimulator,
  onOpenHandoverCert,
  onOpenPricing,
  projects,
  activeProject,
  buildings,
  activeBuilding,
  onOpenBoQImport,
}) => {
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setAiAnswer(null);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or toggle
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      label: 'Which tasks risk delay on this project?',
      action: () => { void handleAskStore('Which tasks risk delay?'); },
    },
    {
      label: 'What materials have critical shortages this week?',
      action: () => { void handleAskStore('What materials have critical shortages?'); },
    },
    {
      label: 'What building equipment needs maintenance?',
      action: () => { void handleAskStore('What building equipment needs maintenance?'); },
    },
    {
      label: 'Summarize this project’s current status',
      action: () => { void handleAskStore('Summarize the current project status.'); },
    },
  ];

  const handleAskStore = async (promptText: string) => {
    setQuery(promptText);
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      if (!activeProject) throw new Error('Select a project before asking a question.');
      const result = await api.askQuestion(promptText, activeProject.id, activeBuilding?.id) as { answer: string };
      setAiAnswer(result.answer);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI request failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const navActions = [
    {
      title: 'Command Center (Executive Home)',
      category: 'Navigation',
      icon: Sparkles,
      color: 'text-amber-400',
      action: () => {
        onNavigate('command_center');
        onClose();
      },
    },
    {
      title: 'Build Module (Tasks, Gantt, WhatsApp Feed)',
      category: 'Navigation',
      icon: HardHat,
      color: 'text-blue-400',
      action: () => {
        onNavigate('build');
        onClose();
      },
    },
    {
      title: 'Supply Module (Materials, POs, Price Tracker)',
      category: 'Navigation',
      icon: Boxes,
      color: 'text-emerald-400',
      action: () => {
        onNavigate('supply');
        onClose();
      },
    },
    {
      title: 'Operate Module (BuildTwin Digital Twin & Room 204)',
      category: 'Navigation',
      icon: Building2,
      color: 'text-purple-400',
      action: () => {
        onNavigate('operate');
        onClose();
      },
    },
    {
      title: 'Portfolio Map (Lagos Projects & Towers)',
      category: 'Navigation',
      icon: TrendingUp,
      color: 'text-cyan-400',
      action: () => {
        onNavigate('portfolio');
        onClose();
      },
    },
    {
      title: 'Site View (Mobile PWA, Offline Tasks & Camera)',
      category: 'Navigation',
      icon: Smartphone,
      color: 'text-amber-400',
      action: () => {
        onNavigate('site');
        onClose();
      },
    },
    {
      title: 'Create Project: Import Bill of Quantities (AI Onboarding)',
      category: 'Onboarding & Projects',
      icon: Sparkles,
      color: 'text-amber-400',
      action: () => {
        onClose();
        if (onOpenBoQImport) onOpenBoQImport();
      },
    },
    {
      title: 'Cost & Delay What-If Simulator',
      category: 'Interactive Tools',
      icon: Sliders,
      color: 'text-amber-400',
      action: () => {
        onClose();
        if (onOpenSimulator) onOpenSimulator();
        else onNavigate('build');
      },
    },
    {
      title: 'Official Handover Certificate & QR Badges',
      category: 'Interactive Tools',
      icon: Award,
      color: 'text-purple-400',
      action: () => {
        onClose();
        if (onOpenHandoverCert) onOpenHandoverCert();
        else onNavigate('operate');
      },
    },
    {
      title: 'Market Size & SaaS Pricing Slide',
      category: 'Business Model',
      icon: FileText,
      color: 'text-emerald-400',
      action: () => {
        onClose();
        if (onOpenPricing) onOpenPricing();
      },
    },
  ];

  const filteredNav = navActions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#121821] border border-[#232C3B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#232C3B] bg-[#0B0F14]/70">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleAskStore(query);
              }
            }}
            placeholder="Type a command, jump to a screen, or ask CONSTRUX AI..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setAiAnswer(null);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            <span>↵</span>
          </kbd>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isAiLoading && <div className="px-4 py-2 text-xs text-amber-300" role="status">CONSTRUX AI is processing the request…</div>}

          {aiError && <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-200">{aiError}</div>}
          {aiAnswer && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/50 shadow-lg text-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>CONSTRUX INTELLIGENCE ANSWER</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Live Database Grounding</span>
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-line font-sans">
                {aiAnswer}
              </div>
              <div className="flex items-center gap-2 pt-2 text-[11px]">
                <button
                  onClick={() => {
                    onNavigate('build');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1"
                >
                  <span>Open Build</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('supply');
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                >
                  <span>Open Supply</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Suggested AI Prompts */}
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Suggested AI Queries</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={p.action}
                  className="text-left p-2.5 rounded-xl bg-[#1A2230] hover:bg-slate-800 border border-[#232C3B] hover:border-amber-500/40 text-xs text-slate-300 hover:text-white transition-all group flex items-start justify-between gap-2"
                >
                  <span className="leading-snug">{p.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Navigation and Tools */}
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-500 mb-2">
              Actions & Navigation
            </div>
            <div className="space-y-1">
              {filteredNav.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={action.action}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-transparent hover:bg-[#1A2230] transition-colors flex items-center justify-between group border border-transparent hover:border-[#232C3B]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${action.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {action.title}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{action.category}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#0B0F14] border-t border-[#232C3B] text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="text-amber-400/80 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>AI Powered</span>
          </div>
        </div>
      </div>
    </div>
  );
};
