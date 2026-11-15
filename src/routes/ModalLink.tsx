import { Link, useLocation, type LinkProps } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';

type ModalLinkProps = Omit<LinkProps, 'state'> & {
  children: ReactNode;
  state?: LinkProps['state'];
  /** Set false to navigate to the destination as a standalone page. Defaults to modal navigation. */
  modal?: boolean;
};

/**
 * URL-addressable link that opens over the current route by default.
 * Set modal={false} when the destination should render as a full page.
 */
export default function ModalLink({ to, state, onClick, children, modal = true, ...props }: ModalLinkProps) {
  const location = useLocation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
  };

  const existingState = (location.state && typeof location.state === 'object')
    ? location.state as Record<string, unknown>
    : {};
  const backgroundLocation = (existingState.backgroundLocation as typeof location | undefined) || location;
  const navigationState: Record<string, unknown> = {
    ...existingState,
    ...(state && typeof state === 'object' ? state as object : {}),
  };
  if (modal) navigationState.backgroundLocation = backgroundLocation;
  else delete navigationState.backgroundLocation;

  return (
    <Link
      {...props}
      to={to}
      state={Object.keys(navigationState).length ? navigationState : null}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
