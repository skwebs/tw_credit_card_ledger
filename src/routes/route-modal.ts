import type { Location, NavigateFunction } from 'react-router-dom';

/** Open a URL-addressable route as an overlay while retaining the original page underneath. */
export function openRouteModal(navigate: NavigateFunction, location: Location, to: string) {
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation || location;
  navigate(to, { state: { backgroundLocation } });
}
