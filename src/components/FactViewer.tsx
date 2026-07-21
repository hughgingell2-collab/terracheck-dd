import { ExtractedFacts, RiskCheck } from "../types";
import { MapPin, Calendar, Users, Home, AlertOctagon, ShieldAlert, CheckCircle, Layers, Hammer } from "lucide-react";

interface FactViewerProps {
  facts?: ExtractedFacts[];
  risks?: RiskCheck[];
}

export default function FactViewer({ facts, risks }: FactViewerProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-100 font-bold";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100 font-bold";
      case "Low":
        return "bg-sky-50 text-sky-700 border-sky-100 font-medium";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100 font-normal";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "High":
        return <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />;
      case "Medium":
        return <AlertOctagon className="h-4.5 w-4.5 text-amber-600" />;
      default:
        return <CheckCircle className="h-4.5 w-4.5 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Risk Ratings Assessment */}
      {risks && risks.length > 0 && (
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans mb-4">
              Agent 3: Risk Checklist Ratings
            </h2>
            <div className="space-y-3">
              {risks.map((risk) => (
                <div
                  key={risk.category}
                  className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-slate-700 font-sans">
                      {risk.category} Assessment
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 border rounded-full ${getSeverityBadge(
                        risk.severity
                      )}`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-1 leading-relaxed">
                    {risk.justification}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extracted Facts Section */}
      {facts && facts.length > 0 && (
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans mb-4">
            Agent 2: Structured Fact Repository
          </h2>

          {facts.map((fact, idx) => (
            <div key={idx} className="space-y-6">
              {/* Header Title */}
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 font-sans">
                  {fact.documentTitle || "Extracted Facts Metadata"}
                </h3>
              </div>

              {/* Bento Grid layout for Facts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Site Address */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 font-sans">Site Addresses / Parcels</h4>
                    <ul className="text-xs text-slate-500 font-sans mt-1 space-y-1">
                      {fact.addresses && fact.addresses.length > 0 ? (
                        fact.addresses.map((addr, i) => <li key={i}>{addr}</li>)
                      ) : (
                        <li className="italic text-slate-400">None detected</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Dates */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 font-sans">Identified Dates</h4>
                    <ul className="text-xs text-slate-500 font-sans mt-1 space-y-1">
                      {fact.dates && fact.dates.length > 0 ? (
                        fact.dates.map((date, i) => <li key={i}>{date}</li>)
                      ) : (
                        <li className="italic text-slate-400">None detected</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Involved Parties */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 font-sans">Involved Parties</h4>
                    <ul className="text-xs text-slate-500 font-sans mt-1 space-y-1">
                      {fact.parties && fact.parties.length > 0 ? (
                        fact.parties.map((party, i) => <li key={i}>{party}</li>)
                      ) : (
                        <li className="italic text-slate-400">None detected</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Zoning Classes */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 shrink-0">
                    <Home className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 font-sans">Zoning Codes & Designations</h4>
                    <ul className="text-xs text-slate-500 font-sans mt-1 space-y-1">
                      {fact.zoningClasses && fact.zoningClasses.length > 0 ? (
                        fact.zoningClasses.map((zc, i) => <li key={i}>{zc}</li>)
                      ) : (
                        <li className="italic text-slate-400">None detected</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sub-lists of Contamination Findings, Compliance, Native Title and Mining Tenements */}
              <div className="space-y-4 pt-2">
                {fact.contaminationFindings && fact.contaminationFindings.length > 0 && (
                  <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/10">
                    <h4 className="text-xs font-bold text-rose-800 font-sans mb-1.5 flex items-center gap-1.5">
                      <AlertOctagon className="h-4 w-4 text-rose-600" />
                      Extracted Contamination Hazards
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 font-sans space-y-1">
                      {fact.contaminationFindings.map((cf, i) => (
                        <li key={i} className="leading-relaxed">{cf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fact.complianceDeadlines && fact.complianceDeadlines.length > 0 && (
                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/10">
                    <h4 className="text-xs font-bold text-amber-800 font-sans mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      Extracted Regulatory Deadlines & Expirations
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 font-sans space-y-1">
                      {fact.complianceDeadlines.map((cd, i) => (
                        <li key={i} className="leading-relaxed">{cd}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fact.nativeTitleClaims && fact.nativeTitleClaims.length > 0 && (
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/10">
                    <h4 className="text-xs font-bold text-indigo-800 font-sans mb-1.5 flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-indigo-600" />
                      Extracted Native Title & Heritage Claims
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 font-sans space-y-1">
                      {fact.nativeTitleClaims.map((ntc, i) => (
                        <li key={i} className="leading-relaxed">{ntc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fact.miningTenements && fact.miningTenements.length > 0 && (
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/10">
                    <h4 className="text-xs font-bold text-emerald-800 font-sans mb-1.5 flex items-center gap-1.5">
                      <Hammer className="h-4 w-4 text-emerald-600" />
                      Extracted Overlapping Mineral Tenements
                    </h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 font-sans space-y-1">
                      {fact.miningTenements.map((mt, i) => (
                        <li key={i} className="leading-relaxed">{mt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
