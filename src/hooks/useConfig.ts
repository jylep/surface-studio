import { fetchAndActivate, getValue, Value } from "firebase/remote-config";
import { useCallback, useEffect, useState } from "react"
import { remoteConfig } from "../utils/firebase";


export const useConfig = (configName: string) => {

  const [config, setConfig] = useState<Value | undefined>(undefined);

  const fetchConfig = useCallback(async () => {
    await fetchAndActivate(remoteConfig);
    setConfig(getValue(remoteConfig, configName));
  }, [remoteConfig, configName]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return config;
}