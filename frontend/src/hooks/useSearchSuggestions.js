import { useState, useEffect } from 'react';
import { videoApi } from '../api/client';

export default function useSearchSuggestions(query, delay = 250) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await videoApi.suggest(q, controller.signal);
        setSuggestions(res.data || []);
      } catch (err) {
        if (err.code !== 'ERR_CANCELED' && err.name !== 'CanceledError') {
          setSuggestions([]);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay]);

  return suggestions;
}