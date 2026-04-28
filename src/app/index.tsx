import { Redirect } from "expo-router";

import { useAppStore } from "@/store/app.store";

export default function Index() {
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  return <Redirect href={hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding"} />;
}
