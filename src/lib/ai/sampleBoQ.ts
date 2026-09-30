import { BoQImportResult } from './schemas';

export const SAMPLE_NIGERIAN_BOQ_DATA: BoQImportResult = {
  project: {
    suggestedName: 'Victoria Heights Luxury Tower (12 Floors)',
    type: 'High-Rise Residential & Penthouse Mixed-Use',
    estimatedBudgetNGN: 485500000,
  },
  materials: [
    {
      name: 'Dangote Portland Cement Grade 42.5R (50kg Bag)',
      unit: 'bags',
      quantity: 14500,
      unitRateNGN: 8800,
      category: 'Civil & Structural',
      suggestedSupplierType: 'Direct Cement Manufacturer Distributor',
    },
    {
      name: 'High-Tensile Deformed Reinforcement Rebar (16mm Y16)',
      unit: 'tonnes',
      quantity: 110,
      unitRateNGN: 1350000,
      category: 'Structural Steel',
      suggestedSupplierType: 'Heavy Civil Steel Rolling Mills',
    },
    {
      name: 'High-Tensile Deformed Reinforcement Rebar (20mm Y20)',
      unit: 'tonnes',
      quantity: 85,
      unitRateNGN: 1380000,
      category: 'Structural Steel',
      suggestedSupplierType: 'Heavy Civil Steel Rolling Mills',
    },
    {
      name: '9-inch Vibrated Sandcrete Hollow Blocks (225mm)',
      unit: 'units',
      quantity: 26000,
      unitRateNGN: 650,
      category: 'Masonry & Partitioning',
      suggestedSupplierType: 'Commercial Block Moulding Yard',
    },
    {
      name: 'Sharp Sand for Structural Concrete (20-tonne Tipper)',
      unit: 'trips',
      quantity: 120,
      unitRateNGN: 140000,
      category: 'Aggregates',
      suggestedSupplierType: 'Lekki Dredging & Sand Stockpiles',
    },
    {
      name: 'Clean Crushed Granite Aggregate 3/4-inch (30-tonne Tipper)',
      unit: 'trips',
      quantity: 95,
      unitRateNGN: 245000,
      category: 'Aggregates',
      suggestedSupplierType: 'Abeokuta Granite Quarry Distributor',
    },
    {
      name: 'Electrical 4-Core 16mm² XLPE/SWA Copper Armoured Cable',
      unit: 'meters',
      quantity: 4200,
      unitRateNGN: 4400,
      category: 'Electrical & HV Feeders',
      suggestedSupplierType: 'Certified Cable Manufacturer (Coleman/Nigerchin)',
    },
    {
      name: '3-Phase 250A Main Distribution Panel (Schneider PrismaSeT)',
      unit: 'panels',
      quantity: 14,
      unitRateNGN: 1450000,
      category: 'Electrical Switchgear',
      suggestedSupplierType: 'Authorized Switchgear Assembler',
    },
    {
      name: 'Heavy Duty 4-inch PN10 PVC Drainage & Soil Waste Pipes',
      unit: 'lengths (4m)',
      quantity: 650,
      unitRateNGN: 12800,
      category: 'Plumbing & Drainage',
      suggestedSupplierType: 'Plastics Extrusion Wholesale',
    },
    {
      name: 'Galvanized Spiral Air Ducting 400mm Diameter',
      unit: 'sections',
      quantity: 880,
      unitRateNGN: 19800,
      category: 'HVAC & Ventilation',
      suggestedSupplierType: 'HVAC Fabricator & Ducting Supplier',
    },
    {
      name: '600mm x 600mm Porcelain Vitrified Floor Tiles (Lagos Luxury)',
      unit: 'sqm',
      quantity: 7400,
      unitRateNGN: 11500,
      category: 'Architectural Finishes',
      suggestedSupplierType: 'Direct Ceramic Importer (West Africa)',
    },
    {
      name: 'Dulux Weather-Shield High-Build Exterior Emulsion Paint',
      unit: 'drums (20L)',
      quantity: 280,
      unitRateNGN: 48000,
      category: 'Finishing & Coatings',
      suggestedSupplierType: 'Industrial Paint Distributor',
    },
    {
      name: 'Heavy-Duty Acoustic Solid Timber Core Internal Doors',
      unit: 'sets',
      quantity: 144,
      unitRateNGN: 110000,
      category: 'Joinery & Ironmongery',
      suggestedSupplierType: 'Architectural Woodcraft Mill',
    },
  ],
  tasks: [
    {
      title: 'Piling & Substructure Foundation Raft Pour',
      phase: 'Phase 1: Substructure',
      dependsOn: [],
      estimatedDurationDays: 45,
      linkedMaterials: [
        'Dangote Portland Cement Grade 42.5R (50kg Bag)',
        'High-Tensile Deformed Reinforcement Rebar (20mm Y20)',
        'Clean Crushed Granite Aggregate 3/4-inch (30-tonne Tipper)',
      ],
    },
    {
      title: 'Suspended Slabs & Shear Walls (Levels 1 to 6)',
      phase: 'Phase 2: Superstructure Lower',
      dependsOn: ['Piling & Substructure Foundation Raft Pour'],
      estimatedDurationDays: 75,
      linkedMaterials: [
        'Dangote Portland Cement Grade 42.5R (50kg Bag)',
        'High-Tensile Deformed Reinforcement Rebar (16mm Y16)',
        'Sharp Sand for Structural Concrete (20-tonne Tipper)',
      ],
    },
    {
      title: 'Suspended Slabs & Tower Topping Out (Levels 7 to 12)',
      phase: 'Phase 2: Superstructure Upper',
      dependsOn: ['Suspended Slabs & Shear Walls (Levels 1 to 6)'],
      estimatedDurationDays: 80,
      linkedMaterials: [
        'High-Tensile Deformed Reinforcement Rebar (16mm Y16)',
        'High-Tensile Deformed Reinforcement Rebar (20mm Y20)',
      ],
    },
    {
      title: 'MEP Risers & Vertical Chilled Water Pipe Containment',
      phase: 'Phase 3: MEP Rough-in',
      dependsOn: ['Suspended Slabs & Shear Walls (Levels 1 to 6)'],
      estimatedDurationDays: 50,
      linkedMaterials: [
        'Heavy Duty 4-inch PN10 PVC Drainage & Soil Waste Pipes',
        'Galvanized Spiral Air Ducting 400mm Diameter',
      ],
    },
    {
      title: 'High Voltage Feeder Armoured Cabling & Sub-Panels',
      phase: 'Phase 3: MEP Rough-in',
      dependsOn: ['MEP Risers & Vertical Chilled Water Pipe Containment'],
      estimatedDurationDays: 40,
      linkedMaterials: [
        'Electrical 4-Core 16mm² XLPE/SWA Copper Armoured Cable',
        '3-Phase 250A Main Distribution Panel (Schneider PrismaSeT)',
      ],
    },
    {
      title: 'External Glazing Facade & Envelope Sealing',
      phase: 'Phase 4: Enclosure',
      dependsOn: ['Suspended Slabs & Tower Topping Out (Levels 7 to 12)'],
      estimatedDurationDays: 60,
      linkedMaterials: ['Dulux Weather-Shield High-Build Exterior Emulsion Paint'],
    },
    {
      title: 'Interior Gypsum Partitions, Doors & Floor Tiling',
      phase: 'Phase 5: Architectural Finishes',
      dependsOn: ['External Glazing Facade & Envelope Sealing', 'High Voltage Feeder Armoured Cabling & Sub-Panels'],
      estimatedDurationDays: 65,
      linkedMaterials: [
        '9-inch Vibrated Sandcrete Hollow Blocks (225mm)',
        '600mm x 600mm Porcelain Vitrified Floor Tiles (Lagos Luxury)',
        'Heavy-Duty Acoustic Solid Timber Core Internal Doors',
      ],
    },
    {
      title: 'Integrated Testing, Commissioning & Handover to BuildTwin',
      phase: 'Phase 6: Digital Handover',
      dependsOn: ['Interior Gypsum Partitions, Doors & Floor Tiling'],
      estimatedDurationDays: 20,
      linkedMaterials: [],
    },
  ],
  milestones: [
    { title: 'Substructure Raft Foundation Sign-Off', order: 1 },
    { title: 'Level 6 Mid-Rise Structural Freeze', order: 2 },
    { title: 'Level 12 Superstructure Topping Out Ceremony', order: 3 },
    { title: 'MEP Distribution Boards & Risers Pressure Energized', order: 4 },
    { title: 'Building Enclosure & Acoustic Envelope Certified', order: 5 },
    { title: 'Handover to BuildTwin Living Digital Twin', order: 6 },
  ],
  assumptions: [
    'Currency pegged in Nigerian Naira (NGN ₦) benchmarked against Q3 2026 Lagos mainland and island construction material indices.',
    'Assumes continuous 3-phase grid power plus heavy-duty standby Perkins generator logistics on site during concrete pours.',
    'Lead times for Schneider distribution boards estimated at 14 business days via Lagos port clearance.',
    'All rebar specified as standard Grade 60 (415 N/mm²) yielding compliant with Nigerian Industrial Standards (NIS 117).',
  ],
  warnings: [
    'Rate Advisory: Cement pricing exhibits ±8% monthly variance across Lagos/Ogun supply corridor. Lock supplier quotas early.',
    'Missing Item: Tower crane mobilization & dismantling cost line item is omitted in current schedule of rates.',
    'Quantity Check: PVC 4-inch pipe quantity (650 lengths) may require +12% buffer for rooftop rainwater drainage manifolds.',
  ],
};

export const SAMPLE_NIGERIAN_BOQ_CSV = `Item Number,Description,Unit,Quantity,Unit Rate (NGN),Trade Category,Recommended Supplier Type
1.01,Dangote Portland Cement Grade 42.5R (50kg Bag),bags,14500,8800,Civil & Structural,Direct Cement Manufacturer Distributor
1.02,High-Tensile Deformed Reinforcement Rebar (16mm Y16),tonnes,110,1350000,Structural Steel,Heavy Civil Steel Rolling Mills
1.03,High-Tensile Deformed Reinforcement Rebar (20mm Y20),tonnes,85,1380000,Structural Steel,Heavy Civil Steel Rolling Mills
1.04,9-inch Vibrated Sandcrete Hollow Blocks (225mm),units,26000,650,Masonry & Partitioning,Commercial Block Moulding Yard
1.05,Sharp Sand for Structural Concrete (20-tonne Tipper),trips,120,140000,Aggregates,Lekki Dredging & Sand Stockpiles
1.06,Clean Crushed Granite Aggregate 3/4-inch (30-tonne Tipper),trips,95,245000,Aggregates,Abeokuta Granite Quarry Distributor
2.01,Electrical 4-Core 16mm² XLPE/SWA Copper Armoured Cable,meters,4200,4400,Electrical & HV Feeders,Certified Cable Manufacturer (Coleman/Nigerchin)
2.02,3-Phase 250A Main Distribution Panel (Schneider PrismaSeT),panels,14,1450000,Electrical Switchgear,Authorized Switchgear Assembler
2.03,Heavy Duty 4-inch PN10 PVC Drainage & Soil Waste Pipes,lengths,650,12800,Plumbing & Drainage,Plastics Extrusion Wholesale
3.01,Galvanized Spiral Air Ducting 400mm Diameter,sections,880,19800,HVAC & Ventilation,HVAC Fabricator & Ducting Supplier
4.01,600mm x 600mm Porcelain Vitrified Floor Tiles (Lagos Luxury),sqm,7400,11500,Architectural Finishes,Direct Ceramic Importer (West Africa)
4.02,Dulux Weather-Shield High-Build Exterior Emulsion Paint,drums,280,48000,Finishing & Coatings,Industrial Paint Distributor
4.03,Heavy-Duty Acoustic Solid Timber Core Internal Doors,sets,144,110000,Joinery & Ironmongery,Architectural Woodcraft Mill`;
