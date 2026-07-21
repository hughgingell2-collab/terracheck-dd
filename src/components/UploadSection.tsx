import React, { useState, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle2, RefreshCw, Layers, ShieldAlert, Key } from "lucide-react";
import { UploadedDocument } from "../types";
import { SAMPLE_ENVIRONMENTAL_REPORT, SAMPLE_NATIVE_TITLE_SEARCH, SAMPLE_MINING_TENEMENT_SEARCH } from "../sampleData";

interface UploadSectionProps {
  documents: UploadedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
  isPipelineRunning: boolean;
  onStartPipeline: () => void;
  onClearAll: () => void;
}

export default function UploadSection({
  documents,
  setDocuments,
  isPipelineRunning,
  onStartPipeline,
  onClearAll,
}: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const newDoc: UploadedDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        content: text,
      };
      setDocuments((prev) => [...prev, newDoc]);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: File) => {
        if (file.name.endsWith(".txt") || file.name.endsWith(".json") || file.type.startsWith("text/")) {
          processFile(file);
        } else {
          // If PDF, for raw prototype simulation we extract content as text representation
          // or advise user on format. Since this is client-side in browser, we read as text.
          processFile(file);
        }
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(processFile);
    }
  };

  const loadSampleESA = () => {
    const sampleDoc: UploadedDocument = {
      id: "doc-sample-phase2",
      name: "Phase_II_ESA_Report_1420_N_Parkway.txt",
      content: SAMPLE_ENVIRONMENTAL_REPORT,
    };
    setDocuments((prev) => {
      if (prev.some((d) => d.id === sampleDoc.id)) return prev;
      return [...prev, sampleDoc];
    });
  };

  const loadSampleNativeTitle = () => {
    const sampleDoc: UploadedDocument = {
      id: "doc-sample-nativetitle",
      name: "NNTT_Native_Title_Search_1420_N_Parkway.txt",
      content: SAMPLE_NATIVE_TITLE_SEARCH,
    };
    setDocuments((prev) => {
      if (prev.some((d) => d.id === sampleDoc.id)) return prev;
      return [...prev, sampleDoc];
    });
  };

  const loadSampleMiningTenement = () => {
    const sampleDoc: UploadedDocument = {
      id: "doc-sample-miningtenement",
      name: "DMP_Mineral_Tenement_Search_1420_N_Parkway.txt",
      content: SAMPLE_MINING_TENEMENT_SEARCH,
    };
    setDocuments((prev) => {
      if (prev.some((d) => d.id === sampleDoc.id)) return prev;
      return [...prev, sampleDoc];
    });
  };

  const loadSampleAll = () => {
    const esa: UploadedDocument = {
      id: "doc-sample-phase2",
      name: "Phase_II_ESA_Report_1420_N_Parkway.txt",
      content: SAMPLE_ENVIRONMENTAL_REPORT,
    };
    const nt: UploadedDocument = {
      id: "doc-sample-nativetitle",
      name: "NNTT_Native_Title_Search_1420_N_Parkway.txt",
      content: SAMPLE_NATIVE_TITLE_SEARCH,
    };
    const mining: UploadedDocument = {
      id: "doc-sample-miningtenement",
      name: "DMP_Mineral_Tenement_Search_1420_N_Parkway.txt",
      content: SAMPLE_MINING_TENEMENT_SEARCH,
    };
    setDocuments([esa, nt, mining]);
  };

  const removeDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-tight text-slate-800 font-sans uppercase">
          1. Site Documents Input
        </h2>
        {documents.length > 0 && (
          <button
            onClick={onClearAll}
            disabled={isPipelineRunning}
            className="text-xs text-rose-500 hover:text-rose-600 transition flex items-center gap-1 font-sans font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Documents
          </button>
        )}
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
          isDragging
            ? "border-slate-800 bg-slate-50/50"
            : "border-slate-200 hover:border-slate-400 bg-white"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept=".txt,.text,.json,.html,.pdf"
        />
        <div className="p-3 bg-slate-50 text-slate-600 rounded-xl mb-3 border border-slate-100 shadow-xs">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-sans font-medium text-slate-700">
          Drag & drop environmental reports or zoning files
        </p>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Supports text, logs, zoning briefs, or raw permit files
        </p>
      </div>

      {/* Sample Loader */}
      {documents.length === 0 && (
        <div className="mt-4 p-5 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider">
              No files ready? Select target due diligence documents
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Click to load individual reports, or load the complete integrated suite for full analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={loadSampleESA}
              type="button"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition text-xs text-left"
            >
              <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">1. ESA Phase II Report</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Contamination & zoning</p>
              </div>
            </button>

            <button
              onClick={loadSampleNativeTitle}
              type="button"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition text-xs text-left"
            >
              <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">2. Native Title Search</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tribunal land claims</p>
              </div>
            </button>

            <button
              onClick={loadSampleMiningTenement}
              type="button"
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition text-xs text-left"
            >
              <Key className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">3. Mining Tenement</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Exploration licence overlap</p>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={loadSampleAll}
              type="button"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-xs font-semibold font-sans shadow-xs"
            >
              Load Sample Site Reports (All 3 Documents)
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="mt-5 space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
            Loaded Files ({documents.length})
          </h3>
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 group hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold font-mono text-slate-700 truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(doc.content.length / 1024).toFixed(1)} KB
                      </span>
                      {doc.classification && (
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700">
                          {doc.classification.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDoc(doc.id);
                  }}
                  disabled={isPipelineRunning}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-white border border-transparent hover:border-slate-100 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-slate-400" />
              <span>Documents staged and ready</span>
            </div>
            <button
              onClick={onStartPipeline}
              disabled={isPipelineRunning}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition text-xs font-semibold font-sans shadow-md flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isPipelineRunning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Running Pipeline...
                </>
              ) : (
                "Run Due Diligence Pipeline"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
