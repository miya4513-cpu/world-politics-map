'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
interface HeaderProps {
  currentPage?: string;
  countries?: { id: string; name_ja: string; flag_emoji: string }[];
  onCountrySelect?: (countryId: string) => void;
}
export default function Header({ currentPage = 'home', countries = [], onCountrySelect }: HeaderProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name_ja: string; flag_emoji: string }[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (query.trim() === '') { setResults([]); setOpen(false); return; }
    const filtered = countries.filter(c => c.name_ja.includes(query)).slice(0, 8);
    setResults(filtered);
    setOpen(filtered.length > 0);
  }, [query, countries]);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const handleSelect = (id: string) => {
    setQuery('');
    setOpen(false);
    if (onCountrySelect) onCountrySelect(id);
  };
  const isActive = (path: string) => {
    if (path === '/') return currentPage === 'home';
    return pathname?.startsWith(path);
  };
  return (
    <header className="bg-gray-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🗺️</span>
              <span className="font-bold text-xl text-white hidden sm:block">政治情勢マップ</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>地図</Link>
            <Link href="/articles" className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive('/articles') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>ニュース</Link>
            <div className="hidden lg:block relative" ref={ref}>
              <input
                type="text"
                placeholder="国を検索..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm w-48 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</div>
              {open && (
                <div className="absolute top-full mt-1 left-0 w-56 bg-gray-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {results.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white text-left transition-colors"
                    >
                      <img src={`https://flagcdn.com/24x18/${c.id.toLowerCase()}.png`} alt={c.name_ja} className="w-5 h-3.5 object-cover rounded-sm" />
                      <span>{c.name_ja}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}