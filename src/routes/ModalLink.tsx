import { Link, useLocation, type LinkProps } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';

type ModalLinkProps = Omit<LinkProps, 'state'> & {
  children: ReactNode;
  state?: LinkProps['state'];
};

/**
 * React Router link for URL-addressable modal destinations.
 * Keeps the first background location when moving between modal routes, so
 * nested modal navigation does not replace the page underneath the overlay.
 */
export default function ModalLink({ to, state, onClick, children, ...props }: ModalLinkProps) {
  const location = useLocation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
  };

  const existingState = (location.state && typeof location.state === 'object')
    ? location.state as Record<string, unknown>
    : {};
  const backgroundLocation = (existingState.backgroundLocation as typeof location | undefined) || location;

  return (
    <Link
      {...props}
      to={to}
      state={{ ...existingState, ...(state && typeof state === 'object' ? state as object : {}), backgroundLocation }}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
