import { useMemo } from "react";
import { VegaLite } from "react-vega";

interface VegaChartProps {
  spec: Record<string, unknown>;
  height?: number;
}

const darkConfig = {
  background: "transparent",
  config: {
    axis: {
      labelColor: "#8C8E9C",
      titleColor: "#8C8E9C",
      gridColor: "#2D303D",
      domainColor: "#2D303D",
      tickColor: "#2D303D",
      labelFont: "DM Sans",
      titleFont: "Manrope",
    },
    legend: {
      labelColor: "#8C8E9C",
      titleColor: "#8C8E9C",
      labelFont: "DM Sans",
      titleFont: "Manrope",
    },
    title: { color: "#E6E7EC", font: "Manrope" },
    view: { stroke: "transparent" },
    range: {
      category: ["#9B9CF8", "#7DD3A8", "#F0C38E", "#E88B8B", "#7EB8E5", "#B39DDB"],
    },
  },
} as const;

export function VegaChart({ spec, height }: VegaChartProps) {
  const merged = useMemo(() => {
    const next: Record<string, unknown> = { ...spec, ...darkConfig };
    if (height !== undefined) next.height = height;
    return next;
  }, [spec, height]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <VegaLite
        spec={merged as never}
        actions={false}
        renderer="svg"
        style={{ width: "100%" }}
      />
    </div>
  );
}
