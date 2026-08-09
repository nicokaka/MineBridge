import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldsStore } from '../../stores/worldsStore';
import { WorldCard } from './WorldCard';
import { Search, RefreshCw, Layers, Sparkles } from 'lucide-react';

export const WorldGrid: React.FC = () => {
  const { t } = useTranslation();
  const {
    worlds,
    isScanning,
    searchQuery,
    selectedEdition,
    setSearchQuery,
    setSelectedEdition,
    fetchWorlds,
    loadCachedWorlds,
  } = useWorldsStore();

  useEffect(() => {
    loadCachedWorlds();
    fetchWorlds();
  }, []);

  const filteredWorlds = worlds.filter((world) => {
    const matchesSearch = world.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEdition = selectedEdition === 'all' || world.edition === selectedEdition;
    return matchesSearch && matchesEdition;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            {t('dashboard.title')}
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {worlds.length} {worlds.length === 1 ? 'mundo' : 'mundos'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>

        <button
          onClick={fetchWorlds}
          disabled={isScanning}
          className="btn-secondary flex items-center gap-2 text-xs self-start sm:self-auto px-4 py-2.5 font-bold"
        >
          <RefreshCw size={14} className={isScanning ? 'animate-spin text-emerald-400' : ''} />
          <span>{isScanning ? t('dashboard.scanning') : t('dashboard.scanButton')}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Search Input with Proper Left Padding */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('dashboard.searchPlaceholder')}
            className="w-full bg-slate-950 border border-white/15 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
          />
        </div>

        {/* Edition Filter Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(['all', 'java', 'bedrock'] as const).map((edition) => (
            <button
              key={edition}
              onClick={() => setSelectedEdition(edition)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                selectedEdition === edition
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(23,221,98,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {edition === 'all' ? 'Todos' : edition}
            </button>
          ))}
        </div>
      </div>

      {/* Worlds Grid */}
      {isScanning ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
              <Sparkles size={32} className="animate-spin" />
            </div>
          </div>
          <p className="text-sm text-slate-300 font-mono">{t('dashboard.scanning')}</p>
        </div>
      ) : filteredWorlds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorlds.map((world) => (
            <WorldCard key={world.id} world={world} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 text-center max-w-md mx-auto my-12 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
            <Layers size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-200">{t('dashboard.emptyWorlds')}</h3>
          <p className="text-xs text-slate-400">{t('dashboard.emptyWorldsDesc')}</p>
        </div>
      )}
    </div>
  );
};
