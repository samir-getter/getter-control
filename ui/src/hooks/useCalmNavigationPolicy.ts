import { useCloudInstance } from "./useCloudInstance";
import { useHiddenSettings } from "./useHiddenSettings";
import type { CalmNavigationPolicy } from "@/lib/calm-navigation";

export function useCalmNavigationPolicy(): CalmNavigationPolicy {
  const { hidden } = useHiddenSettings();
  const cloud = useCloudInstance();
  return { hiddenSettings: hidden, isCloud: Boolean(cloud) };
}
