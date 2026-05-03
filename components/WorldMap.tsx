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
  hostile: '#ef4444',
  tension: '#f97316',
  friendly: '#22c55e',
  alliance: '#3b82f6',
};

export default function WorldMap({ relations, countries, onCountrySelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<CountryRelation[]>([]);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 500;

    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.5)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    // ズーム
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // 地図データ読み込み
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then((world: Topology) => {
        const countries110m = topojson.feature(
          world,
          (world.objects as Record<string, GeometryCollection>).countries
        );

        if (countries110m.type !== 'FeatureCollection') return;

        g.selectAll('path')
          .data(countries110m.features)
          .enter()
          .append('path')
          .attr('d', path as never)
          .attr('fill', '#d1d5db')
          .attr('stroke', '#9ca3af')
          .attr('stroke-width', 0.5)
          .attr('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this).attr('fill', '#93c5fd');
          })
          .on('mouseout', function (_, d) {
            const feature = d as { id?: string | number };
            const isSelected = selectedCountry === String(feature.id);
            d3.select(this).attr('fill', isSelected ? '#3b82f6' : '#d1d5db');
          })
          .on('click', function (event, d) {
            const feature = d as { id?: string | number };
            const countryId = String(feature.id);
            setSelectedCountry(countryId);
            onCountrySelect(countryId);

            const related = relations.filter(
              r => r.country_a === countryId || r.country_b === countryId
            );
            setPopupData(related);
            setPopupPos({ x: event.offsetX, y: event.offsetY });
          });

        // 関係線を描画
        relations.forEach(rel => {
          const ca = countries.find(c => c.id === rel.country_a);
          const cb = countries.find(c => c.id === rel.country_b);
          if (!ca || !cb) return;

          const pa = projection([ca.longitude, ca.latitude]);
          const pb = projection([cb.longitude, cb.latitude]);
          if (!pa || !pb) return;

          g.append('line')
            .attr('x1', pa[0]).attr('y1', pa[1])
            .attr('x2', pb[0]).attr('y2', pb[1])
            .attr('stroke', STATUS_COLORS[rel.status] || '#888')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.7);
        });
      });
  }, [relations, countries]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
      {!selectedCountry && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
          国をクリックして関係を見る
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
          }}
        />
      )}
    </div>
  );
}
 
 
