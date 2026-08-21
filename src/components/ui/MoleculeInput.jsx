import { useState, useRef } from 'react';
import { Upload, X, Info } from 'lucide-react';
import clsx from 'clsx';

// Very basic SMILES validity check (non-empty, only valid chars)
function validateSmiles(smiles) {
  if (!smiles?.trim()) return null;
  const valid = /^[A-Za-z0-9@+\-[\]()=#$%./\\:]+$/.test(smiles.trim());
  return valid ? 'valid' : 'invalid';
}

/**
 * Molecule input component with SMILES editor + file drag-drop zone.
 * @param {{ value: string, onChange: (val: string) => void, onFileUpload?: (file: File) => void }} props
 */
export default function MoleculeInput({ value, onChange, onFileUpload }) {
  const [mode, setMode]         = useState('smiles'); // 'smiles' | 'file'
  const [isDragging, setDrag]   = useState(false);
  const [uploadedFile, setFile] = useState(null);
  const fileRef                 = useRef(null);

  const validity = validateSmiles(value);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setFile(file); onFileUpload?.(file); }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg p-1 w-fit">
        {[['smiles', 'SMILES String'], ['file', 'Upload File']].map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              mode === m ? 'bg-[rgba(16,217,160,0.15)] text-[#10d9a0]' : 'text-[#64748b] hover:text-[#f0f4ff]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'smiles' ? (
        /* ── SMILES textarea ── */
        <div className="space-y-1.5">
          <div className="relative">
            <textarea
              id="smiles-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. CC1=CC(=C(C=C1)Cl)NC(=O)C2=CC=C(C=C2)OCC3=CC=CC=C3"
              className={clsx(
                'input input-mono resize-none h-20 pr-8 leading-relaxed',
                validity === 'valid'   && 'border-[#10d9a0] focus:border-[#10d9a0]',
                validity === 'invalid' && 'border-[#f43f5e] focus:border-[#f43f5e]',
              )}
              spellCheck={false}
              autoCorrect="off"
            />
            {value && (
              <button
                type="button"
                aria-label="Clear SMILES input"
                onClick={() => onChange('')}
                className="absolute top-2 right-2 text-[#64748b] hover:text-[#f0f4ff]"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {validity === 'valid'   && <span className="text-[11px] text-[#10d9a0] font-medium">✓ Valid SMILES format</span>}
            {validity === 'invalid' && <span className="text-[11px] text-[#f43f5e] font-medium">⚠ Invalid characters detected</span>}
          </div>
          {/* Quick examples */}
          <div className="flex items-start gap-2 mt-1">
            <Info size={11} className="text-[#334155] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#64748b] leading-relaxed">
              Enter a canonical or isomeric SMILES string. Accepted formats: RDKit, OpenBabel, ChemDraw.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <p className="text-[10px] text-[#334155] w-full font-medium">Quick examples:</p>
            {[
              { label: 'BW-2241', smiles: 'CC1=CC(=C(C=C1)Cl)NC(=O)C2=CC=C(C=C2)OCC3=CC=CC=C3' },
              { label: 'BW-3109', smiles: 'C1=CC=C(C=C1)C(=O)NC2=CC(=CC(=C2)Cl)C(F)(F)F' },
            ].map(({ label, smiles }) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange(smiles)}
                className="text-[10px] px-2 py-1 rounded bg-[rgba(99,102,241,0.12)] text-[#6366f1] border border-[rgba(99,102,241,0.2)] hover:bg-[rgba(99,102,241,0.2)] transition-colors font-mono"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── File drop zone ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all',
            isDragging
              ? 'border-[#10d9a0] bg-[rgba(16,217,160,0.06)]'
              : uploadedFile
              ? 'border-[rgba(16,217,160,0.4)] bg-[rgba(16,217,160,0.04)]'
              : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)]',
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".mol,.sdf,.mol2,.pdb"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); onFileUpload?.(f); } }}
          />
          {uploadedFile ? (
            <>
              <div className="w-10 h-10 rounded-full bg-[rgba(16,217,160,0.15)] flex items-center justify-center">
                <Upload size={18} className="text-[#10d9a0]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#10d9a0]">{uploadedFile.name}</p>
                <p className="text-xs text-[#64748b]">{(uploadedFile.size / 1024).toFixed(1)} KB · Click to replace</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
                <Upload size={18} className="text-[#64748b]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#f0f4ff]">Drop structure file here</p>
                <p className="text-xs text-[#64748b] mt-1">Accepts .mol, .sdf, .mol2, .pdb</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
