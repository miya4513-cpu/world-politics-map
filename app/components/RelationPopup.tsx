'use client';

import React from 'react';
import { RELATION_STATUS } from '@/lib/constants';

interface Country {
  id: string;
  name_ja: string;
  name_en: string;
  flag_emoji: string;
}

interface CountryRelation {
  id: string;
  country_a: string;
  country_b: string;
  status: string;
  summary_ja: string;
  background_ja: string;
  last_updated: string;
  conflict_types?: string[];
}

interface RelationPopupProps {
  relations: CountryRelation[];
  countries: Country[];
  position: { x: number; y: number };
  onClose: () => void;
}

const CONFLICT_ICONS: Record<string, { icon: string; label: string }> = {
  territory: { icon: '🗺️', label: '領土' },
  religion: { icon: '✝️', label: '宗教' },
  economic: { icon: '💰', label: '経済' },
  military: { icon: '⚔️', label: '軍事' },
  ideology: { icon: '🏛️', label: 'イデオロギー' },
  historical: { icon: '📜', label: '歴史認識' },
};

const RelationPopup: React.FC<RelationPopupProps> = ({
  relations,
  countries,
  position,
  onClose,
}) => {
  if (relations.length === 0) return null;

  return (
    <div
      className="absolute bg-gray-900 border border-slate-700 rounded-xl shadow-2xl p-4 max-w-sm z-50 overflow-y-auto max-h-96" style={{ right: 16, top: 16, left: 'auto' }}
      style={{
  left: Math.min(position.x + 20, window.innerWidth - 370),
  top: Math.min(position.y + 20, window.innerHeight - 420),
}}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-white text-sm">関係一覧</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
      </div>

      {relations.map((rel) => {
        const ca = countries.find(c => c.id === rel.country_a);
        const cb = countries.find(c => c.id === rel.country_b);
        const statusData = RELATION_STATUS[rel.status as keyof typeof RELATION_STATUS];
        if (!ca || !cb) return null;

        return (
          <div key={rel.id} className="border-t border-slate-700 pt-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{ca.flag_emoji}</span>
              <span className="font-medium text-xs text-white">{ca.name_ja}</span>
              <span className="text-slate-500 text-xs">↔</span>
              <span className="text-lg">{cb.flag_emoji}</span>
              <span className="font-medium text-xs text-white">{cb.name_ja}</span>
            </div>

            {statusData && (
              <div
                className="text-xs font-medium text-center py-1 rounded-full mb-2"
                style={{ color: statusData.color, backgroundColor: `${statusData.color}25` }}
              >
                {statusData.label}
              </div>
            )}

            {rel.conflict_types && rel.conflict_types.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {rel.conflict_types.map(type => {
                  const info = CONFLICT_ICONS[type];
                  if (!info) return null;
                  return (
                    <span
                      key={type}
                      className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600"
                    >
                      {info.icon} {info.label}
                    </span>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">{rel.summary_ja}</p>
          </div>
        );
      })}
    </div>
  );
};

export default RelationPopup;


