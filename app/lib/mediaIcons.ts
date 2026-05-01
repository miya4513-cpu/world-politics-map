export const getMediaIcon = (mediaName: string): string => {
  const mediaIcons: { [key: string]: string } = {
    'BBC': '🇬🇧',
    'Reuters': '📰',
    'Al Jazeera': '🌍',
    'CNN': '🇺🇸',
    'The New York Times': '🗽',
    'Le Monde': '🇫🇷',
    'DW': '🇩🇪',
    'RT': '🇷🇺'
  };
  
  return mediaIcons[mediaName] || '📺';
};
