import { Zap, ShieldCheck, Code2, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-black/80 backdrop-blur-2xl mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-300 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </div>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Electra AI <span className="text-neutral-500 font-mono text-xs font-normal">PRO</span>
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed font-normal">
              Autonomous energy copilot and microgrid operating system. Optimizes rooftop solar, BESS storage, and dynamic tariff arbitrage with millisecond precision.
            </p>
            <div className="flex items-center gap-5 text-xs font-mono text-neutral-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Frequency: 50.00 Hz
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                Latency: 8ms
              </span>
            </div>
          </div>

          {/* Protocols */}
          <div className="space-y-3 font-mono text-xs">
            <p className="font-semibold text-neutral-200 uppercase tracking-widest text-[11px]">
              Protocols &amp; Standards
            </p>
            <ul className="space-y-2 text-neutral-400">
              <li>IEEE 2030.5 Smart Energy</li>
              <li>OpenADR 2.0b Dynamic Demand</li>
              <li>SunSpec Modbus Smart Inverters</li>
              <li>ISO 15118 EV V2G Bidirectional</li>
            </ul>
          </div>

          {/* Security & Resilience */}
          <div className="space-y-3 font-mono text-xs">
            <p className="font-semibold text-neutral-200 uppercase tracking-widest text-[11px]">
              Security &amp; Hardware
            </p>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Secure Enclave Telemetry
              </li>
              <li>Edge Inference Architecture</li>
              <li>IEC 62443 Certified Cyber Defense</li>
              <li>&lt;16ms Seamless Grid Islanding</li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-mono gap-4">
          <p>© 2026 Electra AI Energy Intelligence. Designed with Apple Pro precision.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" /> Microgrid API
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">All Microgrid Telemetry Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
