import { useCallback } from "react";

export function useExtensionStorage() {
  const storageAvailable =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  const setItem = useCallback(
    (key: string, value: unknown) => {
      if (storageAvailable) {
        chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    [storageAvailable]
  );

  const getItem = useCallback(
    (key: string): Promise<unknown> =>
      new Promise((resolve) => {
        if (storageAvailable) {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
              console.warn("Storage error:", chrome.runtime.lastError);
              resolve(null);
            } else {
              resolve(result[key]);
            }
          });
        } else {
          const item = localStorage.getItem(key);
          resolve(item ? JSON.parse(item) : null);
        }
      }),
    [storageAvailable]
  );

  const removeItem = useCallback(
    (key: string) => {
      if (storageAvailable) {
        chrome.storage.local.remove(key);
      } else {
        localStorage.removeItem(key);
      }
    },
    [storageAvailable]
  );

  const clear = useCallback(() => {
    if (storageAvailable) {
      chrome.storage.local.clear();
    } else {
      localStorage.clear();
    }
  }, [storageAvailable]);

  return {
    setItem,
    getItem,
    removeItem,
    clear,
  };
}
