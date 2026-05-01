export const RELATION_STATUS = {
  hostile: { label: '敵対', color: '#E53935', lineColor: '#E53935' },
  tension: { label: '対立', color: '#FB8C00', lineColor: '#FB8C00' },
  friendly: { label: '友好', color: '#43A047', lineColor: '#43A047' },
  alliance: { label: '同盟', color: '#1E88E5', lineColor: '#1E88E5' },
} as const;

export const REGIONS = [
  '東アジア', '東南アジア', '南アジア', '中東', 
  '西欧', '東欧', '北米', '中南米', 'アフリカ', 'オセアニア'
] as const;

export const REGION_COLORS: Record<string, string> = {
  '東アジア': 'bg-blue-100 text-blue-800',
  '西欧': 'bg-purple-100 text-purple-800',
  '東欧': 'bg-indigo-100 text-indigo-800',
  '北米': 'bg-red-100 text-red-800',
  '中南米': 'bg-yellow-100 text-yellow-800',
  '中東': 'bg-green-100 text-green-800',
  '南アジア': 'bg-orange-100 text-orange-800',
  'アフリカ': 'bg-gray-100 text-gray-800',
  'オセアニア': 'bg-teal-100 text-teal-800',
};
