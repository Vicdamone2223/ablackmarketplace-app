import { useLocationCtx } from '../context/LocationContext';
import { distanceMiles } from '../helpers/distance';

type Props = {
  lat: number;
  lng: number;
  precision?: number; // default 1 decimal
  prefix?: string;    // e.g., '· ' or ''
};

export default function Distance({ lat, lng, precision = 1, prefix = '' }: Props) {
  const { coords, status } = useLocationCtx();

  if (status === 'denied') return null;            // or return <span>Location off</span>
  if (!coords) return null;                        // still loading / idle

  const miles = distanceMiles(coords.latitude, coords.longitude, lat, lng);
  return <span>{prefix}{miles.toFixed(precision)} mi</span>;
}
