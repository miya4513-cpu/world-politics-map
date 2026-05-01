'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  currentPage?: string;
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/') return currentPage === 'home';
    return pathname?.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🗺️</span>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
                政治情勢マップ
              </span>
            </Link>
          </div>

          {/* ナビゲーション */}
          <nav className="flex items-center space-x-4 sm:space-x-8">
            <Link
              href="/"
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              地図
            </Link>
            <Link
              href="/articles"
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                isActive('/articles')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ニュース
            </Link>
            
            {/* 国検索 */}
            <div className="hidden lg:block relative">
              <input
                type="text"
                placeholder="国を検索..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-48 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
