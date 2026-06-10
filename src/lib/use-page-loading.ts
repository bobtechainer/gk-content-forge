import { useEffect, useState } from "react";

/**
 * Returns true for a brief window after mount so pages can show a skeleton /
 * logo loader on every navigation, per the Content Studio v2 spec.
 */
export function usePageLoading(ms = 350): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return loading;
}
