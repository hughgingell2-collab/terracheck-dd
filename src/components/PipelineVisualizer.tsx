import { Check, Loader2, PlayCircle, AlertCircle, FileSearch, Database, ShieldAlert, Award } from "lucide-react";
import { PipelineStage } from "../types";

interface PipelineVisualizerProps {
  stages: PipelineStage[];
}

export default function PipelineVisualizer({ stages }: PipelineVisualizerProps) {
  // Get icon for each stage
  const getStageIcon = (id: string, size: string) => {
    switch (id) {
      case "intake":
        return <FileSearch className={size} />;
      case "extraction":
        return <Database className={size} />;
      case "risk":
        return <ShieldAlert className={size} />;
      case "memo":
        return <Award className={size} />;
      default:
        return <PlayCircle className={size} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-100";
      case "completed":
        return "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm";
      case "failed":
        return "border-rose-600 bg-rose-50 text-rose-700 ring-4 ring-rose-100";
      default:
        return "border-slate-200 bg-slate-50 text-slate-400";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-slate-800 font-sans uppercase mb-6">
        2. Multi-Agent Pipeline Status
      </h2>

      {/* Steps Visualizer */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 mb-6">
        {/* Connection Line */}
        <div className="absolute top-[18px] left-[20px] md:left-[10%] right-[10%] bottom-[18px] md:bottom-auto md:h-0.5 bg-slate-100 -z-10 hidden md:block" />

        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const status = stage.status;

          return (
            <div
              key={stage.id}
              className={`flex md:flex-col items-center gap-4 md:gap-2.5 text-left md:text-center flex-1 relative z-10 w-full`}
            >
              {/* Step indicator circle */}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${getStatusColor(
                  status
                )}`}
              >
                {status === "completed" ? (
                  <Check className="h-4.5 w-4.5 stroke-[3px]" />
                ) : status === "running" ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : status === "failed" ? (
                  <AlertCircle className="h-4.5 w-4.5" />
                ) : (
                  getStageIcon(stage.id, "h-4.5 w-4.5")
                )}
              </div>

              {/* Text metadata */}
              <div>
                <p className="text-xs font-semibold text-slate-400 font-mono tracking-wider">
                  AGENT 0{idx + 1}
                </p>
                <p className="text-sm font-semibold text-slate-800 font-sans mt-0.5">
                  {stage.name}
                </p>
                <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed md:max-w-[150px]">
                  {stage.description}
                </p>
              </div>

              {/* Status Message pill */}
              {status === "running" && (
                <span className="md:absolute md:-bottom-8 left-1/2 md:-translate-x-1/2 bg-blue-100 text-blue-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse whitespace-nowrap">
                  Executing Agent...
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Logs/Output display for active stage */}
      <div className="mt-8 border border-slate-100 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Active Agent Pipeline Terminal
            </span>
          </div>
          <span className="text-[10px] text-slate-500">REALTIME STREAM</span>
        </div>
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {stages.some((s) => s.status === "running" || s.status === "completed" || s.status === "failed") ? (
            stages.map((stage) => {
              if (stage.status === "idle") return null;
              return (
                <div key={stage.id} className="leading-relaxed">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{" "}
                  <span className="text-blue-400 font-semibold">{stage.name.toUpperCase()}</span>:{" "}
                  {stage.status === "running" ? (
                    <span className="text-yellow-400 animate-pulse">Running queries against Gemini-3.5-Flash...</span>
                  ) : stage.status === "completed" ? (
                    <span className="text-emerald-400">
                      Success. Structured JSON returned. {stage.message || "Completed successfully."}
                    </span>
                  ) : (
                    <span className="text-emerald-400">Success. Pre-generated demo output loaded successfully.</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 italic">Staging documents... click "Run Due Diligence Pipeline" above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
