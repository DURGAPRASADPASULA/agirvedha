import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react';

interface WeatherIconProps {
  icon: 'sun' | 'partly_cloudy' | 'rain' | 'cloud' | 'storm';
  className?: string;
}

export function WeatherIcon({ icon, className = 'w-6 h-6' }: WeatherIconProps) {
  switch (icon) {
    case 'sun':
      return <Sun className={`${className} text-[#B45309]`} aria-hidden="true" />;
    case 'partly_cloudy':
      return <CloudSun className={`${className} text-[#A16207]`} aria-hidden="true" />;
    case 'rain':
      return <CloudRain className={`${className} text-[#1B5E3A]`} aria-hidden="true" />;
    case 'storm':
      return <CloudLightning className={`${className} text-[#6B4423]`} aria-hidden="true" />;
    case 'cloud':
    default:
      return <Cloud className={`${className} text-[#4D574B]`} aria-hidden="true" />;
  }
}
