'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Topology, GeometryCollection } from 'topojson-specification';
import RelationPopup from './RelationPopup';

interface Country {
  id: string;
  name_ja: string;
  name_en: string;
  flag_emoji: string;
  region: string;
  summary_ja: string;
  latitude: number;
  longitude: number;
}

interface CountryRelation {
  id: string;
  country_a: string;
  country_b: string;
  status: 'hostile' | 'tension' | 'friendly' | 'alliance';
  summary_ja: string;
  background_ja: string;
  last_updated: string;
}

interface WorldMapProps {
  relations: CountryRelation[];
  countries: Country[];
  onCountrySelect: (countryId: string | null) => void;
}

const STATUS_COLORS: Record<string, string> = {
  hostile: '#f87171',
  tension: '#fb923c',
  friendly: '#4ade80',
  alliance: '#60a5fa',
};

const NUMERIC_TO_ID: Record<string, string> = {
  '036': 'AU', '156': 'CN', '276': 'DE', '250': 'FR',
  '826': 'GB', '376': 'IL', '356': 'IN', '364': 'IR',
  '392': 'JP', '408': 'KP', '410': 'KR', '586': 'PK',
  '275': 'PS', '643': 'RU', '682': 'SA', '158': 'TW',
  '804': 'UA', '840': 'US',
};

export default function WorldMap({ relations, countries, onCountrySelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<CountryRelation[]>([]);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  const updateColors = (selected: string | null) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    if (!selected) {
      svg.selectAll<SVGPathElement, { id?: string | number }>('path.country')
        .attr('fill', 'url(#landGrad)').attr('opacity', 1).attr('filter', 'none');
      return;
    }
    const relationMap: Record<string, string> = {};
    relations.forEach(rel => {
      if (rel.country_a === selected) relationMap[rel.country_b] = rel.status;
      if (rel.country_b === selected) relationMap[rel.country_a] = rel.status;
    });
    svg.selectAll<SVGPathElement, { id?: string | number }>('path.country')
      .each(function(d) {
        const numericId = String((d as { id?: string | number }).id).padStart(3, '0');
        const countryId = NUMERIC_TO_ID[numericId];
        const el = d3.select(this);
        if (countryId === selected) {
          el.attr('fill', '#e2e8f0').attr('opacity', 1).attr('filter', 'url(#glow)');
        } else if (countryId && relationMap[countryId]) {
          el.attr('fill', STATUS_COLORS[relationMap[countryId]]).attr('opacity', 1).attr('filter', 'url(#glow)');
        } else {
          el.attr('fill', '#1e293b').attr('opacity', 0.5).attr('filter', 'none');
        }
      });
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    const defs = svg.append('defs');
    const bgGrad = defs.append('linearGradient').attr('id', 'bgGrad').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    bgGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0f172a');
    bgGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1e293b');
    const landGrad = defs.append('linearGradient').attr('id', 'landGrad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    landGrad.append('stop').attr('offset', '0%').attr('stop-color', '#334155');
    landGrad.append('stop').attr('offset', '100%').attr('stop-color', '#293548');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#bgGrad)');
    const projection = d3.geoNaturalEarth1().scale(width / 6.5).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]).on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoom);
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then((world: Topology) => {
        const countries110m = topojson.feature(world, (world.objects as Record<string, GeometryCollection>).countries);
        if (countries110m.type !== 'FeatureCollection') return;
        g.selectAll('path.country')
          .data(countries110m.features)
          .enter()
          .append('path')
          .attr('class', 'country')
          .attr('d', path as never)
          .attr('fill', 'url(#landGrad)')
          .attr('stroke', '#475569')
          .attr('stroke-width', 0.3)
          .attr('cursor', 'pointer')
          .on('mouseover', function(_, d) {
            const numericId = String((d as { id?: string | number }).id).padStart(3, '0');
            const countryId = NUMERIC_TO_ID[numericId];
            if (!selectedCountry && countryId) {
              d3.select(this).attr('fill', '#3b82f6').attr('filter', 'url(#glow)');
            }
          })
          .on('mouseout', function(_, d) {
            const numericId = String((d as { id?: string | number }).id).padStart(3, '0');
            const countryId = NUMERIC_TO_ID[numericId];
            if (!selectedCountry && countryId) {
              d3.select(this).attr('fill', 'url(#landGrad)').attr('filter', 'none');
            }
          })
          .on('click', function(event, d) {
            const numericId = String((d as { id?: string | number }).id).padStart(3, '0');
            const countryId = NUMERIC_TO_ID[numericId];
            if (!countryId) return;
            setSelectedCountry(countryId);
            onCountrySelect(countryId);
            updateColors(countryId);
            const related = relations.filter(r => r.country_a === countryId || r.country_b === countryId);
            setPopupData(related);
            const rect = containerRef.current!.getBoundingClientRect();
            setPopupPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          });
      });
  }, [relations, countries]);

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-xl overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1 border border-slate-700">
        {[
          { status: 'hostile', label: '敵対' },
          { status: 'tension', label: '対立' },
          { status: 'friendly', label: '友好' },
          { status: 'alliance', label: '同盟' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center space-x-2">
            <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status], boxShadow: `0 0 6px ${STATUS_COLORS[status]}` }} />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
      </div>
      {!selectedCountry && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 backdrop-blur-sm text-slate-300 text-xs px-4 py-2 rounded-full border border-slate-600 pointer-events-none">
          🌍 国をクリックして関係を見る　|　スクロールでズーム
        </div>
      )}
      {popupData.length > 0 && popupPos && (
        <RelationPopup
          relations={popupData}
          countries={countries}
          position={popupPos}
          onClose={() => {
            setPopupData([]);
            setPopupPos(null);
            setSelectedCountry(null);
            onCountrySelect(null);
            updateColors(null);
          }}
        />
      )}
    </div>
  );
}
