import { CheckCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const PIPELINE_STAGES = [
  { key: 'preparing',     label: 'Candidate Preparation',    sub: 'Validating chemical SMILES & metadata' },
  { key: 'featurization', label: 'Molecular Featurization',  sub: '1,024-bit Morgan ECFP4 + RDKit descriptors' },
  { key: 'inference',     label: 'Model Inference',          sub: 'Calibrated Ridge / GBRT resistance scoring' },
  { key: 'calibration',   label: 'Conformal Uncertainty',    sub: 'Split conformal coverage & OOD detection' },
  { key: 'complete',      label: 'Dossier Persistence',      sub: 'Persisting forecast record' },
];

const PHASE_INDEX = { idle: -1, preparing: 0, featurization: 1, inference: 2, calibration: 3, complete: 4, error: -1 };

/**
 * Shows multi-step pipeline progress for an async forecast job.
 * @param {{ phase: string, progress: number, currentStep: string, error?: string }} pipelineState
 */
export default function JobStatusPoller({ pipelineState }) {
  const { phase, progress, currentStep, error } = pipelineState;
  const activeIdx = PHASE_INDEX[phase] ?? -1;
  const isDone = phase === 'complete';
  const isError = phase === 'error';

  if (phase === 'idle') return null;

  return (
    <div className="glass rounded-xl p-5 space-y-5">
      {/* Overall progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-[#f0f4ff]">
            {isDone ? 'Pipeline Complete' : isError ? 'Pipeline Error' : 'Running ML Pipeline…'}
          </p>
          <span className={clsx('text-sm font-bold', isDone ? 'text-[#10d9a0]' : isError ? 'text-[#f43f5e]' : 'text-[#f0f4ff]')}>
            {progress}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: isError
                ? '#f43f5e'
                : isDone
                ? '#10d9a0'
                : 'linear-gradient(90deg, #10d9a0, #6366f1)',
            }}
          />
        </div>
        {currentStep && (
          <p className="text-xs text-[#64748b] mt-1.5">{currentStep}</p>
        )}
        {isError && error && (
          <p className="text-xs text-[#f43f5e] mt-1">{error}</p>
        )}
      </div>

      {/* Stage indicators */}
      <div className="space-y-2">
        {PIPELINE_STAGES.map(({ key, label, sub }, i) => {
          const done    = i < activeIdx || isDone;
          const active  = i === activeIdx && !isDone;
          const pending = i > activeIdx && !isDone;

          return (
            <div
              key={key}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                done   && 'bg-[rgba(16,217,160,0.06)]',
                active && 'bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)]',
                pending && 'opacity-40',
              )}
            >
              <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                done   ? 'bg-[rgba(16,217,160,0.2)]' : active ? 'bg-[rgba(99,102,241,0.2)]' : 'bg-[rgba(255,255,255,0.06)]'
              )}>
                {done
                  ? <CheckCircle size={12} className="text-[#10d9a0]" />
                  : active
                  ? <Loader2 size={11} className="text-[#6366f1] animate-spin" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-[#334155]" />
                }
              </div>
              <div className="min-w-0">
                <p className={clsx('text-xs font-semibold leading-tight',
                  done ? 'text-[#10d9a0]' : active ? 'text-[#f0f4ff]' : 'text-[#64748b]'
                )}>{label}</p>
                <p className="text-[10px] text-[#334155] truncate">{sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
