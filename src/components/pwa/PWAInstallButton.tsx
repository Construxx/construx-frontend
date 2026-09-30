import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../lib/offline/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 ${className}`}
          title="Install CONSTRUX Site as Progressive Web App"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Install App</span>
        </button>
      )}

      {!isInstallable && isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all ${className}`}
          title="Install on iOS Home Screen"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Add to iOS</span>
        </button>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#121821] border border-[#232C3B] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  C
                </div>
                <h3 className="text-sm font-bold">Install CONSTRUX on iOS</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Install CONSTRUX directly on your iPhone or iPad for offline jobsite access:
            </p>

            <div className="space-y-3 text-xs bg-[#0B0F14] p-3.5 rounded-xl border border-[#232C3B] mb-5">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-slate-800 text-amber-400 mt-0.5">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-300">
                  1. Tap the <strong className="text-white">Share</strong> icon in the Safari navigation bar at the bottom.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-slate-800 text-amber-400 mt-0.5">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-300">
                  2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-slate-800 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-300">
                  3. Tap <strong className="text-white">Add</strong> in the top-right corner to launch full screen.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
