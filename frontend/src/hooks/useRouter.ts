import { useState, useEffect, useCallback } from 'react';

export function useRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
  }, []);

  const matchPath = useCallback(
    (pattern: string) => path === pattern || path.startsWith(pattern + '/'),
    [path]
  );

  return { path, navigate, matchPath };
}
