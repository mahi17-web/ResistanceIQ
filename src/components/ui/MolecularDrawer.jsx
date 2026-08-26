import { useState, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  Trash2,
  Plus,
  Circle,
  Hexagon,
  Minus,
  CheckCircle2,
  AlertCircle,
  Move,
  Eraser,
} from 'lucide-react';

const ELEMENTS = [
  { symbol: 'C', name: 'Carbon', color: '#0BDFA0', valence: 4 },
  { symbol: 'N', name: 'Nitrogen', color: '#8B8CF8', valence: 3 },
  { symbol: 'O', name: 'Oxygen', color: '#F3B14D', valence: 2 },
  { symbol: 'S', name: 'Sulfur', color: '#FACC15', valence: 2 },
  { symbol: 'P', name: 'Phosphorus', color: '#FB923C', valence: 3 },
  { symbol: 'Cl', name: 'Chlorine', color: '#4ADE80', valence: 1 },
  { symbol: 'F', name: 'Fluorine', color: '#38BDF8', valence: 1 },
  { symbol: 'Br', name: 'Bromine', color: '#E85D7A', valence: 1 },
  { symbol: 'I', name: 'Iodine', color: '#A855F7', valence: 1 },
  { symbol: 'H', name: 'Hydrogen', color: '#94A3B8', valence: 1 },
];

const BOND_TYPES = [
  { id: 'single', label: 'Single (−)', order: 1 },
  { id: 'double', label: 'Double (=)', order: 2 },
  { id: 'triple', label: 'Triple (≡)', order: 3 },
  { id: 'wedge', label: 'Wedge (▲)', order: 1, stereo: 'wedge' },
  { id: 'hash', label: 'Hash (▤)', order: 1, stereo: 'hash' },
];

const RING_TEMPLATES = [
  { id: 'benzene', name: 'Benzene Ring', size: 6, aromatic: true, hetero: [] },
  { id: 'cyclohexane', name: 'Cyclohexane', size: 6, aromatic: false, hetero: [] },
  { id: 'cyclopentane', name: 'Cyclopentane', size: 5, aromatic: false, hetero: [] },
  { id: 'pyridine', name: 'Pyridine', size: 6, aromatic: true, hetero: [{ index: 0, symbol: 'N' }] },
  { id: 'imidazole', name: 'Imidazole', size: 5, aromatic: true, hetero: [{ index: 0, symbol: 'N' }, { index: 2, symbol: 'N' }] },
];

const SCAFFOLD_PRESETS = [
  {
    name: 'Pyridine Core (Neonicotinoid Precursor)',
    smiles: 'c1ccncc1Cl',
    atoms: [
      { id: 0, symbol: 'N', x: 180, y: 130, charge: 0 },
      { id: 1, symbol: 'C', x: 220, y: 155, charge: 0 },
      { id: 2, symbol: 'C', x: 220, y: 205, charge: 0 },
      { id: 3, symbol: 'C', x: 180, y: 230, charge: 0 },
      { id: 4, symbol: 'C', x: 140, y: 205, charge: 0 },
      { id: 5, symbol: 'C', x: 140, y: 155, charge: 0 },
      { id: 6, symbol: 'Cl', x: 260, y: 130, charge: 0 },
    ],
    bonds: [
      { source: 0, target: 1, order: 1.5 },
      { source: 1, target: 2, order: 1.5 },
      { source: 2, target: 3, order: 1.5 },
      { source: 3, target: 4, order: 1.5 },
      { source: 4, target: 5, order: 1.5 },
      { source: 5, target: 0, order: 1.5 },
      { source: 1, target: 6, order: 1 },
    ],
  },
  {
    name: 'Organophosphate Core',
    smiles: 'P(=O)(OC)(OC)SC',
    atoms: [
      { id: 0, symbol: 'P', x: 180, y: 180, charge: 0 },
      { id: 1, symbol: 'O', x: 180, y: 130, charge: 0 },
      { id: 2, symbol: 'O', x: 130, y: 180, charge: 0 },
      { id: 3, symbol: 'O', x: 230, y: 180, charge: 0 },
      { id: 4, symbol: 'S', x: 180, y: 230, charge: 0 },
      { id: 5, symbol: 'C', x: 90, y: 180, charge: 0 },
      { id: 6, symbol: 'C', x: 270, y: 180, charge: 0 },
      { id: 7, symbol: 'C', x: 180, y: 270, charge: 0 },
    ],
    bonds: [
      { source: 0, target: 1, order: 2 },
      { source: 0, target: 2, order: 1 },
      { source: 0, target: 3, order: 1 },
      { source: 0, target: 4, order: 1 },
      { source: 2, target: 5, order: 1 },
      { source: 3, target: 6, order: 1 },
      { source: 4, target: 7, order: 1 },
    ],
  },
];

export default function MolecularDrawer({ onStructureGenerated }) {
  const canvasRef = useRef(null);
  const [atoms, setAtoms] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [history, setHistory] = useState([]);

  // Active Tools
  const [activeTool, setActiveTool] = useState('atom'); // 'atom' | 'bond' | 'ring' | 'move' | 'eraser' | 'charge'
  const [selectedElement, setSelectedElement] = useState('C');
  const [selectedBondType, setSelectedBondType] = useState('single');
  const [selectedRing, setSelectedRing] = useState('benzene');
  const [selectedCharge, setSelectedCharge] = useState(1);

  // Interaction State
  const [draggingAtomId, setDraggingAtomId] = useState(null);
  const [bondStartAtomId, setBondStartAtomId] = useState(null);
  const [hoveredAtomId, setHoveredAtomId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Status & Validation
  const [statusMessage, setStatusMessage] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Save history state
  function pushHistory() {
    setHistory((prev) => [...prev.slice(-10), { atoms: JSON.stringify(atoms), bonds: JSON.stringify(bonds) }]);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setAtoms(JSON.parse(last.atoms));
    setBonds(JSON.parse(last.bonds));
  }

  function handleClear() {
    pushHistory();
    setAtoms([]);
    setBonds([]);
    setStatusMessage(null);
  }

  function loadPreset(preset) {
    pushHistory();
    setAtoms(preset.atoms);
    setBonds(preset.bonds);
    setStatusMessage({ type: 'info', text: `Loaded scaffold: ${preset.name}` });
  }

  // Get canvas coordinates from event
  function getCanvasCoords(e) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  }

  // Find atom near coordinates
  function findAtomAt(x, y, threshold = 22) {
    for (let i = atoms.length - 1; i >= 0; i--) {
      const a = atoms[i];
      const dist = Math.hypot(a.x - x, a.y - y);
      if (dist <= threshold) return a;
    }
    return null;
  }

  // Handle Canvas Click
  function handleCanvasMouseDown(e) {
    const { x, y } = getCanvasCoords(e);
    const targetAtom = findAtomAt(x, y);

    if (activeTool === 'eraser') {
      if (targetAtom) {
        pushHistory();
        setAtoms((prev) => prev.filter((a) => a.id !== targetAtom.id));
        setBonds((prev) => prev.filter((b) => b.source !== targetAtom.id && b.target !== targetAtom.id));
      }
      return;
    }

    if (activeTool === 'move') {
      if (targetAtom) {
        setDraggingAtomId(targetAtom.id);
      }
      return;
    }

    if (activeTool === 'charge') {
      if (targetAtom) {
        pushHistory();
        setAtoms((prev) =>
          prev.map((a) =>
            a.id === targetAtom.id ? { ...a, charge: a.charge === selectedCharge ? 0 : selectedCharge } : a
          )
        );
      }
      return;
    }

    if (activeTool === 'atom') {
      if (targetAtom) {
        // Change element of existing atom
        pushHistory();
        setAtoms((prev) =>
          prev.map((a) => (a.id === targetAtom.id ? { ...a, symbol: selectedElement } : a))
        );
      } else {
        // Create new atom
        pushHistory();
        const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
        const newAtom = {
          id: newId,
          symbol: selectedElement,
          x,
          y,
          charge: 0,
        };
        setAtoms((prev) => [...prev, newAtom]);
      }
      return;
    }

    if (activeTool === 'bond') {
      if (targetAtom) {
        setBondStartAtomId(targetAtom.id);
      } else {
        // Create atom and start bond from it
        pushHistory();
        const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
        const newAtom = { id: newId, symbol: selectedElement, x, y, charge: 0 };
        setAtoms((prev) => [...prev, newAtom]);
        setBondStartAtomId(newId);
      }
      return;
    }

    if (activeTool === 'ring') {
      pushHistory();
      addRingTemplate(x, y, targetAtom);
    }
  }

  function handleCanvasMouseMove(e) {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    const targetAtom = findAtomAt(x, y);
    setHoveredAtomId(targetAtom ? targetAtom.id : null);

    if (draggingAtomId !== null) {
      setAtoms((prev) =>
        prev.map((a) => (a.id === draggingAtomId ? { ...a, x, y } : a))
      );
    }
  }

  function handleCanvasMouseUp(e) {
    if (draggingAtomId !== null) {
      setDraggingAtomId(null);
    }

    if (bondStartAtomId !== null) {
      const { x, y } = getCanvasCoords(e);
      let targetAtom = findAtomAt(x, y);

      if (!targetAtom && Math.hypot(x - mousePos.x, y - mousePos.y) < 100) {
        // Drop on empty space: create atom and connect
        const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;
        targetAtom = { id: newId, symbol: selectedElement, x, y, charge: 0 };
        setAtoms((prev) => [...prev, targetAtom]);
      }

      if (targetAtom && targetAtom.id !== bondStartAtomId) {
        pushHistory();
        const bondOrder =
          selectedBondType === 'double' ? 2 : selectedBondType === 'triple' ? 3 : 1;

        // Check if bond already exists
        const exists = bonds.some(
          (b) =>
            (b.source === bondStartAtomId && b.target === targetAtom.id) ||
            (b.source === targetAtom.id && b.target === bondStartAtomId)
        );

        if (exists) {
          // Cycle bond order
          setBonds((prev) =>
            prev.map((b) => {
              if (
                (b.source === bondStartAtomId && b.target === targetAtom.id) ||
                (b.source === targetAtom.id && b.target === bondStartAtomId)
              ) {
                const nextOrder = b.order === 1 ? 2 : b.order === 2 ? 3 : 1;
                return { ...b, order: nextOrder };
              }
              return b;
            })
          );
        } else {
          setBonds((prev) => [
            ...prev,
            {
              source: bondStartAtomId,
              target: targetAtom.id,
              order: bondOrder,
              stereo: selectedBondType === 'wedge' ? 'wedge' : selectedBondType === 'hash' ? 'hash' : null,
            },
          ]);
        }
      }

      setBondStartAtomId(null);
    }
  }

  // Add Regular Ring Polygon
  function addRingTemplate(centerX, centerY, attachAtom = null) {
    const ring = RING_TEMPLATES.find((r) => r.id === selectedRing) || RING_TEMPLATES[0];
    const n = ring.size;
    const radius = 42;
    const startId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 0;

    const newAtoms = [];
    const newBonds = [];

    for (let i = 0; i < n; i++) {
      if (i === 0 && attachAtom) {
        // Reuse attached atom as vertex 0
        newAtoms.push(attachAtom);
        continue;
      }
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));

      const hetero = ring.hetero.find((h) => h.index === i);
      const symbol = hetero ? hetero.symbol : 'C';

      newAtoms.push({
        id: startId + i,
        symbol,
        x,
        y,
        charge: 0,
      });
    }

    // Connect ring bonds
    for (let i = 0; i < n; i++) {
      const u = newAtoms[i].id;
      const v = newAtoms[(i + 1) % n].id;
      const isDouble = ring.aromatic && i % 2 === 0;
      newBonds.push({
        source: u,
        target: v,
        order: isDouble ? 2 : 1,
      });
    }

    const createdAtoms = newAtoms.filter((a) => a.id >= startId);
    setAtoms((prev) => [...prev, ...createdAtoms]);
    setBonds((prev) => [...prev, ...newBonds]);
  }

  // Convert Drawn Graph to Standardized SMILES
  function convertGraphToSmiles() {
    if (atoms.length === 0) return '';

    // Build simple adjacency list
    const adj = {};
    atoms.forEach((a) => {
      adj[a.id] = [];
    });
    bonds.forEach((b) => {
      adj[b.source]?.push({ target: b.target, order: b.order });
      adj[b.target]?.push({ target: b.source, order: b.order });
    });

    // Simple DFS tree traversal with ring closure detection
    const visited = new Set();
    const ringNumbers = {};
    let nextRingNum = 1;
    let smilesStr = '';

    function dfs(u, parent = null) {
      visited.add(u);
      const atom = atoms.find((a) => a.id === u);
      if (!atom) return;

      let atomSym = atom.symbol;
      if (atom.charge > 0) atomSym = `[${atomSym}+]`;
      else if (atom.charge < 0) atomSym = `[${atomSym}-]`;

      smilesStr += atomSym;

      const neighbors = adj[u] || [];
      const unvisited = [];

      neighbors.forEach(({ target, order }) => {
        if (target === parent) return;
        if (visited.has(target)) {
          // Ring closure
          const key = [Math.min(u, target), Math.max(u, target)].join('-');
          if (!ringNumbers[key]) {
            ringNumbers[key] = nextRingNum++;
            smilesStr += ringNumbers[key];
          } else {
            smilesStr += ringNumbers[key];
          }
        } else {
          unvisited.push({ target, order });
        }
      });

      unvisited.forEach(({ target, order }, idx) => {
        const isBranch = idx < unvisited.length - 1;
        const bondSymbol = order === 2 ? '=' : order === 3 ? '#' : '';

        if (isBranch) smilesStr += '(';
        smilesStr += bondSymbol;
        dfs(target, u);
        if (isBranch) smilesStr += ')';
      });
    }

    // Traverse all disconnected components
    atoms.forEach((a) => {
      if (!visited.has(a.id)) {
        if (smilesStr.length > 0) smilesStr += '.';
        dfs(a.id);
      }
    });

    return smilesStr;
  }

  // Trigger Structure Validation & Generation
  async function handleGenerateStructure() {
    if (atoms.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please draw at least one atom.' });
      return;
    }

    setIsValidating(true);
    setStatusMessage(null);

    const generatedSmiles = convertGraphToSmiles();

    try {
      if (onStructureGenerated) {
        await onStructureGenerated(generatedSmiles);
      }
      setStatusMessage({ type: 'success', text: 'Structure validated and standardized successfully!' });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Structure could not be interpreted. Please check valences and bonds.',
      });
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        background: 'var(--bg-deep, #05070B)',
        borderRadius: 14,
        border: '1px solid var(--line, rgba(255,255,255,0.08))',
        padding: 16,
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 12,
        }}
      >
        {/* Tool Mode Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'atom', label: 'Atom', icon: Circle },
            { id: 'bond', label: 'Bond', icon: Minus },
            { id: 'ring', label: 'Ring', icon: Hexagon },
            { id: 'move', label: 'Move', icon: Move },
            { id: 'charge', label: 'Charge (±)', icon: Plus },
            { id: 'eraser', label: 'Eraser', icon: Eraser },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTool(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: isActive ? 'rgba(11,223,160,0.15)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--teal, #0BDFA0)' : '#CBD5E1',
                  border: isActive ? '1px solid var(--teal, #0BDFA0)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Undo, Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11,
              background: 'rgba(255,255,255,0.04)',
              color: history.length === 0 ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: history.length === 0 ? 'default' : 'pointer',
            }}
            title="Undo last action"
          >
            <RotateCcw size={12} />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 11,
              background: 'rgba(244,63,94,0.08)',
              color: '#F43F5E',
              border: '1px solid rgba(244,63,94,0.2)',
              cursor: 'pointer',
            }}
            title="Clear canvas"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Sub-Toolbars depending on active mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Elements Palette */}
        {activeTool === 'atom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginRight: 4 }}>Element:</span>
            {ELEMENTS.map((elem) => {
              const isSelected = selectedElement === elem.symbol;
              return (
                <button
                  key={elem.symbol}
                  type="button"
                  onClick={() => setSelectedElement(elem.symbol)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    background: isSelected ? 'rgba(11,223,160,0.2)' : 'rgba(255,255,255,0.03)',
                    color: elem.color,
                    border: isSelected ? `1.5px solid ${elem.color}` : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  {elem.symbol}
                </button>
              );
            })}
          </div>
        )}

        {/* Bond Types */}
        {activeTool === 'bond' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginRight: 4 }}>Bond Order:</span>
            {BOND_TYPES.map((b) => {
              const isSelected = selectedBondType === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBondType(b.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    background: isSelected ? 'rgba(139,140,248,0.2)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#8B8CF8' : '#CBD5E1',
                    border: isSelected ? '1.5px solid #8B8CF8' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Ring Templates */}
        {activeTool === 'ring' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginRight: 4 }}>Ring Template:</span>
            {RING_TEMPLATES.map((r) => {
              const isSelected = selectedRing === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRing(r.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    background: isSelected ? 'rgba(243,177,77,0.2)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#F3B14D' : '#CBD5E1',
                    border: isSelected ? '1.5px solid #F3B14D' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Charge Toggle */}
        {activeTool === 'charge' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)', marginRight: 4 }}>Charge:</span>
            <button
              type="button"
              onClick={() => setSelectedCharge(1)}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 700,
                background: selectedCharge === 1 ? 'rgba(11,223,160,0.2)' : 'rgba(255,255,255,0.03)',
                color: '#0BDFA0',
                border: selectedCharge === 1 ? '1.5px solid #0BDFA0' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              +1 Positive
            </button>
            <button
              type="button"
              onClick={() => setSelectedCharge(-1)}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 700,
                background: selectedCharge === -1 ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.03)',
                color: '#F43F5E',
                border: selectedCharge === -1 ? '1.5px solid #F43F5E' : '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}
            >
              −1 Negative
            </button>
          </div>
        )}

        {/* Presets dropdown */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)' }}>Quick Scaffold:</span>
          {SCAFFOLD_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(p)}
              style={{
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--teal, #0BDFA0)',
                border: '1px solid rgba(11,223,160,0.2)',
                cursor: 'pointer',
              }}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG / Canvas Drawing Area */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{
          width: '100%',
          height: 280,
          background: '#070A0F',
          borderRadius: 10,
          border: '1px dashed rgba(255,255,255,0.12)',
          position: 'relative',
          cursor:
            activeTool === 'move'
              ? 'grab'
              : activeTool === 'eraser'
              ? 'crosshair'
              : 'pointer',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Helper Hint */}
        {atoms.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              opacity: 0.5,
            }}
          >
            <Hexagon size={32} style={{ margin: '0 auto 8px', color: 'var(--teal, #0BDFA0)' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>
              Click to place atoms, drag to draw bonds, or select a Ring template
            </p>
            <p style={{ fontSize: 10, color: 'var(--ink-4, #7C8A9A)', marginTop: 2 }}>
              No SMILES required · Fully interactive visual chemical editor
            </p>
          </div>
        )}

        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Bonds */}
          {bonds.map((bond, idx) => {
            const s = atoms.find((a) => a.id === bond.source);
            const t = atoms.find((a) => a.id === bond.target);
            if (!s || !t) return null;

            return (
              <g key={`bond-${idx}`}>
                {bond.order === 2 ? (
                  <>
                    <line
                      x1={s.x - 2}
                      y1={s.y - 2}
                      x2={t.x - 2}
                      y2={t.y - 2}
                      stroke="rgba(11,223,160,0.5)"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <line
                      x1={s.x + 2}
                      y1={s.y + 2}
                      x2={t.x + 2}
                      y2={t.y + 2}
                      stroke="rgba(11,223,160,0.5)"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </>
                ) : bond.order === 3 ? (
                  <>
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="rgba(11,223,160,0.7)" strokeWidth={4} />
                    <line x1={s.x - 3} y1={s.y - 3} x2={t.x - 3} y2={t.y - 3} stroke="rgba(11,223,160,0.4)" strokeWidth={1.5} />
                    <line x1={s.x + 3} y1={s.y + 3} x2={t.x + 3} y2={t.y + 3} stroke="rgba(11,223,160,0.4)" strokeWidth={1.5} />
                  </>
                ) : (
                  <line
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke="rgba(11,223,160,0.45)"
                    strokeWidth={bond.stereo ? 3.5 : 2}
                    strokeDasharray={bond.stereo === 'hash' ? '3 3' : undefined}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {/* Active Bond Drag Line */}
          {bondStartAtomId !== null && (
            (() => {
              const startAtom = atoms.find((a) => a.id === bondStartAtomId);
              if (!startAtom) return null;
              return (
                <line
                  x1={startAtom.x}
                  y1={startAtom.y}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="var(--teal, #0BDFA0)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              );
            })()
          )}

          {/* Atoms */}
          {atoms.map((atom) => {
            const isHovered = hoveredAtomId === atom.id;
            const elemInfo = ELEMENTS.find((e) => e.symbol === atom.symbol) || { color: '#0BDFA0' };

            return (
              <g key={`atom-${atom.id}`}>
                <circle
                  cx={atom.x}
                  cy={atom.y}
                  r={atom.symbol === 'C' ? 12 : 14}
                  fill="#0B1017"
                  stroke={isHovered ? '#FFFFFF' : elemInfo.color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
                <text
                  x={atom.x}
                  y={atom.y + 3.5}
                  textAnchor="middle"
                  fill={elemInfo.color}
                  fontSize={atom.symbol.length > 1 ? 9 : 11}
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                  style={{ pointerEvents: 'none' }}
                >
                  {atom.symbol}
                </text>
                {atom.charge !== 0 && (
                  <text
                    x={atom.x + 8}
                    y={atom.y - 7}
                    fill={atom.charge > 0 ? '#0BDFA0' : '#F43F5E'}
                    fontSize={10}
                    fontWeight="800"
                  >
                    {atom.charge > 0 ? '+' : '−'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background:
              statusMessage.type === 'error'
                ? 'rgba(244,63,94,0.1)'
                : statusMessage.type === 'success'
                ? 'rgba(11,223,160,0.1)'
                : 'rgba(139,140,248,0.1)',
            border:
              statusMessage.type === 'error'
                ? '1px solid rgba(244,63,94,0.3)'
                : statusMessage.type === 'success'
                ? '1px solid rgba(11,223,160,0.3)'
                : '1px solid rgba(139,140,248,0.3)',
            fontSize: 12,
            color:
              statusMessage.type === 'error'
                ? '#F43F5E'
                : statusMessage.type === 'success'
                ? '#0BDFA0'
                : '#8B8CF8',
          }}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle size={14} />
          ) : (
            <CheckCircle2 size={14} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-4, #7C8A9A)' }}>
          {atoms.length} atoms · {bonds.length} bonds drawn
        </span>
        <button
          type="button"
          disabled={atoms.length === 0 || isValidating}
          onClick={handleGenerateStructure}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 6,
            background: 'var(--teal, #0BDFA0)',
            color: '#05070B',
            fontWeight: 700,
            fontSize: 12,
            cursor: atoms.length === 0 || isValidating ? 'default' : 'pointer',
          }}
        >
          <Sparkles size={14} />
          <span>{isValidating ? 'Standardizing Structure...' : 'Convert & Standardize Molecule'}</span>
        </button>
      </div>
    </div>
  );
}
