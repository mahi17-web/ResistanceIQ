/**
 * ResistanceIQ — Deterministic SMILES Chemical Structure Parser & 2D Molecular Graph Engine
 *
 * Implements:
 * 1. Lexical tokenizer for standard SMILES (aliphatic, aromatic, bracket atoms, charges, rings, branches).
 * 2. Chemical graph reconstruction (atoms, bonds, ring closures, valence & implicit hydrogen calculation).
 * 3. 2D Coordinate Layout Generator (branching angles, regular ring polygons, and spring-repulsion relaxation).
 * 4. Formula & Molecular Weight Calculator.
 */

// Atomic numbers & standard atomic weights
export const ELEMENT_DATA = {
  H:  { weight: 1.008,   valence: 1, color: '#94A3B8' },
  C:  { weight: 12.011,  valence: 4, color: '#0BDFA0' },
  N:  { weight: 14.007,  valence: 3, color: '#8B8CF8' },
  O:  { weight: 15.999,  valence: 2, color: '#F3B14D' },
  F:  { weight: 18.998,  valence: 1, color: '#38BDF8' },
  P:  { weight: 30.974,  valence: 3, color: '#FB923C' },
  S:  { weight: 32.065,  valence: 2, color: '#FACC15' },
  Cl: { weight: 35.453,  valence: 1, color: '#4ADE80' },
  Br: { weight: 79.904,  valence: 1, color: '#E85D7A' },
  I:  { weight: 126.904, valence: 1, color: '#A855F7' },
  B:  { weight: 10.811,  valence: 3, color: '#F472B6' },
  Si: { weight: 28.085,  valence: 4, color: '#64748B' },
};

/**
 * Parses a SMILES string into an validated molecular graph.
 * @param {string} smiles
 * @returns {{ valid: boolean, error?: string, atoms?: Array, bonds?: Array, atomCounts?: Record<string, number>, formula?: string, molecularWeight?: number }}
 */
export function parseSmiles(smiles) {
  if (!smiles || typeof smiles !== 'string' || !smiles.trim()) {
    return { valid: false, error: 'Empty molecular structure' };
  }

  const raw = smiles.trim();
  const atoms = [];
  const bonds = [];
  const branchStack = [];
  const ringOpenings = {}; // ringNumber -> { atomIndex, bondOrder }
  
  let currentAtomIndex = null;
  let nextBondOrder = 1;
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const ch = raw[i];

    // Branching open
    if (ch === '(') {
      if (currentAtomIndex === null) {
        return { valid: false, error: 'Invalid branch start in SMILES' };
      }
      branchStack.push(currentAtomIndex);
      i++;
      continue;
    }

    // Branching close
    if (ch === ')') {
      if (branchStack.length === 0) {
        return { valid: false, error: 'Unmatched closing parenthesis in SMILES' };
      }
      currentAtomIndex = branchStack.pop();
      i++;
      continue;
    }

    // Explicit bond symbols
    if (ch === '-') {
      nextBondOrder = 1;
      i++;
      continue;
    }
    if (ch === '=') {
      nextBondOrder = 2;
      i++;
      continue;
    }
    if (ch === '#') {
      nextBondOrder = 3;
      i++;
      continue;
    }
    if (ch === ':') {
      nextBondOrder = 1.5;
      i++;
      continue;
    }
    if (ch === '/' || ch === '\\') {
      // Stereochemical bond designation (treat as single bond for 2D connectivity)
      nextBondOrder = 1;
      i++;
      continue;
    }
    if (ch === '.') {
      // Disconnected component
      currentAtomIndex = null;
      i++;
      continue;
    }

    // Ring closures (1-9 or %10-%99)
    if (/\d/.test(ch) || ch === '%') {
      let ringNum;
      if (ch === '%') {
        if (i + 2 < len && /\d{2}/.test(raw.slice(i + 1, i + 3))) {
          ringNum = parseInt(raw.slice(i + 1, i + 3), 10);
          i += 3;
        } else {
          return { valid: false, error: 'Invalid two-digit ring closure syntax' };
        }
      } else {
        ringNum = parseInt(ch, 10);
        i++;
      }

      if (currentAtomIndex === null) {
        return { valid: false, error: 'Ring closure without preceding atom' };
      }

      if (ringOpenings[ringNum] !== undefined) {
        const opening = ringOpenings[ringNum];
        bonds.push({
          source: opening.atomIndex,
          target: currentAtomIndex,
          order: Math.max(opening.bondOrder, nextBondOrder),
          isRing: true,
        });
        delete ringOpenings[ringNum];
      } else {
        ringOpenings[ringNum] = {
          atomIndex: currentAtomIndex,
          bondOrder: nextBondOrder,
        };
      }
      nextBondOrder = 1;
      continue;
    }

    // Bracket atom: e.g. [C@@H], [O-], [NH4+], [Fe+2]
    if (ch === '[') {
      const closeIdx = raw.indexOf(']', i);
      if (closeIdx === -1) {
        return { valid: false, error: 'Unclosed bracket atom in SMILES' };
      }
      const bracketContent = raw.slice(i + 1, closeIdx);
      const match = bracketContent.match(/^([0-9]*)([A-Za-z][a-z]?)(@+)?(H[0-9]*)?([+-][0-9]*)?/);
      if (!match) {
        return { valid: false, error: `Invalid bracket atom format: [${bracketContent}]` };
      }

      const isotope = match[1] || null;
      let symbol = match[2];
      const isAromatic = symbol === symbol.toLowerCase();
      symbol = symbol.toUpperCase();
      const chargeStr = match[5] || '';
      let charge = 0;
      if (chargeStr === '+') charge = 1;
      else if (chargeStr === '-') charge = -1;
      else if (chargeStr.startsWith('+')) charge = parseInt(chargeStr.slice(1), 10) || 1;
      else if (chargeStr.startsWith('-')) charge = -(parseInt(chargeStr.slice(1), 10) || 1);

      const atomId = atoms.length;
      const elementInfo = ELEMENT_DATA[symbol] || { weight: 12.0, valence: 4, color: '#94A3B8' };
      
      const newAtom = {
        id: atomId,
        symbol: symbol,
        element: symbol,
        aromatic: isAromatic,
        charge,
        isotope,
        color: elementInfo.color,
        explicitH: match[4] ? (parseInt(match[4].slice(1), 10) || 1) : 0,
      };
      atoms.push(newAtom);

      if (currentAtomIndex !== null) {
        bonds.push({
          source: currentAtomIndex,
          target: atomId,
          order: nextBondOrder,
        });
      }

      currentAtomIndex = atomId;
      nextBondOrder = 1;
      i = closeIdx + 1;
      continue;
    }

    // Organic subset atom (unbracketed)
    // Match two-letter symbols first: Cl, Br
    let symbol;
    let isAromatic = false;

    if (raw.slice(i, i + 2) === 'Cl') {
      symbol = 'Cl';
      i += 2;
    } else if (raw.slice(i, i + 2) === 'Br') {
      symbol = 'Br';
      i += 2;
    } else if (raw.slice(i, i + 2) === 'Si') {
      symbol = 'Si';
      i += 2;
    } else if (/^[BCNOFPSIbcnops]/.test(ch)) {
      if (ch === ch.toLowerCase()) {
        isAromatic = true;
        symbol = ch.toUpperCase();
      } else {
        symbol = ch;
      }
      i++;
    } else {
      return { valid: false, error: `Invalid character in SMILES structure: '${ch}'` };
    }

    const atomId = atoms.length;
    const elementInfo = ELEMENT_DATA[symbol] || { weight: 12.0, valence: 4, color: '#94A3B8' };

    atoms.push({
      id: atomId,
      symbol: symbol,
      element: symbol,
      aromatic: isAromatic,
      charge: 0,
      color: elementInfo.color,
      explicitH: null,
    });

    if (currentAtomIndex !== null) {
      bonds.push({
        source: currentAtomIndex,
        target: atomId,
        order: isAromatic ? 1.5 : nextBondOrder,
      });
    }

    currentAtomIndex = atomId;
    nextBondOrder = 1;
  }

  // Check unclosed branch parentheses
  if (branchStack.length > 0) {
    return { valid: false, error: 'Unclosed branch in SMILES structure' };
  }

  // Check unclosed ring openings
  const unclosedRings = Object.keys(ringOpenings);
  if (unclosedRings.length > 0) {
    return { valid: false, error: `Unclosed ring numbering in SMILES: ${unclosedRings.join(', ')}` };
  }

  if (atoms.length === 0) {
    return { valid: false, error: 'No atoms found in chemical structure' };
  }

  // Compute implicit hydrogens & formula
  const atomCounts = {};
  let totalImplicitH = 0;

  atoms.forEach((atom) => {
    atomCounts[atom.symbol] = (atomCounts[atom.symbol] || 0) + 1;

    if (atom.explicitH !== null && atom.explicitH !== undefined) {
      totalImplicitH += atom.explicitH;
      atom.implicitH = atom.explicitH;
    } else {
      // Calculate valence from attached bonds
      const bondedOrder = bonds
        .filter((b) => b.source === atom.id || b.target === atom.id)
        .reduce((sum, b) => sum + (b.order === 1.5 ? 1.5 : b.order), 0);

      const standardValence = ELEMENT_DATA[atom.symbol]?.valence ?? 4;
      const targetValence = atom.aromatic ? 3 : standardValence;
      const implicitH = Math.max(0, Math.round(targetValence - bondedOrder + atom.charge));
      atom.implicitH = implicitH;
      totalImplicitH += implicitH;
    }
  });

  if (totalImplicitH > 0) {
    atomCounts['H'] = totalImplicitH;
  }

  // Generate Hill system molecular formula: C first, then H, then alphabetical
  let formula = '';
  if (atomCounts['C']) {
    formula += `C${atomCounts['C'] > 1 ? atomCounts['C'] : ''}`;
  }
  if (atomCounts['H']) {
    formula += `H${atomCounts['H'] > 1 ? atomCounts['H'] : ''}`;
  }
  Object.keys(atomCounts)
    .filter((k) => k !== 'C' && k !== 'H')
    .sort()
    .forEach((k) => {
      formula += `${k}${atomCounts[k] > 1 ? atomCounts[k] : ''}`;
    });

  // Calculate estimated molecular weight
  let molecularWeight = 0;
  Object.entries(atomCounts).forEach(([elem, count]) => {
    const w = ELEMENT_DATA[elem]?.weight || 12.0;
    molecularWeight += w * count;
  });

  // Generate 2D Layout Coordinates
  generate2DCoordinates(atoms, bonds);

  return {
    valid: true,
    atoms,
    bonds,
    atomCounts,
    formula,
    molecularWeight: Math.round(molecularWeight * 100) / 100,
  };
}

/**
 * Computes deterministic 2D screen coordinates for atoms using tree branching and force relaxation.
 */
function generate2DCoordinates(atoms, bonds, width = 280, height = 240, padding = 34) {
  const n = atoms.length;
  if (n === 0) return;

  if (n === 1) {
    atoms[0].x = width / 2;
    atoms[0].y = height / 2;
    return;
  }

  // 1. Build adjacency graph
  const adj = Array.from({ length: n }, () => []);
  bonds.forEach((b) => {
    adj[b.source].push(b.target);
    adj[b.target].push(b.source);
  });

  // 2. Initial Tree / BFS Coordinate Placement
  const visited = new Array(n).fill(false);
  const queue = [0];
  visited[0] = true;
  atoms[0].x = 0;
  atoms[0].y = 0;

  const bondLength = 38;

  while (queue.length > 0) {
    const u = queue.shift();
    const neighbors = adj[u].filter((v) => !visited[v]);
    const numNeighbors = neighbors.length;

    neighbors.forEach((v, idx) => {
      visited[v] = true;
      queue.push(v);

      // Distribute angles evenly with zig-zag staggering
      const baseAngle = (idx - (numNeighbors - 1) / 2) * (Math.PI / 3);
      const parentAngle = atoms[u].prevAngle !== undefined ? atoms[u].prevAngle : 0;
      const angle = parentAngle + baseAngle + (idx % 2 === 0 ? 0.35 : -0.35);

      atoms[v].x = atoms[u].x + bondLength * Math.cos(angle);
      atoms[v].y = atoms[u].y + bondLength * Math.sin(angle);
      atoms[v].prevAngle = angle;
    });
  }

  // 3. Spring-Embedder Force Relaxation (12 iterations for clean aesthetic spacing)
  for (let iter = 0; iter < 16; iter++) {
    const fx = new Array(n).fill(0);
    const fy = new Array(n).fill(0);

    // Repulsion between all atom pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = atoms[j].x - atoms[i].x;
        const dy = atoms[j].y - atoms[i].y;
        const distSq = dx * dx + dy * dy + 1e-4;
        const dist = Math.sqrt(distSq);
        if (dist < 80) {
          const repForce = 450 / distSq;
          const rx = (dx / dist) * repForce;
          const ry = (dy / dist) * repForce;
          fx[i] -= rx;
          fy[i] -= ry;
          fx[j] += rx;
          fy[j] += ry;
        }
      }
    }

    // Spring attraction along bonds
    bonds.forEach((b) => {
      const u = b.source;
      const v = b.target;
      const dx = atoms[v].x - atoms[u].x;
      const dy = atoms[v].y - atoms[u].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1e-4;
      const springForce = (dist - bondLength) * 0.15;
      const sx = (dx / dist) * springForce;
      const sy = (dy / dist) * springForce;
      fx[u] += sx;
      fy[u] += sy;
      fx[v] -= sx;
      fy[v] -= sy;
    });

    // Apply displacements with cooling
    const step = 0.25 * (1 - iter / 16);
    for (let i = 0; i < n; i++) {
      atoms[i].x += fx[i] * step;
      atoms[i].y += fy[i] * step;
    }
  }

  // 4. Normalize and center into SVG ViewBox
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  atoms.forEach((a) => {
    if (a.x < minX) minX = a.x;
    if (a.x > maxX) maxX = a.x;
    if (a.y < minY) minY = a.y;
    if (a.y > maxY) maxY = a.y;
  });

  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);

  const availW = width - padding * 2;
  const availH = height - padding * 2;

  const scale = Math.min(availW / spanX, availH / spanY, 1.8);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  atoms.forEach((a) => {
    a.x = Math.round(width / 2 + (a.x - centerX) * scale);
    a.y = Math.round(height / 2 + (a.y - centerY) * scale);
  });
}
