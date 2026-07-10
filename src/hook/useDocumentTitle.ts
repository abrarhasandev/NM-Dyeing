import { useEffect, useRef } from "react";

/**
 * Custom hook to dynamically update the document title.
 * @param title The title to set. If empty, the default Next.js metadata title will be preserved.
 * @param retainOnUnmount If false, restores the previous title when the component unmounts.
 */
export function useDocumentTitle(title: string, retainOnUnmount: boolean = false) {
  const defaultTitle = useRef<string | null>(null);

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== "undefined") {
      if (!defaultTitle.current) {
        defaultTitle.current = document.title;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && title) {
      document.title = `${title} | NM`;
    }

    return () => {
      if (!retainOnUnmount && defaultTitle.current) {
        document.title = defaultTitle.current;
      }
    };
  }, [title, retainOnUnmount]);
}
