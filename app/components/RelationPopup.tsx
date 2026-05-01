'use client';

import React from 'react';
import { RELATION_STATUS } from '@/lib/constants';

interface Country {
  id: string;
  name_ja: string;
  name_en: string;
  flag_emoji: string;
}

interface RelationData {
  source: string;
  target: string;
  status: string;
  summary_ja: string;
  background_ja: string;
}

interface RelationPopupProps {
  x: number;
  y: number;
  relation: RelationData;
  countries: Country[];
  onClose: () => void;
}

const RelationPopup: React.FC<RelationPopupProps> = ({
  x,
  y,
  relation,
  countries,
  onClose,
}) => {
  const sourceCountry = countries.find(c => c.id === relation.source);
  const targetCountry = countries.find(c => c.id === relation.target);

  if (!sourceCountry || !targetCountry) return null;

  const statusData = RELATION_STATUS[relation.status as keyof typeof RELATION_STATUS];

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md z-50"
      style={{ left: x + 20, top: y + 20 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{sourceCountry.flag_emoji}</span>
          <span className="font-semibold">{sourceCountry.name_ja}</span>
          <span className="text-gray-500">↔</span>
          <span className="text-2xl">{targetCountry.flag_emoji}</span>
          <span className="font-semibold">{targetCountry.name_ja}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ×
        </button>
      </div>

      <div 
        className={`font-medium mb-3 text-center py-1 rounded`}
        style={{ 
          color: statusData.color,
          backgroundColor: `${statusData.color}20`
        }}
      >
        {statusData.label}
      </div>

      <div className="border-t border-gray-200 pt-3 mb-3">
        <p className="text-sm text-gray-700 mb-2">{relation.summary_ja}</p>
      </div>

      <div className="border-t border-gray-200 pt-3 mb-4">
        <p className="text-xs text-gray-600 leading-relaxed">
          {relation.background_ja}
        </p>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          関連記事を見る →
        </button>
      </div>
    </div>
  );
};

export default RelationPopup;
