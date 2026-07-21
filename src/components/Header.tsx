import { ShieldCheck, Scale, Cpu } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-sans font-semibold tracking-tight text-slate-900">TerraCheck</h1>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-1 max-w-2xl leading-relaxed">
              AI due diligence for environmental & land-use risk — required in nearly
              every commercial property transaction, currently billed as associate
              hours. TerraCheck does the first pass in minutes, with every finding
              cited to its source.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 self-start md:self-auto">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <span>4 Independent Agents</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-slate-400" />
            <span>Traceable Legal-Grade Citations</span>
          </div>
        </div>
      </div>
    </header>
  );
}
