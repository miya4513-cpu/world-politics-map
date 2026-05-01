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
}

interface RelationPopupProps {
  relations: CountryRelation[];
  countries: Country[];
  position: { x: number; y: number };
  onClose: () => void;
}

const RelationPopup: React.FC<RelationPopupProps> = ({
  relations,
  countries,
  position,
  onClose,
}) => {
  if (relations.length === 0) return null;

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm z-50 overflow-y-auto max-h-80"
      style={{ left: position.x + 20, top: position.y + 20 }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">関係一覧</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">×</button>
      </div>

      {relations.map((rel) => {
        const ca = countries.find(c => c.id === rel.country_a);
        const cb = countries.find(c => c.id === rel.country_b);
        const statusData = RELATION_STATUS[rel.status as keyof typeof RELATION_STATUS];
        if (!ca || !cb) return null;

        return (
          <div key={rel.id} className="border-t border-gray-200 pt-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">{ca.flag_emoji}</span>
              <span className="font-medium text-sm">{ca.name_ja}</span>
              <span className="text-gray-400">↔</span>
              <span className="text-xl">{cb.flag_emoji}</span>
              <span className="font-medium text-sm">{cb.name_ja}</span>
            </div>
            {statusData && (
              <div
                className="text-xs font-medium text-center py-1 rounded mb-2"
                style={{ color: statusData.color, backgroundColor: `${statusData.color}20` }}
              >
                {statusData.label}
              </div>
            )}
            <p className="text-xs text-gray-600">{rel.summary_ja}</p>
          </div>
        );
      })}
    </div>
  );
};

export default RelationPopup;
