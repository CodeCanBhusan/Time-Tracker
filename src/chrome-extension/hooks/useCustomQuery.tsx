import { useEffect, useState, useCallback } from "react";
import axios, { AxiosError } from "axios";

type UseCustomQueryOptions = {
  lazy?: boolean;
  immediateUrl?: string;
};

type UseCustomQueryResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: AxiosError | null;
  refetch: (customUrl?: string) => Promise<void>;
};

const useCustomQuery = <T = unknown,>(
  url: string,
  options: UseCustomQueryOptions = {}
): UseCustomQueryResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.lazy);
  const [error, setError] = useState<AxiosError | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    options.immediateUrl || url
  );

  const fetchData = useCallback(
    async (fetchUrl?: string) => {
      const finalUrl = fetchUrl || currentUrl;
      if (!finalUrl?.trim()) return;

      setIsLoading(true);
      setError(null);

      const controller = new AbortController();

      try {
        const response = await axios.get<T>(finalUrl, {
          signal: controller.signal,
        });
        setData(response.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err);
        } else {
          setError(new AxiosError("An unknown error occurred"));
        }
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUrl]
  );

  const refetch = useCallback(
    async (customUrl?: string) => {
      if (customUrl) setCurrentUrl(customUrl);
      await fetchData(customUrl);
    },
    [fetchData]
  );

  useEffect(() => {
    if (!options.lazy) {
      fetchData(currentUrl);
    }
  }, [currentUrl, fetchData, options.lazy]);

  return { data, isLoading, error, refetch };
};

export default useCustomQuery;
