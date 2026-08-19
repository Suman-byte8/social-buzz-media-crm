import React, { useEffect, useState } from "react";
import MetricCard from "../ui/MetricCard";

const DUMMY_METRICS = [
  { id: 1, title: "Active Clients", value: 42, change: "+3 this month", icon: "domain" },
  { id: 2, title: "MRR", value: "$128k", change: "12%", changeType: "positive", icon: "payments" },
  { id: 3, title: "Out. Invoices", value: "$24.5k", change: "4 Overdue", changeType: "negative", icon: "receipt_long" },
  { id: 4, title: "Active Google Ads", value: 156, change: "All Healthy", icon: "ads_click" },
  { id: 5, title: "Active Meta Camp.", value: 89, change: "$12k/day spend", icon: "campaign" },
];

export default function MetricsGrid({ metrics = DUMMY_METRICS, className }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-stack-sm md:gap-stack-md">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          changeType={metric.changeType || "positive"}
          icon={metric.icon}
        />
      ))}
    </div>
  );
}

// Hook for fetching metrics (to be replaced with actual API calls)
export function useMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/dashboard/metrics');
        // const data = await response.json();
        setMetrics(DUMMY_METRICS);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
}