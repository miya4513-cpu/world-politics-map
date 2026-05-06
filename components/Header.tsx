'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface HeaderProps {
  currentPage?: string;
  countries?: { id: string; name_ja: string; flag_emoji: string }[];
  onCountrySelect?: (countryId: string) => void;
}

export default function Header({ currentPage = 'home', countries = [], onCountrySelect }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
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
    if (onCountrySelect) {
      onCountrySelect(id);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPage === 'home';
    return pathname?.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🗺️</span>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">政治情勢マップ</span>
            </Link>
          </div>
          <nav className="flex items-center space-x-4 sm:space-x-8">
            <Link href="/" className={`px-3 py-2 text-sm font-medium rounded-md ${isActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>地図</Link>
            <Link href="/articles" className={`px-3 py-2 text-sm font-medium rounded-md ${isActive('/articles') ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}>ニュース</Link>
            <div className="hidden lg:block relative" ref={ref}>
              <input
                type="text"
                placeholder="国を検索..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-48 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
              {open && (
                <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {results.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left"
                    >
                      <span>{c.flag_emoji}</span>
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
