import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Layers } from 'lucide-react';

export const Titlebar: React.FC = () => {
  const appWindow = getCurrentWindow();

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <header
      data-tauri-drag-region
      className="h-10 bg-[#070a12] border-b border-white/10 flex items-center justify-between px-3 select-none z-50 text-slate-300"
    >
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 pointer-events-none">
        <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Layers size={14} />
        </div>
        <span className="font-bold text-xs tracking-wider text-slate-200 uppercase font-mono">
          MineBridge <span className="text-[10px] text-emerald-400 font-normal">v1.0</span>
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/80 text-slate-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};
