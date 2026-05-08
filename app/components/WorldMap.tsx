'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Topology, GeometryCollection } from 'topojson-specification';
interface Country { id: string; name_ja: string; name_en: string; flag_emoji: string; region: string; summary_ja: string; latitude: number; longitude: number; }
interface CountryRelation { id: string; country_a: string; country_b: string; status: 'hostile' | 'tension' | 'friendly' | 'alliance'; summary_ja: string; background_ja: string; last_updated: string; conflict_types?: string[]; }
interface WorldMapProps { relations: CountryRelation[]; countries: Country[]; onCountrySelect: (countryId: string | null) => void; selectedCountryId?: string | null; highlightCountries?: string[] | null; highlightColor?: string; }
const STATUS_COLORS: Record<string, string> = { hostile: '#f87171', tension: '#fb923c', friendly: '#4ade80', alliance: '#60a5fa' };
const NUMERIC_TO_ID: Record<string, string> = { '004':'AF','008':'AL','012':'DZ','020':'AD','024':'AO','028':'AG','032':'AR','051':'AM','036':'AU','040':'AT','031':'AZ','044':'BS','048':'BH','050':'BD','052':'BB','112':'BY','056':'BE','084':'BZ','204':'BJ','064':'BT','068':'BO','070':'BA','072':'BW','076':'BR','096':'BN','100':'BG','854':'BF','108':'BI','132':'CV','116':'KH','120':'CM','124':'CA','140':'CF','148':'TD','152':'CL','156':'CN','170':'CO','174':'KM','178':'CG','180':'CD','188':'CR','191':'HR','192':'CU','196':'CY','203':'CZ','208':'DK','262':'DJ','212':'DM','214':'DO','218':'EC','818':'EG','222':'SV','226':'GQ','232':'ER','233':'EE','748':'SZ','231':'ET','242':'FJ','246':'FI','250':'FR','266':'GA','270':'GM','268':'GE','276':'DE','288':'GH','300':'GR','308':'GD','320':'GT','324':'GN','624':'GW','328':'GY','332':'HT','340':'HN','348':'HU','352':'IS','356':'IN','360':'ID','364':'IR','368':'IQ','372':'IE','376':'IL','380':'IT','388':'JM','392':'JP','400':'JO','398':'KZ','404':'KE','296':'KI','408':'KP','410':'KR','414':'KW','417':'KG','418':'LA','428':'LV','422':'LB','426':'LS','430':'LR','434':'LY','438':'LI','440':'LT','442':'LU','450':'MG','454':'MW','458':'MY','462':'MV','466':'ML','470':'MT','584':'MH','478':'MR','480':'MU','484':'MX','583':'FM','498':'MD','492':'MC','496':'MN','499':'ME','504':'MA','508':'MZ','104':'MM','516':'NA','520':'NR','524':'NP','528':'NL','554':'NZ','558':'NI','562':'NE','566':'NG','807':'MK','578':'NO','512':'OM','586':'PK','585':'PW','275':'PS','591':'PA','598':'PG','600':'PY','604':'PE','608':'PH','616':'PL','620':'PT','634':'QA','642':'RO','643':'RU','646':'RW','659':'KN','662':'LC','670':'VC','882':'WS','674':'SM','678':'ST','682':'SA','686':'SN','688':'RS','690':'SC','694':'SL','702':'SG','703':'SK','705':'SI','090':'SB','706':'SO','710':'ZA','728':'SS','724':'ES','144':'LK','729':'SD','740':'SR','752':'SE','756':'CH','760':'SY','158':'TW','762':'TJ','834':'TZ','764':'TH','626':'TL','768':'TG','776':'TO','780':'TT','788':'TN','792':'TR','795':'TM','798':'TV','800':'UG','804':'UA','784':'AE','826':'GB','840':'US','858':'UY','860':'UZ','548':'VU','862':'VE','704':'VN','887':'YE','894':'ZM','716':'ZW' };

export default function WorldMap({ relations, countries, onCountrySelect, selectedCountryId, highlightCountries, highlightColor }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const selectedCountryIdRef = useRef(selectedCountryId);
  useEffect(() => { selectedCountryIdRef.current = selectedCountryId; }, [selectedCountryId]);

  const updateColors = (selected: string | null, highlight: string[] | null | undefined, hColor: string | undefined) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    if (!selected && highlight && highlight.length > 0) {
      const color = hColor || '#a78bfa';
      svg.selectAll<SVGPathElement, {id?:string|number}>('path.country').each(function(d) {
        const numericId = String((d as {id?:string|number}).id).padStart(3,'0');
        const countryId = NUMERIC_TO_ID[numericId];
        const el = d3.select(this);
        if (countryId && highlight.includes(countryId)) {
          el.attr('fill', color).attr('opacity', 1).attr('filter', 'url(#glow)');
        } else {
          el.attr('fill', 'url(#landGrad)').attr('opacity', 0.3).attr('filter', 'none');
        }
      });
      return;
    }
    if (!selected) {
      svg.selectAll<SVGPathElement, {id?:string|number}>('path.country').attr('fill','url(#landGrad)').attr('opacity',1).attr('filter','none');
      return;
    }
    const relationMap: Record<string, string> = {};
    relations.forEach(rel => { if (rel.country_a === selected) relationMap[rel.country_b] = rel.status; if (rel.country_b === selected) relationMap[rel.country_a] = rel.status; });
    svg.selectAll<SVGPathElement, {id?:string|number}>('path.country').each(function(d) {
      const numericId = String((d as {id?:string|number}).id).padStart(3,'0');
      const countryId = NUMERIC_TO_ID[numericId];
      const el = d3.select(this);
      if (countryId === selected) { el.attr('fill','#e2e8f0').attr('opacity',1).attr('filter','url(#glow)'); }
      else if (countryId && relationMap[countryId]) { el.attr('fill',STATUS_COLORS[relationMap[countryId]]).attr('opacity',1).attr('filter','url(#glow)'); }
      else { el.attr('fill','url(#landGrad)').attr('opacity',0.4).attr('filter','none'); }
    });
  };

  useEffect(() => {
    if (!mapLoaded) return;
    updateColors(selectedCountryId ?? null, highlightCountries, highlightColor);
  }, [selectedCountryId, highlightCountries, highlightColor, mapLoaded]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    const defs = svg.append('defs');
    const bgGrad = defs.append('linearGradient').attr('id','bgGrad').attr('x1','0%').attr('y1','0%').attr('x2','100%').attr('y2','100%');
    bgGrad.append('stop').attr('offset','0%').attr('stop-color','#0f172a');
    bgGrad.append('stop').attr('offset','100%').attr('stop-color','#1e293b');
    const landGrad = defs.append('linearGradient').attr('id','landGrad').attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    landGrad.append('stop').attr('offset','0%').attr('stop-color','#334155');
    landGrad.append('stop').attr('offset','100%').attr('stop-color','#293548');
    const filter = defs.append('filter').attr('id','glow');
    filter.append('feGaussianBlur').attr('stdDeviation','4').attr('result','coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in','coloredBlur');
    feMerge.append('feMergeNode').attr('in','SourceGraphic');
    svg.append('rect').attr('width',width).attr('height',height).attr('fill','url(#bgGrad)');
    const projection = d3.geoNaturalEarth1().scale(width/6.5).translate([width/2,height/2]);
    const path = d3.geoPath().projection(projection);
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement,unknown>().scaleExtent([1,8]).on('zoom',(event)=>{g.attr('transform',event.transform);});
    svg.call(zoom);
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(res=>res.json()).then((world:Topology)=>{
      const countries110m = topojson.feature(world,(world.objects as Record<string,GeometryCollection>).countries);
      if (countries110m.type !== 'FeatureCollection') return;
      g.selectAll('path.country').data(countries110m.features).enter().append('path')
        .attr('class','country').attr('d',path as never).attr('fill','url(#landGrad)').attr('stroke','#475569').attr('stroke-width',0.3).attr('cursor','pointer')
        .on('mouseover',function(_,d){
          const nid=String((d as {id?:string|number}).id).padStart(3,'0');
          const cid=NUMERIC_TO_ID[nid];
          if(!selectedCountryIdRef.current && cid){
            d3.select(this).attr('fill','#3b82f6').attr('filter','url(#glow)');
          }
        })
        .on('mouseout',function(_,d){
          const nid=String((d as {id?:string|number}).id).padStart(3,'0');
          const cid=NUMERIC_TO_ID[nid];
          if(!selectedCountryIdRef.current && cid){
            d3.select(this).attr('fill','url(#landGrad)').attr('filter','none');
          }
        })
        .on('click',function(_,d){const nid=String((d as {id?:string|number}).id).padStart(3,'0');const cid=NUMERIC_TO_ID[nid];if(!cid)return;onCountrySelect(cid);});
      setMapLoaded(true);
    });
  },[relations,countries]);

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-xl overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1 border border-slate-700">
        {[{status:'hostile',label:'敵対'},{status:'tension',label:'対立'},{status:'friendly',label:'友好'},{status:'alliance',label:'同盟'}].map(({status,label})=>(
          <div key={status} className="flex items-center space-x-2">
            <div className="w-4 h-1.5 rounded-full" style={{backgroundColor:STATUS_COLORS[status],boxShadow:`0 0 6px ${STATUS_COLORS[status]}`}} />
            <span className="text-slate-300">{label}</span>
          </div>
        ))}
      </div>
      {!selectedCountryId && !highlightCountries && (<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 backdrop-blur-sm text-slate-300 text-xs px-4 py-2 rounded-full border border-slate-600 pointer-events-none">🌍 国をクリックして関係を見る　|　スクロールでズーム</div>)}
    </div>
  );
}

