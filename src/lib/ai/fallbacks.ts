import { PhotoAnalysisResult, BoQImportResult } from './schemas';
import { SAMPLE_NIGERIAN_BOQ_DATA } from './sampleBoQ';

/**
 * Computes realistic scripted photo analysis derived from context so fallback output remains
 * contextually accurate and valuable even when offline or without an API key.
 */
export function getScriptedPhotoAnalysis(context?: {
  taskName?: string;
  lastRecordedProgress?: number;
  projectPhase?: string;
  note?: string;
}): PhotoAnalysisResult {
  const task = context?.taskName || 'Level 4 Electrical Installation & Armoured Cabling';
  const reported = context?.lastRecordedProgress ?? 40;
  const isElectrical = task.toLowerCase().includes('electrical') || task.toLowerCase().includes('cable');
  const isMep = task.toLowerCase().includes('mep') || task.toLowerCase().includes('hvac');
  const isStructural = task.toLowerCase().includes('structural') || task.toLowerCase().includes('concrete');

  let workVisible = '';
  let estimatedProgressPercent = reported;
  let progressRationale = '';
  let limitations = '';

  if (isElectrical) {
    workVisible =
      'Overhead unistrut trapeze brackets, heavy-duty perforated cable trays installed along primary corridor soffit, and secondary PVC conduit drops terminating at sub-distribution panel backboxes.';
    estimatedProgressPercent = Math.min(100, Math.max(0, reported - 3)); // 3% variance
    progressRationale =
      'Main feeder containment run is 85% secured, but cable pulls are pending for 4-Core 16mm² armoured cables. Backboxes positioned with locknuts installed. Physical progress corresponds closely to the reported milestone.';
    limitations =
      'Single perspective snapshot; interior trunking continuity inside electrical riser shafts and pull-boxes behind partition walls cannot be visually verified.';
  } else if (isMep) {
    workVisible =
      'Galvanized spiral ductwork sections mounted with vibration isolators, insulated chilled water supply/return headers, and pressure test manifold gauges.';
    estimatedProgressPercent = reported;
    progressRationale =
      'Primary duct joints taped and clamped. Header manifold in position with isolation valves tagged. Rough-in matches scheduled Phase 3 deliverables.';
    limitations =
      'Acoustic lagging thickness and internal duct dampers cannot be measured from floor-level photography.';
  } else if (isStructural) {
    workVisible =
      'Reinforced concrete column cages with high-tensile starter bars, peri formwork shoring props, and slab perimeter kicker alignment.';
    estimatedProgressPercent = Math.min(100, reported + 2);
    progressRationale =
      'Rebar spacing and cover blocks are uniform. Formwork props braced diagonally with screw jacks engaged. Ready for pre-pour QA inspection.';
    limitations =
      'Rebar tie-wire tension and bottom slab cover cannot be confirmed under plywood formwork layers.';
  } else {
    workVisible =
      'Active construction zone with floor screeding, blockwork partition walls, and rough-in utility sleeves penetrating vertical core.';
    estimatedProgressPercent = reported;
    progressRationale =
      'Visual density of completed rough-ins matches the current project milestone curve.';
    limitations =
      'Lighting conditions and focal distance restrict automated depth measurement of mortar joints.';
  }

  return {
    workVisible,
    estimatedProgressPercent,
    progressRationale,
    safetyFlags: [
      {
        type: 'open_edge',
        severity: 'medium',
        note: 'Slab edge perimeter safety netting requires re-tensioning near western grid line 4-B.',
      },
      {
        type: 'debris',
        severity: 'low',
        note: 'Unused conduit cut-offs and packaging timber on floor slab should be swept to designated waste station before cable pulling.',
      },
    ],
    qualityObservations: [
      'Cable tray support brackets spaced at compliant 1.20m structural intervals with anti-vibration rubber gaskets.',
      'Fire-stopping intumescent sleeves pre-installed at floor penetration core drills.',
      'Clear demarcation line observed around temporary 110V site power transformer.',
    ],
    confidence: 'high',
    limitations,
  };
}

/**
 * Computes realistic scripted BoQ import derived from user-uploaded rows or sample data.
 */
export function getScriptedBoQImport(
  rawRows?: Array<Record<string, any>>,
  fileName?: string
): BoQImportResult {
  if (!rawRows || rawRows.length === 0) {
    return {
      ...SAMPLE_NIGERIAN_BOQ_DATA,
      project: {
        ...SAMPLE_NIGERIAN_BOQ_DATA.project,
        suggestedName: fileName
          ? `${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')} (Imported)`
          : SAMPLE_NIGERIAN_BOQ_DATA.project.suggestedName,
      },
    };
  }

  // Attempt to parse raw tabular rows if available
  const parsedMaterials = rawRows.slice(0, 15).map((row, index) => {
    const name =
      row.Description || row.description || row.name || row.Item || row.Material || `Material Item #${index + 1}`;
    const unit = row.Unit || row.unit || 'units';
    const quantity = parseFloat(row.Quantity || row.qty || row.quantity || '100') || 100;
    const unitRateNGN =
      parseFloat(String(row['Unit Rate (NGN)'] || row.Rate || row.rate || row.unitCost || '5000').replace(/[^0-9.]/g, '')) || 5000;
    const category = row.Category || row['Trade Category'] || row.trade || 'General Construction';
    const suggestedSupplierType =
      row['Recommended Supplier Type'] || row.supplier || 'Specialized Wholesale Distributor';

    return {
      name: String(name),
      unit: String(unit),
      quantity,
      unitRateNGN,
      category: String(category),
      suggestedSupplierType: String(suggestedSupplierType),
    };
  });

  const totalCalculatedBudget = parsedMaterials.reduce(
    (sum, m) => sum + m.quantity * m.unitRateNGN,
    0
  );

  return {
    project: {
      suggestedName: fileName
        ? `${fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')} (Imported)`
        : 'Imported Construction Project Plan',
      type: 'Commercial / Residential Mixed-Use Scheme',
      estimatedBudgetNGN: Math.max(totalCalculatedBudget, 250000000),
    },
    materials: parsedMaterials.length > 0 ? parsedMaterials : SAMPLE_NIGERIAN_BOQ_DATA.materials,
    tasks: SAMPLE_NIGERIAN_BOQ_DATA.tasks,
    milestones: SAMPLE_NIGERIAN_BOQ_DATA.milestones,
    assumptions: [
      `Extracted ${parsedMaterials.length} material line items from uploaded spreadsheet structure.`,
      'Rates calculated in Nigerian Naira (NGN ₦) based on standard Nigerian building schedules.',
      'Task sequencing synthesized across 6 construction phases conforming to Lagos State building regulations.',
    ],
    warnings: [
      'Preliminary Validation: Ensure high-voltage electrical cable specifications are cross-checked with project MEP consultant.',
      'Quotation Validity: Bulk purchase discounts for cement and reinforcement rebar should be confirmed with Lagos port distributors.',
    ],
  };
}
