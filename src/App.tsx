import React, { useState } from 'react';
import { 
  Cross, 
  Book, 
  Heart, 
  Calendar, 
  Scroll, 
  Shield, 
  Quote, 
  PenTool,
  Menu,
  X,
  ChevronRight,
  Clock,
  Flame,
  Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabType } from './types';

// Components
import Dashboard from './components/Dashboard';
import VirtuesMap from './components/VirtuesMap';
import PrayerRoutine from './components/PrayerRoutine';
import SpiritualJournal from './components/SpiritualJournal';
import ConfessionGuide from './components/ConfessionGuide';
import BibleReader from './components/BibleReader';
import LectioDivina from './components/LectioDivina';
import SaintQuotes from './components/SaintQuotes';
import WeeklyChallenges from './components/WeeklyChallenges';
import Prayers from './components/Prayers';
import News from './components/News';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Flame },
    { id: 'virtues', label: 'Mapa de Virtudes', icon: Shield },
    { id: 'prayers', label: 'Ritmo de Oração', icon: Clock },
    { id: 'oracoes', label: 'Orações', icon: Heart },
    { id: 'journal', label: 'Diário Espiritual', icon: PenTool },
    { id: 'confession', label: 'Confissão', icon: Cross },
    { id: 'lectio', label: 'Lectio Divina', icon: Scroll },
    { id: 'bible', label: 'Bíblia', icon: Book },
    { id: 'challenges', label: 'Desafios', icon: Calendar },
    { id: 'saints', label: 'Santos', icon: Quote },
    { id: 'news', label: 'Notícias', icon: Newspaper },
  ];

  const renderContent = () => {
    const props = { setActiveTab };
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'virtues': return <VirtuesMap {...props} />;
      case 'prayers': return <PrayerRoutine {...props} />;
      case 'oracoes': return <Prayers {...props} />;
      case 'journal': return <SpiritualJournal {...props} />;
      case 'confession': return <ConfessionGuide {...props} />;
      case 'bible': return <BibleReader {...props} />;
      case 'lectio': return <LectioDivina {...props} />;
      case 'saints': return <SaintQuotes {...props} />;
      case 'challenges': return <WeeklyChallenges {...props} />;
      case 'news': return <News />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#1A1A1A]/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Cross className="w-6 h-6 text-[#5A5A40]" />
          <h1 className="text-xl font-bold tracking-tight">Caminho da Santidade</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#1A1A1A]/10 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center">
                  <Cross className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-none">Santidade</h2>
                  <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest mt-1">Caminho Diário</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200
                      ${activeTab === item.id 
                        ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20' 
                        : 'hover:bg-[#F5F2ED] text-[#1A1A1A]/60 hover:text-[#1A1A1A]'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {activeTab === item.id && <motion.div layoutId="active-pill" className="ml-auto"><ChevronRight className="w-4 h-4" /></motion.div>}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-[#1A1A1A]/10">
              <div className="p-4 bg-[#F5F2ED] rounded-2xl">
                <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-wider mb-2">Progresso Semanal</p>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-[#5A5A40] w-[65%]" />
                </div>
                <p className="text-[10px] mt-2 text-[#1A1A1A]/60 italic">"Tudo posso naquele que me fortalece."</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
