import React, { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  Search,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Server,
  Cpu,
  HardDrive,
} from 'lucide-react';

interface LMStudioStatus {
  connected: boolean;
  baseUrl?: string;
  configuredModel?: string;
  modelLoaded?: boolean;
  availableModels?: string[];
  error?: string;
}

const STEPS = [
  {
    num: 1,
    icon: Download,
    title: 'Download LM Studio',
    description: 'LM Studio is a free desktop app for running AI models locally on your computer.',
    detail: 'Visit lmstudio.ai and download the version for your operating system (Windows, Mac, or Linux). It\'s free and runs entirely offline once set up.',
    action: {
      label: 'Download LM Studio',
      href: 'https://lmstudio.ai',
    },
    tip: 'LM Studio is about 300MB to download. Requires Windows 10+, macOS 12+, or Ubuntu 22+.',
  },
  {
    num: 2,
    icon: Search,
    title: 'Find & Download Gemma 4',
    description: 'Inside LM Studio, search for the Gemma 4 model and download it.',
    detail: 'Open LM Studio → click the Search icon (magnifying glass) in the left sidebar → type "gemma-4-e2b" in the search bar → click Download next to "google/gemma-4-e2b" (Q4_K_M version recommended — best balance of speed and quality).',
    tip: 'The model file is about 4.4 GB. Make sure you have enough disk space and a stable internet connection for the download.',
    code: 'google/gemma-4-e2b',
  },
  {
    num: 3,
    icon: Monitor,
    title: 'Load the Model',
    description: 'Once downloaded, load Gemma 4 into memory so it\'s ready to use.',
    detail: 'In LM Studio → click "My Models" in the left sidebar → find "google/gemma-4-e2b" → click Load. Wait for it to show "READY" status.',
    tip: 'Loading takes 30–60 seconds. Once loaded, the model stays in memory until you eject it. Recommended: 8GB+ RAM for best performance.',
  },
  {
    num: 4,
    icon: Play,
    title: 'Start the Local Server',
    description: 'Turn on LM Studio\'s local server so this app can talk to the model.',
    detail: 'In LM Studio → click "Developer" (</> icon) in the left sidebar → find the "Local Server" section → click the green toggle to turn it ON. You should see "Status: Running" and the address http://127.0.0.1:1234.',
    tip: 'Keep LM Studio open while using this app. The server stops when you close LM Studio.',
  },
  {
    num: 5,
    icon: CheckCircle2,
    title: 'You\'re Ready',
    description: 'Come back here and check your connection below. Then go to New Ledger and start analyzing vendor notes.',
    detail: 'Use the "Check Connection" button below to verify everything is working. If the status shows Connected and Model Loaded, you\'re all set to run fully local AI-powered bookkeeping.',
    tip: 'The first analysis takes longer (30–120 seconds) as the model warms up. Subsequent ones are faster.',
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-stone-700 hover:bg-stone-600 text-stone-200 transition-all cursor-pointer"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export const SetupGuide: React.FC = () => {
  const [status, setStatus] = useState<LMStudioStatus | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkConnection() {
    setChecking(true);
    try {
      const res = await fetch('/api/lm-studio-status');
      if (!res.ok) {
        setStatus({
          connected: false,
          error: `App server returned ${res.status}. Restart the dev server (npm run dev) and try again.`,
        });
        setChecking(false);
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        connected: false,
        error: 'Could not reach the app server. Make sure you have restarted npm run dev after recent changes.',
      });
    }
    setChecking(false);
  }

  useEffect(() => {
    checkConnection();
  }, []);

  const isFullyReady = status?.connected && status?.modelLoaded;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-950 text-stone-100 rounded-2xl p-6 border border-emerald-800/80">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 shrink-0">
            <Cpu className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-100">Run Gemma 4 Locally</h2>
            <p className="text-sm text-emerald-200/80 mt-1">
              This app uses <strong>Gemma 4 E2B</strong> — Google's powerful AI model running entirely on your own computer via LM Studio. Your vendor data never leaves your device.
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-300/80">
                <HardDrive className="w-3.5 h-3.5" /> 4.4 GB model size
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300/80">
                <Cpu className="w-3.5 h-3.5" /> 8 GB RAM recommended
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300/80">
                <WifiOff className="w-3.5 h-3.5" /> 100% offline after setup
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className={`rounded-2xl border p-5 space-y-4 ${
        isFullyReady
          ? 'bg-emerald-50 border-emerald-300'
          : status?.connected
          ? 'bg-emerald-50 border-emerald-300'
          : 'bg-rose-50 border-rose-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checking ? (
              <Loader2 className="w-5 h-5 text-stone-500 animate-spin" />
            ) : isFullyReady ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : status?.connected ? (
              <AlertTriangle className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
            <div>
              <p className="font-bold text-sm text-stone-900">
                {checking
                  ? 'Checking connection...'
                  : isFullyReady
                  ? 'Connected & Ready'
                  : status?.connected
                  ? 'LM Studio Connected — Model Not Loaded'
                  : 'LM Studio Not Detected'}
              </p>
              {status && !checking && (
                <p className="text-xs text-stone-600 mt-0.5">
                  {isFullyReady
                    ? `Model "${status.configuredModel}" is loaded and ready.`
                    : status.connected
                    ? `Connected to ${status.baseUrl} but "${status.configuredModel}" is not loaded. Load the model in LM Studio.`
                    : status.error || 'Make sure LM Studio is open and the local server is running.'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={checkConnection}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            Check Connection
          </button>
        </div>

        {/* Status details grid */}
        {status && !checking && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-200/60">
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-500 uppercase">Server URL</p>
              <p className="text-xs font-bold text-stone-800 mt-0.5 font-mono">{status.baseUrl || 'http://127.0.0.1:1234/v1'}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-500 uppercase">Configured Model</p>
              <p className="text-xs font-bold text-stone-800 mt-0.5 font-mono truncate">{status.configuredModel || 'google/gemma-4-e2b'}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-500 uppercase">Model Status</p>
              <p className={`text-xs font-bold mt-0.5 ${status.modelLoaded ? 'text-emerald-700' : status.connected ? 'text-emerald-700' : 'text-rose-600'}`}>
                {status.modelLoaded ? 'Loaded & Ready' : status.connected ? 'Not Loaded' : 'Unreachable'}
              </p>
            </div>
          </div>
        )}

        {/* Available models if connected */}
        {status?.connected && (status.availableModels?.length ?? 0) > 0 && (
          <div className="bg-white/70 rounded-xl p-3">
            <p className="text-[10px] font-bold text-stone-500 uppercase mb-1.5">Models Currently Loaded in LM Studio</p>
            <div className="flex flex-wrap gap-2">
              {status.availableModels!.map((m) => (
                <span
                  key={m}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono ${
                    m === status.configuredModel
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {m === status.configuredModel && <span className="mr-1">✓</span>}
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step-by-step Guide */}
      <div className="space-y-4">
        <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-700" />
          Setup Instructions
        </h3>

        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === STEPS.length - 1;
          return (
            <div key={step.num} className="flex gap-4">
              {/* Step connector */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                  isLast && isFullyReady
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {isLast && isFullyReady ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 bg-stone-200 mt-2 mb-0 min-h-4" />
                )}
              </div>

              {/* Step content */}
              <div className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 flex-1 space-y-3 ${idx < STEPS.length - 1 ? 'mb-0' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                    <Icon className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">{step.title}</h4>
                    <p className="text-xs text-stone-600 mt-0.5">{step.description}</p>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 rounded-xl p-3 border border-stone-100">
                  {step.detail}
                </p>

                {step.code && (
                  <div className="flex items-center gap-2 bg-stone-900 rounded-xl px-3 py-2.5">
                    <Terminal className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <code className="text-xs text-emerald-400 font-mono flex-1">{step.code}</code>
                    <CopyButton text={step.code} />
                  </div>
                )}

                {step.action && (
                  <a
                    href={step.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {step.action.label}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="flex items-start gap-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{step.tip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Requirements */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-700" />
          Minimum System Requirements
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'RAM', value: '8 GB minimum', good: '16 GB recommended', icon: Cpu },
            { label: 'Disk Space', value: '6 GB free', good: '10 GB recommended', icon: HardDrive },
            { label: 'OS', value: 'Windows 10+', good: 'macOS 12+ / Ubuntu 22+', icon: Monitor },
          ].map((req) => {
            const Icon = req.icon;
            return (
              <div key={req.label} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">{req.label}</span>
                </div>
                <p className="text-sm font-black text-stone-900">{req.value}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">{req.good}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-500 border-t border-stone-100 pt-3">
          GPU acceleration (NVIDIA/AMD) will significantly speed up analysis. Without a GPU, analysis may take 1–3 minutes per ledger on CPU-only mode.
        </p>
      </div>

    </div>
  );
};
