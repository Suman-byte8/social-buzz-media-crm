import React from "react";
import PlatformAdsPanel from "@/components/ads/PlatformAdsPanel";

export default function AdsTab({ client }) {
  return <PlatformAdsPanel client={client} platform="google_ads" />;
}
