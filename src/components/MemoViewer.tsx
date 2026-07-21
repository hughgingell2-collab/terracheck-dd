import { useState } from "react";
import { DueDiligenceMemo, MemoFinding } from "../types";
import { Scale, MessageSquare, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

interface MemoViewerProps {
  memo: DueDiligenceMemo;
  isRefining: string | null; // Keeps track of finding ID being refined
  onRefineFinding: (findingId: string, feedback: string) => Promise<void>;
}

export default function MemoViewer({ memo, isRefining, onRefineFinding }: MemoViewerProps) {
  const [feedbackInputs, setFeedbackInputs] = useState<{ [key: string]: string }>({});
  const [activeRefineId, setActiveRefineId] = useState<string | null>(null);
  const [refineErrors, setRefineErrors] = useState<{ [key: string]: string }>({});

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "High":
        return {
          badge: "bg-rose-50 text-rose-800 border-rose-200",
          border: "border-l-4 border-l-rose-500",
          icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
        };
      case "Medium":
        return {
          badge: "bg-amber-50 text-amber-800 border-amber-200",
          border: "border-l-4 border-l-amber-500",
          icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
        };
      case "Low":
        return {
          badge: "bg-sky-50 text-sky-800 border-sky-200",
          border: "border-l-4 border-l-sky-500",
          icon: <ShieldCheck className="h-4 w-4 text-sky-600" />,
        };
      default:
        return {
          badge: "bg-slate-50 text-slate-700 border-slate-200",
          border: "border-l-4 border-l-slate-400",
          icon: <CheckCircle2 className="h-4 w-4 text-slate-500" />,
        };
    }
  };

  const handleTextChange = (findingId: string, text: string) => {
    setFeedbackInputs((prev) => ({ ...prev, [findingId]: text }));
  };

  const submitRefine = async (findingId: string) => {
    const feedback = feedbackInputs[findingId];
    if (!feedback || !feedback.trim()) return;

    try {
      setRefineErrors((prev) => ({ ...prev, [findingId]: "" }));
      await onRefineFinding(findingId, feedback);
      // Clear feedback input and close refine view on success
      setFeedbackInputs((prev) => ({ ...prev, [findingId]: "" }));
      setActiveRefineId(null);
    } catch (err: any) {
      setRefineErrors((prev) => ({
        ...prev,
        [findingId]: err.message || "An error occurred during refinement. Please check your Gemini API key or try again.",
      }));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-8 font-sans">
      {/* Memo Header */}
      <div className="border-b-2 border-slate-900 pb-6">
        <div className="flex items-center gap-2 text-slate-900 font-mono text-xs uppercase tracking-wider font-bold mb-3">
          <Scale className="h-4 w-4" />
          <span>CONFIDENTIAL LEGAL WORK PRODUCT</span>
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
          ENVIRONMENTAL &amp; PLANNING DUE DILIGENCE MEMORANDUM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-6 text-xs text-slate-600 font-mono">
          <div>
            <span className="font-bold text-slate-900">TO:</span> Principal Counsel / Deal Team
          </div>
          <div>
            <span className="font-bold text-slate-900">DATE:</span> {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div>
            <span className="font-bold text-slate-900">FROM:</span> TerraCheck Pipeline Agent (Sync Engine)
          </div>
          <div>
            <span className="font-bold text-slate-900">SUBJECT:</span> Due Diligence Risk Assessment &amp; Compliance Memo
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-slate-50/70 rounded-xl border border-slate-100 p-5 md:p-6">
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Executive Summary
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed font-sans font-medium">
          {memo.executiveSummary}
        </p>
      </div>

      {/* Detailed Risk Findings */}
      <div className="space-y-6">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Individual Flagged Risk Findings
        </h3>

        <div className="space-y-6">
          {memo.findings.map((finding) => {
            const styles = getSeverityStyles(finding.severity);
            const isThisRefining = isRefining === finding.id;

            return (
              <div
                key={finding.id}
                className={`p-5 md:p-6 rounded-xl border border-slate-100 bg-white transition shadow-xs hover:shadow-sm ${styles.border}`}
              >
                {/* Title and Category Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {finding.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 font-sans tracking-tight mt-0.5">
                      {finding.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {styles.icon}
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 border rounded-full ${styles.badge}`}>
                      {finding.severity} Risk
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="text-sm text-slate-700 leading-relaxed space-y-4 font-sans mt-3">
                  <p>{finding.explanation}</p>
                </div>

                {/* VERBATIM CITED SOURCE QUOTE (Our main core differentiator!) */}
                <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-slate-300" />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    <span>Source Document: {finding.citationDocument || "Staged Report"}</span>
                    <span className="text-slate-400">Verbatim Citation</span>
                  </div>
                  <blockquote className="text-xs text-slate-600 font-mono italic leading-relaxed pl-1">
                    "{finding.citationQuote}"
                  </blockquote>
                </div>

                {/* Mitigation Recommendation */}
                <div className="mt-4 p-4 rounded-lg bg-emerald-50/30 border border-emerald-50 text-xs text-slate-700">
                  <span className="font-bold text-emerald-800 uppercase font-mono tracking-wider text-[10px] block mb-1">
                    Mitigation / Recommended Action
                  </span>
                  <p className="leading-relaxed font-sans">{finding.mitigation}</p>
                </div>

                {/* Refinement Panel */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  {activeRefineId !== finding.id ? (
                    <button
                      onClick={() => setActiveRefineId(finding.id)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-950 flex items-center gap-1.5 transition self-start"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Suggest revision or inject counsel feedback
                    </button>
                  ) : (
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-slate-500" />
                          Self-Evolving Feedback Chamber
                        </label>
                        <button
                          onClick={() => setActiveRefineId(null)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-sans"
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        Re-run this finding step in isolation. Direct feedback will be compiled and sent to the
                        Refinement Agent to evolve the output without re-running the full pipeline.
                      </p>

                      <textarea
                        value={feedbackInputs[finding.id] || ""}
                        onChange={(e) => handleTextChange(finding.id, e.target.value)}
                        placeholder="e.g., 'Blue Horizon filed an emergency appeal with the state DEP; therefore the fine of $4,500 is currently frozen and not overdue. Adjust explanation and severity.'"
                        rows={2}
                        className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white placeholder-slate-400 font-sans leading-relaxed"
                      />

                      {/* Error banner removed as requested */}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => submitRefine(finding.id)}
                          disabled={isThisRefining || !feedbackInputs[finding.id]?.trim()}
                          className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold font-sans flex items-center gap-1.5 transition shadow-xs"
                        >
                          {isThisRefining ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Refining Finding...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Re-run Agent Step
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
