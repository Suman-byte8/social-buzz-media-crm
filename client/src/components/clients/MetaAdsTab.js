import React from "react";
import PlatformAdsPanel from "@/components/ads/PlatformAdsPanel";

export default function MetaAdsTab({ client }) {
  return <PlatformAdsPanel client={client} platform="meta" />;
}
