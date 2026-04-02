import React, { useEffect, useState } from 'react';
import { Flame, Star, BookOpen, Quote, Calendar, Bell, Shield, CheckCircle2 } from 'lucide-react';
import { DashboardData, TabType } from '../types';
import { apiFetch } from '../contexts/AuthContext';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: TabType) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-white rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-white rounded-3xl" />
      <div className="h-64 bg-white rounded-3xl" />
    </div>
  </div>;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#5A5A40] text-white p-8 lg:p-12 rounded-[2rem] shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-[#E6E6A0]" />
            <span className="text-xs font-sans uppercase tracking-[0.2em] text-[#E6E6A0]">Foco do Dia</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            {data.priorityVirtue?.name || "Humildade"}
          </h2>
          <p className="text-lg text-white/80 italic mb-8">
            "A humildade é a base de todas as outras virtudes no coração humano."
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setActiveTab('virtues')}
              className="px-6 py-3 bg-white text-[#5A5A40] rounded-full font-bold hover:bg-[#E6E6A0] transition-colors"
            >
              Praticar Agora
            </button>
            <button 
              onClick={() => setActiveTab('challenges')}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-full font-bold hover:bg-white/20 transition-colors"
            >
              Ver Desafio
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Shield className="w-full h-full transform translate-x-1/4 -translate-y-1/4" />
        </div>
      </section>

      {/* Grid Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Verse */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <BookOpen className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="font-bold">Versículo do Dia</h3>
          </div>
          <p className="text-lg italic leading-relaxed mb-4">
            "O Senhor é meu pastor, nada me faltará."
          </p>
          <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">Salmo 23, 1</p>
        </div>

        {/* Saint Quote */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Quote className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="font-bold">Pensamento</h3>
          </div>
          <p className="text-lg italic leading-relaxed mb-4">
            "Nada te turbe, nada te espante, tudo passa, Deus não muda."
          </p>
          <p className="text-xs text-[#5A5A40] font-sans uppercase tracking-widest">Santa Teresa de Ávila</p>
        </div>

        {/* Confession Reminder */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Calendar className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="font-bold">Sacramentos</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A1A1A]/60">Pecados pendentes</span>
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold">{data.pendingSinsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A1A1A]/60">Próxima Confissão</span>
              <span className="text-sm font-bold">15 Mar</span>
            </div>
            <button 
              onClick={() => setActiveTab('confession')}
              className="w-full mt-2 py-3 bg-[#F5F2ED] text-[#5A5A40] rounded-xl font-bold text-sm hover:bg-[#E6E6A0] transition-colors"
            >
              Preparar Exame
            </button>
          </div>
        </div>
      </div>

      {/* Prayer Reminders */}
      <section className="bg-white p-8 rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5F2ED] rounded-xl">
              <Bell className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <h3 className="text-xl font-bold">Ritmo de Oração</h3>
          </div>
          <button 
            onClick={() => setActiveTab('prayers')}
            className="text-sm text-[#5A5A40] font-bold hover:underline"
          >
            Ver Tudo
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Oferecimento do Dia', time: 'Manhã', done: true },
            { name: 'Angelus', time: '12:00', done: false },
            { name: 'Santo Rosário', time: 'Tarde', done: false },
          ].map((prayer, i) => (
            <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between ${prayer.done ? 'bg-[#F5F2ED]/50 border-[#5A5A40]/10' : 'bg-white border-[#1A1A1A]/5'}`}>
              <div>
                <p className={`font-bold ${prayer.done ? 'text-[#1A1A1A]/40 line-through' : ''}`}>{prayer.name}</p>
                <p className="text-xs text-[#1A1A1A]/40 uppercase tracking-widest">{prayer.time}</p>
              </div>
              <button className={`p-2 rounded-full ${prayer.done ? 'text-[#5A5A40]' : 'text-[#1A1A1A]/20 hover:text-[#5A5A40]'}`}>
                <CheckCircle2 className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
