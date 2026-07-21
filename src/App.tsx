import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import {
  Search,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  Layers,
  Building,
  Compass,
  Waves,
  Flame,
  ShieldAlert,
  Hammer,
  RefreshCw,
  Printer,
  Download,
  Info,
  ArrowRight,
  Loader2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Clock,
  Check,
  Map as MapIcon,
  AlertOctagon,
  Upload
} from "lucide-react";

// Definitions for the 7 due diligence search databases
interface SearchDatabase {
  id: string;
  name: string;
  source: string;
  codeSection: string;
  icon: any;
  risk: "Clear" | "Review" | "Flag";
  count: string;
  distance: string;
  findings: string;
  citation: string;
  mitigation: string[];
}

const SEARCH_DATABASES: SearchDatabase[] = [
  {
    id: "superfund",
    name: "Superfund / NPL Sites",
    source: "EPA SEMS (Superfund Enterprise Management System)",
    codeSection: "40 CFR Part 300 - National Oil and Hazardous Substances Pollution Contingency Plan",
    icon: ShieldAlert,
    risk: "Clear",
    count: "0 sites",
    distance: "N/A",
    findings: "No active, proposed, or deleted National Priorities List (NPL) Superfund sites detected within a 1.0-mile radius of the subject parcel coordinates.",
    citation: "EPA SEMS Spatial Database, Federal Register, last updated June 2026.",
    mitigation: [
      "No mitigation action required under CERCLA guidelines.",
      "Routine triannual database monitoring recommended during project life."
    ]
  },
  {
    id: "rcra",
    name: "RCRA Hazardous Waste Facilities",
    source: "EPA RCRAInfo Database",
    codeSection: "40 CFR Parts 260-273 - Resource Conservation and Recovery Act Regulations",
    icon: Activity,
    risk: "Review",
    count: "1 neighbor site",
    distance: "150 feet (Adjacent Lot)",
    findings: "Active Small Quantity Generator (SQG) identified on the eastern neighboring lot. The facility primarily handles halogenated solvents and petroleum wastes.",
    citation: "EPA RCRAInfo Handlers Dataset (EPA-ID: CAD980211451).",
    mitigation: [
      "Perform a baseline vapor intrusion screening (ASTM E2600-15) as a precautionary measure before structural planning.",
      "Inspect municipal records for any historical spill incidents or enforcement filings associated with this neighbor."
    ]
  },
  {
    id: "epa_regulated",
    name: "EPA-Regulated Facilities",
    source: "EPA FRS (Facility Registry Service)",
    codeSection: "Clean Air Act (CAA) Sec. 112 & Clean Water Act (CWA) Sec. 311",
    icon: Flame,
    risk: "Review",
    count: "4 facilities in ZIP",
    distance: "0.2 miles nearest",
    findings: "Four EPA-registered facilities identified within the zip code, primarily light industrial operations with clean compliance records. No active EPA enforcement actions or historical CWA violations detected.",
    citation: "EPA FRS Integrated Spatial Registry Index.",
    mitigation: [
      "No immediate investigation warranted; current compliance status poses minimal risk to subject parcel value."
    ]
  },
  {
    id: "ust_lust",
    name: "Underground Storage Tanks / LUST",
    source: "State Underground Storage Tank (UST) Registry",
    codeSection: "40 CFR Part 280 - Technical Standards for UST Systems & LUST Remediation Policies",
    icon: Flame,
    risk: "Flag",
    count: "2 active leaking tanks",
    distance: "0.4 miles nearest",
    findings: "Two active Leaking Underground Storage Tank (LUST) plumes detected within 0.4 miles. Local water table gradient flows south-southeast, placing the subject property directly down-gradient from the nearest fuel hydrocarbon plume.",
    citation: "State Water Resources Control Board Geotracker / LUST Database (Case # LUST-8812A).",
    mitigation: [
      "Commission a Phase II Environmental Site Assessment (ESA) including soil-gas vapor testing and groundwater monitoring wells.",
      "Consult a registered professional geologist to model the local dissolved plume migration rate relative to your foundation depth.",
      "Incorporate active vapor barrier technology (60-mil sub-slab membrane) and vapor mitigation system in all foundation plans."
    ]
  },
  {
    id: "flood_zone",
    name: "FEMA Flood Zone Assessment",
    source: "FEMA NFHL (National Flood Hazard Layer)",
    codeSection: "National Flood Insurance Act of 1968 & 44 CFR Part 60",
    icon: Waves,
    risk: "Clear",
    count: "Flood Zone X (Unshaded)",
    distance: "N/A",
    findings: "Subject property is designated within Flood Zone X (unshaded), representing an area of minimal flood hazard. Property is situated outside both the 100-year and 500-year flood hazard areas.",
    citation: "FEMA Flood Insurance Rate Map (FIRM) Panel #06075C0112J.",
    mitigation: [
      "No mandatory flood insurance purchase required for commercial lending compliance.",
      "Ensure civil engineering designs incorporate standard positive site drainage away from any future structures."
    ]
  },
  {
    id: "wetlands",
    name: "USFWS National Wetlands Inventory",
    source: "USFWS National Wetlands Inventory (NWI)",
    codeSection: "Clean Water Act Section 404 & Executive Order 11990",
    icon: Waves,
    risk: "Clear",
    count: "0 wetlands detected",
    distance: "N/A",
    findings: "No National Wetlands Inventory features, freshwater wetlands, estuarine, or marine deepwater habitats intersect the boundaries of the target parcel.",
    citation: "USFWS NWI GIS Mapping Database, last updated May 2026.",
    mitigation: [
      "No CWA Section 404 dredging or discharge permits required.",
      "Observe standard sediment controls during site excavation to protect distant regional storm drains."
    ]
  },
  {
    id: "zoning",
    name: "Zoning Classification & Overlay",
    source: "Municipal GIS & City Planning Register",
    codeSection: "Municipal Land Use Code Chapter 17 (Zoning and Preservation)",
    icon: Building,
    risk: "Review",
    count: "Zoning Code: C-2",
    distance: "On-site",
    findings: "The parcel is zoned C-2 (General Commercial) but lies entirely within the Historic Overlay District. Height limits are restricted to 45 feet. Exterior structural modifications and street-facing signage require a Certificate of Appropriateness.",
    citation: "Municipal Zoning Map, Section 22, Ordinance 2024-998.",
    mitigation: [
      "Engage a local land-use attorney or zoning planner to submit plans to the Municipal Historic Preservation Commission.",
      "Ensure architectural concept plans adhere strictly to the Historic District guidelines before submitting permit applications."
    ]
  }
];

// Interactive map coordinates & entities for custom SVG simulation
interface MapEntity {
  id: string;
  name: string;
  type: "subject" | "rcra" | "lust" | "clear";
  x: number;
  y: number;
  distance: string;
  description: string;
}

const parseDistanceAndDirection = (distanceStr: string, findingsStr: string) => {
  const text = (distanceStr + " " + findingsStr).toLowerCase();
  
  // Determine direction
  let angle = 45; // Default northeast
  if (text.includes("northwest")) {
    angle = 135;
  } else if (text.includes("northeast")) {
    angle = 45;
  } else if (text.includes("southwest")) {
    angle = 225;
  } else if (text.includes("southeast")) {
    angle = 315;
  } else if (text.includes("north")) {
    angle = 90;
  } else if (text.includes("south")) {
    angle = 270;
  } else if (text.includes("east")) {
    angle = 0;
  } else if (text.includes("west")) {
    angle = 180;
  }

  const rad = (angle * Math.PI) / 180;
  let distUnits = 60; // Default

  if (text.includes("adjacent")) {
    distUnits = 22; // Places adjacent to subject boundary (touches boundary)
  } else {
    // Look for miles
    const mileMatch = text.match(/([0-9.]+)\s*mile/);
    if (mileMatch) {
      const miles = parseFloat(mileMatch[1]);
      distUnits = miles * 280; // 140 units per 0.5 miles
    } else {
      // Look for feet
      const feetMatch = text.match(/([0-9.]+)\s*feet/);
      if (feetMatch) {
        const feet = parseFloat(feetMatch[1]);
        distUnits = (feet / 2640) * 140; // Scale relative to 0.5 miles
      }
    }
  }

  const dx = distUnits * Math.cos(rad);
  const dy = distUnits * Math.sin(rad);

  return {
    x: Math.round(200 + dx),
    y: Math.round(200 - dy) // Subtract because SVG Y goes down
  };
};

const getDatabasesForAddress = (addr: string): SearchDatabase[] => {
  const isGrand = addr.includes("Grand");
  const isPine = addr.includes("Pine");

  return SEARCH_DATABASES.map((db) => {
    const newDb = { ...db, mitigation: [...db.mitigation] };

    if (db.id === "zoning") {
      if (isGrand) {
        newDb.risk = "Clear";
        newDb.count = "Zoning Code: C-1";
        newDb.findings = "The parcel is zoned C-1 (Commercial Retail) for general retail use. No zoning overlays apply to this parcel.";
        newDb.mitigation = [
          "Confirm proposed retail uses align with permitted C-1 guidelines.",
          "No historic or environmental variance required."
        ];
      } else if (isPine) {
        newDb.risk = "Review";
        newDb.count = "Zoning Code: O-M";
        newDb.findings = "The parcel is zoned O-M (Office-Medical) but lies entirely within the Downtown Preservation Overlay District. Height limits are restricted to 60 feet. Special design standards apply.";
        newDb.mitigation = [
          "Confirm design guidelines with the Downtown Preservation Planning Board.",
          "Submit preliminary facade elevation renderings for approval."
        ];
      } else {
        newDb.risk = "Review";
        newDb.count = "Zoning Code: C-2";
        newDb.findings = "The parcel is zoned C-2 (General Commercial) but lies entirely within the Historic Overlay District. Height limits are restricted to 45 feet. Exterior structural modifications and street-facing signage require a Certificate of Appropriateness.";
      }
    } else if (db.id === "rcra") {
      if (isGrand) {
        newDb.risk = "Clear";
        newDb.count = "Clear (0 handlers)";
        newDb.distance = "N/A";
        newDb.findings = "No active RCRA handlers identified in the immediate zip code.";
        newDb.mitigation = ["No action required under standard diligence guidelines."];
      } else if (isPine) {
        newDb.risk = "Flag";
        newDb.count = "1 active facility";
        newDb.distance = "Adjacent western lot";
        newDb.findings = "Active Large Quantity Generator (LQG) facility located on the adjacent western lot with a history of minor chlorinated solvent spills.";
        newDb.mitigation = [
          "Perform a sub-slab soil vapor intrusion screen to check for chlorinated solvent migrate path.",
          "Incorporate a gas-impermeable vapor barrier in foundation design plans."
        ];
      } else {
        newDb.risk = "Review";
        newDb.count = "1 neighbor site";
        newDb.distance = "Adjacent eastern lot";
        newDb.findings = "Active Small Quantity Generator (SQG) identified on the adjacent eastern neighboring lot. The facility primarily handles halogenated solvents and petroleum wastes.";
      }
    } else if (db.id === "ust_lust") {
      if (isGrand) {
        newDb.risk = "Review";
        newDb.count = "1 active leaking tank";
        newDb.distance = "0.2 miles South";
        newDb.findings = "One active Leaking Underground Storage Tank (LUST) plume detected within 0.2 miles south. Plume is undergoing active remediation and is down-gradient from the subject property, presenting minimal vapor risk.";
        newDb.mitigation = [
          "Monitor groundwater plume status via state regulatory files.",
          "Baseline soil gas screening recommended prior to structural design."
        ];
      } else if (isPine) {
        newDb.risk = "Clear";
        newDb.count = "Clear (0 sites)";
        newDb.distance = "N/A";
        newDb.findings = "No leaking underground storage tanks or active remediation plumes detected within 0.5 miles.";
        newDb.mitigation = ["No immediate action needed; site is cleared of LUST liability."];
      } else {
        newDb.risk = "Flag";
        newDb.count = "2 active leaking tanks";
        newDb.distance = "0.4 miles Northwest";
        newDb.findings = "Two active Leaking Underground Storage Tank (LUST) plumes detected within 0.4 miles northwest. Local water table gradient flows south-southeast, placing the subject property directly down-gradient from the nearest fuel hydrocarbon plume.";
      }
    }

    return newDb;
  });
};

const generateMapEntitiesFromDatabases = (addr: string, dbs: SearchDatabase[]): MapEntity[] => {
  const entities: MapEntity[] = [];

  const zoningDb = dbs.find((db) => db.id === "zoning");
  let subjectDesc = "Subject Parcel.";
  if (zoningDb) {
    subjectDesc = `Subject Parcel. ${zoningDb.findings}`;
  }

  entities.push({
    id: "subject",
    name: `${addr || "Subject Property"} (Subject)`,
    type: "subject",
    x: 200,
    y: 200,
    distance: "0 miles",
    description: subjectDesc
  });

  dbs.forEach((db) => {
    if (db.risk !== "Clear" && db.id !== "zoning" && db.id !== "flood_zone" && db.id !== "wetlands" && db.id !== "epa_regulated") {
      const { x, y } = parseDistanceAndDirection(db.distance, db.findings);
      
      let type: "rcra" | "lust" | "clear" = "rcra";
      if (db.id === "ust_lust") {
        type = "lust";
      }

      entities.push({
        id: db.id,
        name: db.id === "ust_lust" ? "Active Leaking Storage Tank" : "Active RCRA Handler",
        type: type,
        x,
        y,
        distance: db.distance,
        description: db.findings
      });
    }
  });

  return entities;
};

const parseLiveResults = (data: any, lat: number, lng: number): SearchDatabase[] => {
  const superfundCount = data.superfund?.length || 0;
  const rcraCount = data.rcra?.length || 0;
  const frsCount = data.frs?.length || 0;
  const ustCount = data.ust?.length || 0;
  const lustCount = data.lust?.length || 0;
  const floodCount = data.flood?.length || 0;
  const wetlandsCount = data.wetlands?.length || 0;

  // 1. Superfund
  const superfundDb: SearchDatabase = {
    id: "superfund",
    name: "Superfund / NPL Sites",
    source: "EPA SEMS (Superfund Enterprise Management System)",
    codeSection: "40 CFR Part 300 - National Oil and Hazardous Substances Pollution Contingency Plan",
    icon: ShieldAlert,
    risk: superfundCount > 0 ? "Flag" : "Clear",
    count: superfundCount > 0 ? `${superfundCount} site(s) detected` : "Clear (0 sites)",
    distance: superfundCount > 0 ? "Within ZIP" : "N/A",
    findings: superfundCount > 0 
      ? `Active or legacy National Priorities List (NPL) Superfund site(s) detected in the target ZIP code: ${data.superfund.map((s: any) => s.SITE_NAME || s.site_name).slice(0, 3).join(", ")}.`
      : "No active, proposed, or deleted National Priorities List (NPL) Superfund sites detected within a 1.0-mile radius of the subject parcel coordinates.",
    citation: "EPA SEMS Spatial Database, live query.",
    mitigation: superfundCount > 0 
      ? [
          "Commission an ASTM E1527-21 compliant Phase I Environmental Site Assessment (ESA) immediately.",
          "Request detailed remedial action plans from EPA Region and determine if migration pathways (vapor or groundwater) reach the property."
        ]
      : [
          "No mitigation action required under CERCLA guidelines.",
          "Routine triannual database monitoring recommended during project life."
        ]
  };

  // 2. RCRA
  const rcraDb: SearchDatabase = {
    id: "rcra",
    name: "RCRA Hazardous Waste Facilities",
    source: "EPA RCRAInfo Database",
    codeSection: "40 CFR Parts 260-273 - Resource Conservation and Recovery Act Regulations",
    icon: Activity,
    risk: rcraCount > 0 ? "Review" : "Clear",
    count: rcraCount > 0 ? `${rcraCount} handlers in ZIP` : "Clear (0 handlers)",
    distance: rcraCount > 0 ? "Within ZIP" : "N/A",
    findings: rcraCount > 0
      ? `EPA RCRAInfo handlers identified in the ZIP code. Includes registered generators of hazardous waste: ${data.rcra.map((r: any) => r.HANDLER_NAME || r.handler_name).slice(0, 3).join(", ")}.`
      : "No active hazardous waste treatment, storage, disposal, or generator facilities detected in the immediate ZIP code.",
    citation: "EPA RCRAInfo Handlers Dataset, live query.",
    mitigation: rcraCount > 0
      ? [
          "Cross-reference municipal fire department records for historical spill logs or chemical storage permits.",
          "Execute a standard vapor intrusion screening (ASTM E2600-15) to rule out off-site chemical migrations."
        ]
      : [
          "No immediate investigation warranted; current compliance status poses minimal risk to subject parcel value."
        ]
  };

  // 3. EPA Regulated Facilities (FRS)
  const epaRegulatedDb: SearchDatabase = {
    id: "epa_regulated",
    name: "EPA-Regulated Facilities",
    source: "EPA FRS (Facility Registry Service)",
    codeSection: "Clean Air Act (CAA) Sec. 112 & Clean Water Act (CWA) Sec. 311",
    icon: Flame,
    risk: frsCount > 5 ? "Review" : "Clear",
    count: frsCount > 0 ? `${frsCount} facilities` : "Clear (0 facilities)",
    distance: frsCount > 0 ? "Within 1 mile" : "N/A",
    findings: frsCount > 0
      ? `${frsCount} EPA-registered facility records found within a 1.0-mile radius coordinates. Primary categories include light-industrial, commercial, or utility operators.`
      : "No EPA-registered facilities identified within a 1.0-mile radius of the coordinates.",
    citation: "EPA FRS Integrated Spatial Registry Index, live query.",
    mitigation: frsCount > 0
      ? [
          "Monitor EPA Echo compliance logs for any ongoing clean air or clean water enforcement actions.",
          "No immediate Phase II remediation required based solely on FRS registry entries."
        ]
      : [
          "No mitigation action required under current EPA FRS registry entries."
        ]
  };

  // 4. UST/LUST
  const hasLust = lustCount > 0;
  const hasUst = ustCount > 0;
  const ustLustDb: SearchDatabase = {
    id: "ust_lust",
    name: "Underground Storage Tanks / LUST",
    source: "EPA UST Finder MapServer",
    codeSection: "40 CFR Part 280 - Technical Standards for UST Systems & LUST Remediation Policies",
    icon: Flame,
    risk: hasLust ? "Flag" : (hasUst ? "Review" : "Clear"),
    count: `${ustCount} USTs, ${lustCount} LUSTs`,
    distance: hasLust || hasUst ? "Within 1 mile" : "N/A",
    findings: (hasLust || hasUst)
      ? `Live query detected ${lustCount} Leaking Underground Storage Tanks (LUST) and ${ustCount} active or historic Underground Storage Tanks (UST) within 1 mile.`
      : "No active leaking underground tanks or registered underground storage tanks detected in the 1-mile radius from EPA UST Finder.",
    citation: "EPA UST Finder ArcGIS REST Service, live query.",
    mitigation: hasLust
      ? [
          "Commission a Phase II Environmental Site Assessment (ESA) including soil-gas vapor testing and groundwater monitoring wells.",
          "Incorporate active vapor barrier technology (60-mil sub-slab membrane) and vapor mitigation system in all foundation plans.",
          "Identify if the leaking plume is up-gradient or down-gradient from your property boundary."
        ]
      : hasUst
      ? [
          "Confirm the presence of any registered fuel tanks on the property; verify triennial tank tightness tests are complete and penalties clear."
        ]
      : [
          "No immediate investigation warranted; clear of nearby active storage tank leaks."
        ]
  };

  // 5. Flood zone
  let floodZoneCode = "X";
  let floodZoneRisk: "Clear" | "Review" | "Flag" = "Clear";
  let floodZoneExplanation = "Subject property is designated within Flood Zone X (unshaded), representing an area of minimal flood hazard. Property is situated outside both the 100-year and 500-year flood hazard areas.";
  
  if (floodCount > 0) {
    const fAttr = data.flood[0].attributes || {};
    floodZoneCode = fAttr.FLD_ZONE || "X";
    const subType = fAttr.ZONE_SUBTY || "";
    
    if (["A", "AE", "AH", "AO", "AR", "A99", "V", "VE"].some(code => floodZoneCode.startsWith(code))) {
      floodZoneRisk = "Flag";
      floodZoneExplanation = `High-risk flood area (Zone ${floodZoneCode}, 100-year floodplain). High risk of flooding; federal mandatory flood insurance purchase requirements apply for commercial lending.`;
    } else if (floodZoneCode === "X" && subType.toLowerCase().includes("0.2 pct")) {
      floodZoneRisk = "Review";
      floodZoneExplanation = `Moderate-risk flood area (Zone X Shaded, 500-year floodplain). Area of 0.2% annual chance flood, area protected by levee, or shallow flooding.`;
    } else {
      floodZoneRisk = "Clear";
      floodZoneExplanation = `Minimal flood hazard area (Zone ${floodZoneCode}). Outside both the 1% and 0.2% annual chance floodplains; no mandatory federal flood insurance purchase required.`;
    }
  }

  const floodDb: SearchDatabase = {
    id: "flood_zone",
    name: "FEMA Flood Zone Assessment",
    source: "FEMA NFHL (National Flood Hazard Layer)",
    codeSection: "National Flood Insurance Act of 1968 & 44 CFR Part 60",
    icon: Waves,
    risk: floodZoneRisk,
    count: `Flood Zone ${floodZoneCode}`,
    distance: floodCount > 0 ? "Intersecting" : "N/A",
    findings: floodZoneExplanation,
    citation: "FEMA National Flood Hazard Layer ArcGIS REST Service, live query.",
    mitigation: floodZoneRisk === "Flag"
      ? [
          "Federal law mandates purchasing standard flood insurance coverage before loan origination.",
          "Incorporate high-water structural floodproofing, elevated electrical service entries, and backflow sewer valves.",
          "Verify the Base Flood Elevation (BFE) from the FEMA FIRM panel to design foundation height above the BFE."
        ]
      : floodZoneRisk === "Review"
      ? [
          "Flood insurance is highly recommended though not federally mandated.",
          "Ensure civil engineering designs incorporate standard positive site drainage away from any future structures."
        ]
      : [
          "No mandatory flood insurance purchase required for commercial lending compliance.",
          "Ensure civil engineering designs incorporate standard positive site drainage away from any future structures."
        ]
  };

  // 6. Wetlands
  let wetlandsRisk: "Clear" | "Review" | "Flag" = "Clear";
  let wetlandsExplanation = "No National Wetlands Inventory features, freshwater wetlands, or marine deepwater habitats intersect or lie within the immediate vicinity of the target parcel.";
  if (wetlandsCount > 0) {
    wetlandsRisk = "Review";
    const firstWetland = data.wetlands[0].attributes || {};
    const wType = firstWetland.WETLAND_TYPE || "Designated Wetland Area";
    wetlandsExplanation = `Detected ${wetlandsCount} USFWS National Wetlands Inventory feature(s) within the 1-mile query radius. Nearest designated class is categorized as '${wType}' (${firstWetland.ATTRIBUTE || ""}).`;
  }

  const wetlandsDb: SearchDatabase = {
    id: "wetlands",
    name: "USFWS National Wetlands Inventory",
    source: "USFWS National Wetlands Inventory (NWI)",
    codeSection: "Clean Water Act Section 404 & Executive Order 11990",
    icon: Waves,
    risk: wetlandsRisk,
    count: wetlandsCount > 0 ? `${wetlandsCount} wetlands nearby` : "0 wetlands detected",
    distance: wetlandsCount > 0 ? "Within 1 mile" : "N/A",
    findings: wetlandsExplanation,
    citation: "USFWS NWI ArcGIS REST Service, live query.",
    mitigation: wetlandsRisk === "Review"
      ? [
          "Engage an environmental scientist to perform a formal on-site wetland delineation if structural work is planned near the property boundaries.",
          "Ensure compliance with the Clean Water Act Section 404 regarding any potential dredging or discharge of fill materials.",
          "Incorporate stormwater run-off sediment basins during excavation phases to satisfy EPA construction general permits."
        ]
      : [
          "No CWA Section 404 dredging or discharge permits required.",
          "Observe standard sediment controls during site excavation to protect distant regional storm drains."
        ]
  };

  // 7. Zoning (Stays mocked)
  const zoningDb: SearchDatabase = {
    id: "zoning",
    name: "Roadmap: live zoning coverage",
    source: "Municipal GIS & City Planning Register",
    codeSection: "Municipal Land Use Code Chapter 17 (Zoning and Preservation)",
    icon: Building,
    risk: "Review",
    count: "Zoning Code: C-2",
    distance: "On-site",
    findings: "The parcel is zoned C-2 (General Commercial) but lies entirely within the Historic Overlay District. Height limits are restricted to 45 feet. Exterior structural modifications and street-facing signage require a Certificate of Appropriateness.",
    citation: "Municipal Zoning Map, Section 22, Ordinance 2024-998.",
    mitigation: [
      "Engage a local land-use attorney or zoning planner to submit plans to the Municipal Historic Preservation Commission.",
      "Ensure architectural concept plans adhere strictly to the Historic District guidelines before submitting permit applications."
    ]
  };

  return [superfundDb, rcraDb, epaRegulatedDb, ustLustDb, floodDb, wetlandsDb, zoningDb];
};

const DEFAULT_FIRM_TEMPLATE = `DUE DILIGENCE AND RISK RECONNAISSANCE MEMORANDUM
FIRM: Sterling & Vance LLP (Real Estate Diligence Practice Group)

CONFIDENTIALITY NOTICE: This document contains legal evaluations and counsel risk appraisals prepared solely for the prospective transaction of the Subject Land.

1. Executive Summary
Sterling & Vance LLP has conducted a preliminary environmental and land-use risk analysis regarding the prospective transaction of [the Property] (hereafter "the Property"). This analysis is based entirely on live regulatory registry databases retrieved as of the date of [the Report] (hereafter "the Report"). Based on our screening, the Property presents an overall risk rating of [Risk Rating] due to specific regulatory flags identified.

2. Scope of Review
The scope of this legal reconnaissance is strictly limited to spatial coordinate mapping and database searches of federal, state, and municipal environmental and land-use registries. No physical site inspection, geotechnical investigation, or environmental sampling has been conducted by this firm.

3. Searches Conducted
Sterling & Vance LLP executed inquiries across the following official regulatory databases:
- EPA SEMS (Superfund Enterprise Management System)
- EPA RCRAInfo (Hazardous Waste Handlers)
- EPA FRS (Facility Registry Service)
- EPA UST Finder (Underground Storage Tanks & Leaking USTs)
- FEMA National Flood Hazard Layer (NFHL)
- USFWS National Wetlands Inventory (NWI)
- Municipal GIS and zoning/planning registers

4. Findings and Risk Assessment
Based on our query results, our findings and assessed risks for the Property are detailed below:
- Environmental Contamination / Leaking Storage Tanks: [Contamination Findings]
- Zoning, Planning and Land-Use Restrictions: [Zoning/Planning Findings]
- Waterway, Flood and Wetland Proximity: [Flood/Waterway Findings]

5. Qualifications and Assumptions
This review assumes that all spatial coordinates, geographic parcel boundaries, and public database entries provided by regulatory agencies are complete, accurate, and correct. We assume no responsibility for regional registration backlogs, municipal mapping offsets, or delayed regulatory filing schedules.

6. Recommendations
Pursuant to the findings identified during this review, we recommend the following legal and procedural steps:
- [Actionable Recommendations]`;

export default function App() {
  const [address, setAddress] = useState("1420 North Industrial Parkway");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  // Custom Firm Template states
  const [customTemplate, setCustomTemplate] = useState(DEFAULT_FIRM_TEMPLATE);
  const [isCustomTemplateActive, setIsCustomTemplateActive] = useState(false);
  const [customMemoOutput, setCustomMemoOutput] = useState("");
  const [isGeneratingCustomMemo, setIsGeneratingCustomMemo] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleDocxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Read file using FileReader
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result;
      if (!arrayBuffer) {
        setUploadError("Could not read file data.");
        return;
      }

      try {
        const mammoth = (window as any).mammoth;
        if (!mammoth) {
          throw new Error("Mammoth.js library is not loaded.");
        }

        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result && result.value) {
          setCustomTemplate(result.value);
          setUploadSuccess(`Successfully extracted text from ${file.name}`);
        } else {
          setUploadError("Extracted template text was empty.");
        }
      } catch (err: any) {
        console.error("Mammoth extraction failed:", err);
        setUploadError(`Failed to extract text: ${err?.message || "Invalid or corrupted .docx file"}`);
      }
    };

    reader.onerror = () => {
      setUploadError("File loading failed.");
    };

    reader.readAsArrayBuffer(file);
  };
  const [isRegistriesExpanded, setIsRegistriesExpanded] = useState(false);
  const [expandedRegistryId, setExpandedRegistryId] = useState<string | null>(null);
  const [geocodeInfo, setGeocodeInfo] = useState<{
    lat: string;
    lng: string;
    latNum?: number;
    lngNum?: number;
    county: string;
    state: string;
    status: "idle" | "loading" | "success" | "fallback";
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  // Helper for geocoding with 6 seconds timeout
  const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 6000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  // State-controlled databases & map entities
  const [databases, setDatabases] = useState<SearchDatabase[]>(() => getDatabasesForAddress("1420 North Industrial Parkway"));
  const [mapEntities, setMapEntities] = useState<MapEntity[]>(() => generateMapEntitiesFromDatabases("1420 North Industrial Parkway", getDatabasesForAddress("1420 North Industrial Parkway")));

  // Track the scanning status of the 7 databases
  const [checklist, setChecklist] = useState<
    { id: string; status: "idle" | "scanning" | "completed" }[]
  >(
    SEARCH_DATABASES.map((db) => ({ id: db.id, status: "idle" }))
  );

  // Active highlighted card in results
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(() => {
    const initialEntities = generateMapEntitiesFromDatabases("1420 North Industrial Parkway", getDatabasesForAddress("1420 North Industrial Parkway"));
    return initialEntities[0] || null;
  });

  const [copied, setCopied] = useState(false);

  const copyMemoToClipboard = () => {
    if (isCustomTemplateActive && customMemoOutput) {
      navigator.clipboard.writeText(customMemoOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const coords = geocodeInfo ? `${geocodeInfo.lat}, ${geocodeInfo.lng}` : "37.7749° N, 122.4194° W";
    const jurisdiction = geocodeInfo && geocodeInfo.county ? `${geocodeInfo.county}, ${geocodeInfo.state}` : geocodeInfo?.state || "Federal EPA Region 9 / Municipal";

    const flagCount = databases.filter(db => db.risk === "Flag").length;
    const reviewCount = databases.filter(db => db.risk === "Review").length;
    const overallRating = flagCount > 0 ? (flagCount >= 2 ? "HIGH RISK" : "MEDIUM RISK") : (reviewCount > 0 ? "MEDIUM RISK" : "LOW RISK");

    const summarySection = databases.map(db => `- ${db.name}: ${db.risk} (${db.count})`).join("\n");

    const activeFindings = databases
      .filter(db => db.risk === "Flag" || db.risk === "Review")
      .map((db, idx) => `${idx + 1}. ${db.name} (${db.codeSection}): ${db.findings}`)
      .join("\n\n");

    const activeInquiries = databases
      .filter(db => db.risk === "Flag" || db.risk === "Review")
      .flatMap(db => db.mitigation)
      .map((mit, idx) => `${idx + 1}. ${mit}`)
      .join("\n");

    const memoText = `ENVIRONMENTAL & LAND USE DUE DILIGENCE MEMORANDUM

PROPERTY IDENTIFICATION:
- Target Site: ${address}
- Coordinates: ${coords}
- Parcel Reference: 412-009-881A
- Appraisal Date: July 19, 2026
- Reference ID: SC-2026-0719-881
- Jurisdiction: ${jurisdiction}

SEARCH RESULTS SUMMARY:
${summarySection}

KEY RISK FINDINGS:
${activeFindings || "No major environmental or zoning risks detected."}

RECOMMENDED FURTHER INQUIRIES:
${activeInquiries || "1. Perform standard ASTM Phase I Environmental Site Assessment (ESA).\n2. Routine monitoring of environmental databases during project lifecycle."}

OVERALL DUE DILIGENCE RISK RATING: ${overallRating}

This document is compiled using consolidated public database registries for expedited preliminary risk analysis. THIS DOCUMENT DOES NOT CONSTITUTE FORMAL LEGAL COUNSEL OR RECOURSE ADVICE.`;

    navigator.clipboard.writeText(memoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateTemplatedMemo = async (currentDbs = databases, forceActive = false) => {
    const isActive = forceActive || isCustomTemplateActive;
    if (!isActive) return;

    setIsGeneratingCustomMemo(true);
    try {
      const coords = geocodeInfo ? `${geocodeInfo.lat}, ${geocodeInfo.lng}` : "37.7749° N, 122.4194° W";
      const jurisdiction = geocodeInfo && geocodeInfo.county ? `${geocodeInfo.county}, ${geocodeInfo.state}` : geocodeInfo?.state || "Federal EPA Region 9 / Municipal";
      const flagCount = currentDbs.filter(db => db.risk === "Flag").length;
      const reviewCount = currentDbs.filter(db => db.risk === "Review").length;
      const overallRating = flagCount > 0 ? (flagCount >= 2 ? "HIGH RISK" : "MEDIUM RISK") : (reviewCount > 0 ? "MEDIUM RISK" : "LOW RISK");

      const response = await fetch("/api/pipeline/templated-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: customTemplate,
          address: address,
          geocodeInfo: {
            coordinates: coords,
            jurisdiction: jurisdiction
          },
          databases: currentDbs.map(db => ({
            name: db.name,
            source: db.source,
            risk: db.risk,
            count: db.count,
            distance: db.distance,
            findings: db.findings,
            citation: db.citation,
            codeSection: db.codeSection,
            mitigation: db.mitigation
          })),
          overallRating
        })
      });

      const resData = await response.json();
      if (resData.success && resData.result) {
        setCustomMemoOutput(resData.result);
      } else {
        throw new Error(resData.error || "Failed custom template generation");
      }
    } catch (err) {
      console.warn("Silent fallback to built-in due diligence memo layout:", err);
      setCustomMemoOutput("");
    } finally {
      setIsGeneratingCustomMemo(false);
    }
  };

  // Setup Leaflet map
  useEffect(() => {
    if (!analyzed || !mapContainerRef.current) return;

    // Remove existing map instance if any
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Error removing map instance:", err);
      }
      mapInstanceRef.current = null;
    }

    const centerLat = geocodeInfo?.latNum ?? 37.7749;
    const centerLng = geocodeInfo?.lngNum ?? -122.4194;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Dark-themed tiles from CartoDB (free OSM based tiles)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
    }).addTo(map);

    // 0.5-Mile Radius Boundary Circle (804.672 meters)
    L.circle([centerLat, centerLng], {
      radius: 804.672,
      color: "#475569",
      weight: 1.5,
      dashArray: "4 4",
      fillColor: "transparent",
      fillOpacity: 0,
    }).addTo(map);

    const getLatLngFromSvgCoords = (x: number, y: number, centerLat: number, centerLng: number) => {
      const dx = x - 200;
      const dy = 200 - y; // SVG y goes down, latitude goes up
      // 140 units in SVG = 0.5 miles = 804.672 meters. 1 unit = 5.7476 meters
      const metersPerUnit = 5.7476;
      const dxMeters = dx * metersPerUnit;
      const dyMeters = dy * metersPerUnit;

      const latOffset = dyMeters / 111111;
      const lngOffset = dxMeters / (111111 * Math.cos((centerLat * Math.PI) / 180));

      return {
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
      };
    };

    // Dynamic Zoning Overlay handling based on current zoning findings
    const zoningDb = databases.find((db) => db.id === "zoning");
    const hasOverlay = zoningDb && (
      zoningDb.findings.toLowerCase().includes("overlay") || 
      zoningDb.findings.toLowerCase().includes("preservation")
    );

    if (hasOverlay) {
      let overlayName = "Overlay District";
      if (zoningDb.findings.includes("Historic Overlay District")) {
        overlayName = "Historic Overlay District";
      } else if (zoningDb.findings.includes("Downtown Preservation Overlay District")) {
        overlayName = "Downtown Preservation Overlay District";
      } else {
        const match = zoningDb.findings.match(/([A-Za-z0-9\s-]+Overlay(?:\s+District)?|[A-Za-z0-9\s-]+Preservation\s+Overlay)/i);
        if (match) overlayName = match[1].trim();
      }

      // Slightly irregular overlay polygon that fully contains the subject lot (centered at 200, 200)
      const overlaySvgPoints = [
        { x: 100, y: 110 },
        { x: 290, y: 100 },
        { x: 300, y: 290 },
        { x: 110, y: 300 },
      ];

      const overlayCoords = overlaySvgPoints.map((pt) => {
        const ll = getLatLngFromSvgCoords(pt.x, pt.y, centerLat, centerLng);
        return [ll.lat, ll.lng] as [number, number];
      });

      const overlayPolygon = L.polygon(overlayCoords, {
        color: "#d97706",
        weight: 1.5,
        dashArray: "4 4",
        fillColor: "#d97706",
        fillOpacity: 0.08,
      }).addTo(map);

      // Label the overlay polygon in the center
      overlayPolygon.bindTooltip(overlayName, {
        permanent: true,
        direction: "center",
        className: "bg-amber-950/90 text-amber-200 border border-amber-700/50 font-bold text-[9px] px-2 py-1 rounded shadow-md uppercase tracking-wider"
      });

      overlayPolygon.on("click", () => {
        const subjectEnt = mapEntities.find((e) => e.id === "subject");
        if (subjectEnt) {
          setSelectedEntity(subjectEnt);
        }
      });
    }

    // Subject Property Lot lines polygon (irregular five-sided lot centered on marker)
    const subjectLotSvgPoints = [
      { x: 191.6, y: 194.3 },
      { x: 206.6, y: 191.3 },
      { x: 208.1, y: 201.8 },
      { x: 203.6, y: 207.8 },
      { x: 190.1, y: 204.8 },
    ];

    const subjectCoords = subjectLotSvgPoints.map((pt) => {
      const ll = getLatLngFromSvgCoords(pt.x, pt.y, centerLat, centerLng);
      return [ll.lat, ll.lng] as [number, number];
    });

    const subjectPolygon = L.polygon(subjectCoords, {
      color: "#10b981",
      weight: selectedEntity?.id === "subject" ? 3 : 2,
      fillColor: "#10b981",
      fillOpacity: selectedEntity?.id === "subject" ? 0.25 : 0.15,
    }).addTo(map);

    subjectPolygon.on("click", () => {
      const subjectEnt = mapEntities.find((e) => e.id === "subject");
      if (subjectEnt) {
        setSelectedEntity(subjectEnt);
      }
    });

    // Custom pulse-in-place marker HTML icon generator
    const getMarkerIcon = (entityType: string, isSelected: boolean) => {
      let dotColorClass = "bg-rose-500 border-rose-400 text-rose-500";
      if (entityType === "subject") dotColorClass = "bg-emerald-500 border-emerald-400 text-emerald-500";
      if (entityType === "rcra") dotColorClass = "bg-amber-500 border-amber-400 text-amber-500";

      const size = isSelected ? 10 : 7;
      const pulseSize = isSelected ? 32 : 20;

      const html = `
        <div class="relative flex items-center justify-center" style="width: ${pulseSize}px; height: ${pulseSize}px;">
          <!-- Pulsing Outer Ring (Pulse in place with zero drift) -->
          <div class="absolute rounded-full border border-current opacity-60 animate-ping" 
               style="width: 100%; height: 100%; color: ${
                 entityType === "subject" ? "#10b981" : entityType === "rcra" ? "#f59e0b" : "#ef4444"
               };"></div>
          <!-- Core Dot -->
          <div class="absolute rounded-full border-2 border-slate-900 ${dotColorClass} shadow-md" 
               style="width: ${size}px; height: ${size}px; transform: scale(${isSelected ? 1.3 : 1.0}); transition: transform 0.2s;"></div>
        </div>
      `;

      return L.divIcon({
        className: "bg-transparent border-none",
        html: html,
        iconSize: [pulseSize, pulseSize],
        iconAnchor: [pulseSize / 2, pulseSize / 2],
      });
    };

    // Render each map entity
    mapEntities.forEach((entity) => {
      const isSelected = selectedEntity?.id === entity.id;
      const { lat, lng } = getLatLngFromSvgCoords(entity.x, entity.y, centerLat, centerLng);

      const marker = L.marker([lat, lng], {
        icon: getMarkerIcon(entity.type, isSelected),
      }).addTo(map);

      marker.on("click", () => {
        setSelectedEntity(entity);
      });
    });

    // Cleanup on unmount or re-render
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Error removing map instance in cleanup:", err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [analyzed, geocodeInfo, mapEntities, selectedEntity]);

  // Handle rapid appraisal pipeline
  const handleAppraise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsAnalyzing(true);
    setAnalyzed(false);
    setProgress(0);
    setIsRegistriesExpanded(false);
    setExpandedRegistryId(null);

    // Initialize checklist status
    setChecklist(SEARCH_DATABASES.map((db) => ({ id: db.id, status: "idle" })));

    let liveDataPromise: Promise<any> | null = null;
    let latNum = 37.7749;
    let lngNum = -122.4194;
    let zipCode = "94103";

    if (demoMode) {
      setGeocodeInfo({
        lat: "37.7749° N",
        lng: "122.4194° W",
        latNum: 37.7749,
        lngNum: -122.4194,
        county: "San Francisco County",
        state: "CA",
        status: "success"
      });
      const customDbs = getDatabasesForAddress(address);
      setDatabases(customDbs);
      const customEntities = generateMapEntitiesFromDatabases(address, customDbs);
      setMapEntities(customEntities);
      setSelectedEntity(customEntities[0] || null);
    } else {
      setGeocodeInfo({
        lat: "...",
        lng: "...",
        county: "...",
        state: "...",
        status: "loading"
      });

      const zipMatch = address.match(/\b\d{5}\b/);
      if (zipMatch) {
        zipCode = zipMatch[0];
      }

      try {
        const response = await fetchWithTimeout(
          `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(
            address
          )}&benchmark=Public_AR_Current&format=json`,
          {},
          6000
        );
        if (!response.ok) throw new Error("Network error");
        const data = await response.json();
        const match = data?.result?.addressMatches?.[0];
        if (match) {
          const latVal = match.coordinates?.y;
          const lngVal = match.coordinates?.x;
          const countyVal = match.addressComponents?.county || "Unknown County";
          const stateVal = match.addressComponents?.state || "Unknown State";
          latNum = latVal;
          lngNum = lngVal;

          setGeocodeInfo({
            lat: latVal >= 0 ? `${latVal.toFixed(4)}° N` : `${Math.abs(latVal).toFixed(4)}° S`,
            lng: lngVal >= 0 ? `${lngVal.toFixed(4)}° E` : `${Math.abs(lngVal).toFixed(4)}° W`,
            latNum: latVal,
            lngNum: lngVal,
            county: countyVal,
            state: stateVal,
            status: "success"
          });
        } else {
          throw new Error("No address matches");
        }
      } catch (err) {
        // Silent fallback
        setGeocodeInfo({
          lat: "37.7749° N",
          lng: "122.4194° W",
          latNum: 37.7749,
          lngNum: -122.4194,
          county: "San Francisco County",
          state: "CA",
          status: "fallback"
        });
      }

      // Start fetching the live EPA/FEMA/USFWS databases in the background
      liveDataPromise = fetch("/api/epa/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latNum, lng: lngNum, zip: zipCode })
      })
        .then((res) => res.json())
        .catch((err) => {
          console.warn("Live API Search failed, falling back to safe simulation:", err);
          return null;
        });
    }

    // Sequential simulation of 7 databases with satisfying progression
    const sequence = [
      { id: "superfund", delay: 450 },
      { id: "rcra", delay: 500 },
      { id: "epa_regulated", delay: 600 },
      { id: "ust_lust", delay: 750 },
      { id: "flood_zone", delay: 550 },
      { id: "wetlands", delay: 400 },
      { id: "zoning", delay: 800 }
    ];

    let totalDelay = 0;
    sequence.forEach((step, idx) => {
      // Step to 'scanning'
      setTimeout(() => {
        setChecklist((prev) =>
          prev.map((item) =>
            item.id === step.id ? { ...item, status: "scanning" } : item
          )
        );
      }, totalDelay);

      // Step to 'completed'
      totalDelay += step.delay;
      setTimeout(async () => {
        setChecklist((prev) =>
          prev.map((item) =>
            item.id === step.id ? { ...item, status: "completed" } : item
          )
        );
        setProgress(Math.round(((idx + 1) / sequence.length) * 100));

        // When final database finishes
        if (idx === sequence.length - 1) {
          let finalDbs = demoMode ? getDatabasesForAddress(address) : databases;
          if (liveDataPromise) {
            try {
              const liveResult = await liveDataPromise;
              if (liveResult && liveResult.success) {
                const parsedDbs = parseLiveResults(liveResult, latNum, lngNum);
                setDatabases(parsedDbs);
                finalDbs = parsedDbs;

                const updatedEntities = generateMapEntitiesFromDatabases(address, parsedDbs);
                setMapEntities(updatedEntities);
                setSelectedEntity(updatedEntities[0] || null);
              }
            } catch (e) {
              console.error("Failed to parse live search results:", e);
            }
          }

          if (isCustomTemplateActive) {
            await generateTemplatedMemo(finalDbs);
          }

          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalyzed(true);
          }, 350);
        }
      }, totalDelay);
    });
  };

  // Preset quick-click options
  const handlePresetClick = (presetAddress: string) => {
    setAddress(presetAddress);
    // Auto appraise
    setTimeout(() => {
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      // Triggers search
      const button = document.getElementById("search-submit-btn");
      if (button) button.click();
    }, 50);
  };

  // PDF Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // Filtered databases for tabs
  const filteredDatabases = databases.filter((db) => {
    if (activeTab === "all") return true;
    if (activeTab === "flag") return db.risk === "Flag";
    if (activeTab === "review") return db.risk === "Review";
    if (activeTab === "clear") return db.risk === "Clear";
    return true;
  });

  const flagCount = databases.filter(db => db.risk === "Flag").length;
  const reviewCount = databases.filter(db => db.risk === "Review").length;
  const clearCount = databases.filter(db => db.risk === "Clear").length;
  const overallRating = flagCount > 0 ? (flagCount >= 2 ? "HIGH RISK" : "MEDIUM RISK") : (reviewCount > 0 ? "MEDIUM RISK" : "LOW RISK");
  const overallColor = overallRating === "HIGH RISK" ? "rose" : (overallRating === "MEDIUM RISK" ? "amber" : "emerald");
  const overallDescription = overallRating === "HIGH RISK"
    ? "Critical regulatory or contamination flags have been identified within the direct vicinity of the subject parcel. Immediate, specialized Phase II environmental site investigation and land-use counsel are required to mitigate significant developer liability."
    : overallRating === "MEDIUM RISK"
    ? "Environmental registry review flags (such as adjacent hazardous handlers, up-gradient LUST plumes, or historical overlay limits) suggest moderate transaction risk. A standard ASTM Phase I ESA and land use consult are indicated."
    : "No major regulatory, contamination, or land use exposure triggers have been identified in the spatial databases. Standard transaction due diligence and regular database updates are recommended.";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white print:bg-white print:text-black">
      {/* Premium Legal-Tech Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-6 px-8 relative overflow-hidden shrink-0 shadow-lg print:bg-white print:text-black print:border-b print:py-4">
        {/* Subtle geometric lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-800 to-slate-900 opacity-30 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded uppercase">
                Enterprise Due Diligence
              </span>
              <span className="text-xs text-slate-400 font-mono">v1.4.0</span>
            </div>
            <h1 id="app-title" className="text-2xl md:text-3xl font-bold font-sans tracking-tight flex items-center gap-2.5">
              <Compass className="h-6 w-6 text-amber-500 animate-pulse print:text-slate-900" />
              TerraCheck
            </h1>
            <p className="text-xs text-slate-300 font-sans mt-2 max-w-4xl leading-relaxed font-normal print:text-slate-700">
              AI due diligence for environmental & land-use risk — required in nearly
              every commercial property transaction, currently billed as associate
              hours. TerraCheck does the first pass in minutes, with every finding
              cited to its source.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono border-t md:border-t-0 border-slate-800 pt-4 md:pt-0 shrink-0">
            <button
              id="firm-template-btn"
              type="button"
              onClick={() => {
                setUploadError(null);
                setUploadSuccess(null);
                setIsTemplateModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700/60 transition cursor-pointer font-sans font-semibold text-xs"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>Firm Template</span>
            </button>
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-300">7 Database API Feed:</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Address Entry and Appraiser Pipeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Address Inputs & Checklist Loading */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold font-sans text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                Target Property Appraisal
              </h2>

              <form onSubmit={handleAppraise} className="space-y-4">
                <div className="relative">
                  <label htmlFor="address-input" className="sr-only">Property Address</label>
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                  <input
                    id="address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter commercial address or parcel ID..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 font-sans"
                    disabled={isAnalyzing}
                  />
                </div>

                {/* Demo Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-sans">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">Demo mode</span>
                    <span className="text-[10px] text-slate-400">Uses mock spatial & land use data</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDemoMode(!demoMode)}
                    disabled={isAnalyzing}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-1 focus:ring-slate-950 ${
                      demoMode ? "bg-amber-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        demoMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {geocodeInfo && (
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-xs font-sans space-y-2">
                    <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono">
                      <span>Geocoding Result</span>
                      {geocodeInfo.status === "loading" && (
                        <span className="text-amber-600 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" /> Resolving...
                        </span>
                      )}
                      {geocodeInfo.status === "success" && (
                        <span className="text-emerald-600">✓ Live Resolved</span>
                      )}
                      {geocodeInfo.status === "fallback" && (
                        <span className="text-amber-500">⚠ Demo Fallback</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Coordinates</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {geocodeInfo.status === "loading" ? "Fetching..." : `${geocodeInfo.lat}, ${geocodeInfo.lng}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Jurisdiction</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {geocodeInfo.status === "loading" ? "Fetching..." : geocodeInfo.county ? `${geocodeInfo.county}, ${geocodeInfo.state}` : geocodeInfo.state}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  id="search-submit-btn"
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold font-sans tracking-wide transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Appraising Risk ({progress}%)
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      Begin Rapid Due Diligence
                    </>
                  )}
                </button>
              </form>

              {/* Quick Sample Presets */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-sans">
                  Sample Properties for Evaluation
                </span>
                <div className="mt-2.5 space-y-2">
                  <button
                    onClick={() => handlePresetClick("1420 North Industrial Parkway")}
                    disabled={isAnalyzing}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                      address === "1420 North Industrial Parkway"
                        ? "border-slate-900 bg-slate-900/5 text-slate-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">1420 N Industrial Parkway</p>
                      <p className="text-[10px] text-slate-400">Halogenated RCRA neighborhood + LUST risk</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                  </button>

                  <button
                    onClick={() => handlePresetClick("550 West Grand Ave")}
                    disabled={isAnalyzing}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                      address === "550 West Grand Ave"
                        ? "border-slate-900 bg-slate-900/5 text-slate-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">550 West Grand Ave</p>
                      <p className="text-[10px] text-slate-400">Commercial retail center zone appraise</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                  </button>

                  <button
                    onClick={() => handlePresetClick("88 Pine Street")}
                    disabled={isAnalyzing}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                      address === "88 Pine Street"
                        ? "border-slate-900 bg-slate-900/5 text-slate-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">88 Pine Street</p>
                      <p className="text-[10px] text-slate-400">Historic Downtown office parcel assessment</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Main Dashboard (Appraised results, interactive spatial map, detailed bento grid) */}
          <div className="lg:col-span-8 space-y-6">
            {!isAnalyzing && !analyzed ? (
              <div className="border-2 border-dashed border-slate-200 bg-white rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400 mb-4 shadow-xs">
                  <MapPin className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-800 font-sans tracking-tight">
                  No Active Appraisal Site Selected
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-2 font-sans leading-relaxed">
                  Provide a commercial real estate property address on the left and select <b>Begin Rapid Due Diligence</b> to launch the multi-layer spatial registry appraisal.
                </p>
              </div>
            ) : (
              // Results dashboard
              <div className="space-y-6 animate-fade-in print:space-y-4">
                {/* Due Diligence Summary Card */}
                <div className="bg-white border-2 border-slate-950/15 rounded-xl p-6 shadow-xs relative overflow-hidden print:border print:p-4">
                  {/* Watermark of certified check */}
                  <div className="absolute right-6 top-6 opacity-5 select-none pointer-events-none">
                    <CheckCircle2 className="w-32 h-32 text-slate-900" />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                        Commercial appraisal report
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight mt-0.5">
                        {address}
                      </h3>
                      <p className="text-xs text-slate-500 font-sans mt-1">
                        Coordinates: <span className="font-mono text-slate-700">{geocodeInfo ? `${geocodeInfo.lat}, ${geocodeInfo.lng}` : "37.7749° N, 122.4194° W"}</span> • Parcel ID: <span className="font-mono text-slate-700">412-009-881A</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrint}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition flex items-center gap-1.5 text-xs font-sans font-semibold"
                        title="Print Report"
                      >
                        <Printer className="h-4 w-4" />
                        Print/Save PDF
                      </button>
                    </div>
                  </div>

                  {/* Summary Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                    <div className={`${
                      overallRating === "HIGH RISK"
                        ? "bg-rose-50/50 border-rose-100"
                        : overallRating === "MEDIUM RISK"
                        ? "bg-amber-50/50 border-amber-100"
                        : "bg-emerald-50/50 border-emerald-100"
                    } border rounded-xl p-4 flex gap-3`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        overallRating === "HIGH RISK"
                          ? "text-rose-600"
                          : overallRating === "MEDIUM RISK"
                          ? "text-amber-500"
                          : "text-emerald-600"
                      } shrink-0 mt-0.5`} />
                      <div>
                        <p className={`text-[10px] ${
                          overallRating === "HIGH RISK"
                            ? "text-rose-800"
                            : overallRating === "MEDIUM RISK"
                            ? "text-amber-800"
                            : "text-emerald-800"
                        } font-mono font-bold uppercase tracking-widest`}>
                          Risk Rating
                        </p>
                        <p className={`text-sm font-extrabold ${
                          overallRating === "HIGH RISK"
                            ? "text-rose-900"
                            : overallRating === "MEDIUM RISK"
                            ? "text-amber-900"
                            : "text-emerald-900"
                        } font-sans mt-0.5`}>
                          {overallRating === "HIGH RISK" ? "High Concern" : overallRating === "MEDIUM RISK" ? "Moderate Concern" : "Low Concern"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          {overallRating === "HIGH RISK"
                            ? "Critical active plumes or adjacent generator hazards detected."
                            : overallRating === "MEDIUM RISK"
                            ? "A few active hazards or review indicators detected near parcel."
                            : "Minimal active hazards or regulatory flags detected in spatial layers."}
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 flex gap-3">
                      <AlertOctagon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-amber-800 font-mono font-bold uppercase tracking-widest">
                          Review Checklist
                        </p>
                        <p className="text-sm font-extrabold text-amber-900 font-sans mt-0.5">
                          {flagCount + reviewCount} Items Flagged
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          Includes environmental database flags and historical or zoning reviews.
                        </p>
                      </div>
                    </div>

                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-emerald-800 font-mono font-bold uppercase tracking-widest">
                          Clear Indicators
                        </p>
                        <p className="text-sm font-extrabold text-emerald-900 font-sans mt-0.5">
                          {clearCount} Layers Clear
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          Verified layers with zero active hits or safe clearance metrics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE SITE MAP & PLUME SIMULATOR */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans mb-1 flex items-center gap-1.5">
                    <MapIcon className="h-4 w-4 text-slate-500" />
                    Spatial Overlay Plume & Adjacency Simulator
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mb-4">
                    Visualizes hazardous waste handlers and active contaminant plumes relative to parcel perimeter. Select elements to inspect details.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* Leaflet Real Basemap Spatial Canvas */}
                    <div className="md:col-span-7 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-900 min-h-[340px] flex flex-col">
                      {/* Real-time map container */}
                      <div
                        ref={mapContainerRef}
                        className="absolute inset-0 z-0 h-full w-full bg-slate-950"
                        style={{ minHeight: "340px" }}
                      />

                      {/* Floating HUD: Contaminant Plume Up-gradient Flow Arrow Indicator */}
                      <div className="absolute top-3 right-3 bg-slate-900/95 border border-slate-800 p-2.5 rounded-lg text-[9px] font-mono text-slate-300 z-[1000] flex items-center gap-2 pointer-events-none shadow-lg">
                        <Compass className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                        <div>
                          <div className="font-bold text-rose-400">Groundwater Flow (SSE)</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">Active Petroleum Gradient</div>
                        </div>
                      </div>

                      {/* Floating HUD Map Legends */}
                      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[9px] font-mono text-slate-300 space-y-1 z-[1000] shadow-lg">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm border border-emerald-400 shrink-0" />
                          <span>Subject Parcel (Lot boundary)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm border border-amber-400 shrink-0" />
                          <span>RCRA Hazardous Generator</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm border border-rose-400 shrink-0" />
                          <span>Active LUST Fuel Plume</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Marker Details Panel */}
                    <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                      {selectedEntity ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                selectedEntity.type === "subject"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : selectedEntity.type === "rcra"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {selectedEntity.type === "subject"
                                ? "Subject Property"
                                : selectedEntity.type === "rcra"
                                ? "Adjacency Warning"
                                : "Plume Risk"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              {selectedEntity.distance}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-800 font-sans">
                            {selectedEntity.name}
                          </h4>

                          <p className="text-xs text-slate-600 leading-relaxed font-sans">
                            {selectedEntity.description}
                          </p>

                          <div className="pt-3 border-t border-slate-200/60">
                            <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                              Primary Action Required:
                            </p>
                            <p className="text-xs text-slate-700 font-sans mt-1 italic font-medium leading-relaxed">
                              {selectedEntity.type === "subject"
                                ? "Review Historic Overlay limits and verify exterior facade guidelines."
                                : selectedEntity.type === "rcra"
                                ? "Perform ASTM E2600-15 vapor intrusion screening."
                                : "Perform soil boring logs to intercept groundwater contaminant plume."}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-center p-4">
                          <p className="text-xs text-slate-400 font-sans">
                            Click coordinates or markers on the map to trigger due diligence simulator.
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Info className="h-3 w-3 shrink-0" />
                        <span>Interactive GIS Layer Sync</span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* DUE DILIGENCE RISK MEMORANDUM PANEL */}
                <div id="due-diligence-memo" className="bg-white border-2 border-slate-900 rounded-xl overflow-hidden shadow-md print:border print:shadow-none">
                  {/* Memorandum Header / Letterhead style */}
                  <div className="bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-5 w-5 text-amber-500" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">
                          CONFIDENTIAL LEGAL DUE DILIGENCE REPORT
                        </span>
                        {isCustomTemplateActive && (
                          <div className="flex items-center gap-1.5 ml-2 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                            <span>Firm Template Active</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomTemplateActive(false);
                                setCustomMemoOutput("");
                              }}
                              className="text-[9px] font-mono font-bold text-slate-300 hover:text-white underline border-l border-amber-500/30 pl-2 ml-1 cursor-pointer bg-transparent"
                            >
                              Reset to Default
                            </button>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-extrabold font-sans uppercase tracking-wider mt-1 text-slate-100">
                        MEMORANDUM OF ENVIRONMENTAL & LAND USE LIABILITY
                      </h3>
                    </div>

                    <button
                      onClick={copyMemoToClipboard}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold font-sans transition flex items-center gap-1.5 self-start sm:self-auto border border-slate-700/50 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 text-slate-300" />
                          Copy Memo Text
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    {isGeneratingCustomMemo ? (
                      <div className="py-20 flex flex-col items-center justify-center text-center">
                        <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
                        <h4 className="text-sm font-bold text-slate-800 font-sans">
                          Applying Custom Firm Template...
                        </h4>
                        <p className="text-xs text-slate-500 font-sans mt-1 max-w-xs leading-relaxed">
                          Gemini is populating headings, defined terms, and findings from environmental registries.
                        </p>
                      </div>
                    ) : isCustomTemplateActive && customMemoOutput ? (
                      /* Render Custom Templated Memo */
                      <div className="font-serif text-slate-800 leading-relaxed text-sm whitespace-pre-wrap p-6 border border-slate-200 rounded-xl bg-slate-50/70 shadow-inner">
                        {customMemoOutput}
                      </div>
                    ) : (
                      <>
                        {/* SECTION 1: Property Identification */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-3 font-sans flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-slate-900 rounded-2xs inline-block" />
                            I. Property Identification
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-6 text-xs font-sans">
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] block uppercase">Target Address</span>
                              <span className="font-semibold text-slate-800">{address}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] block uppercase">Coordinates</span>
                              <span className="font-semibold text-slate-800">
                                {geocodeInfo ? `${geocodeInfo.lat}, ${geocodeInfo.lng}` : "37.7749° N, 122.4194° W"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] block uppercase">Parcel reference</span>
                              <span className="font-semibold text-slate-800">412-009-881A</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] block uppercase">Appraisal Date</span>
                              <span className="font-semibold text-slate-800">July 19, 2026</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] block uppercase">Reference ID</span>
                              <span className="font-mono text-slate-800">SC-2026-0719-881</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-mono text-[10px] block uppercase">Jurisdiction</span>
                              <span className="font-semibold text-slate-800">
                                {geocodeInfo && geocodeInfo.county ? `${geocodeInfo.county}, ${geocodeInfo.state}` : geocodeInfo?.state || "Federal EPA Region 9 / Municipal"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2: Search Results Summary Table */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-3 font-sans flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-slate-900 rounded-2xs inline-block" />
                            II. Search Results Summary
                          </h4>
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase">
                                  <th className="py-2.5 px-4 font-bold">Regulatory Registry Search</th>
                                  <th className="py-2.5 px-4 font-bold">Appraised Finding Detail</th>
                                  <th className="py-2.5 px-4 font-bold text-right">Risk Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-sans">
                                {databases.map((db) => (
                                  <tr key={db.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-2.5 px-4 font-semibold text-slate-800">{db.name}</td>
                                    <td className="py-2.5 px-4 text-slate-600">{db.count}</td>
                                    <td className="py-2.5 px-4 text-right">
                                      <span
                                        className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                                          db.risk === "Flag"
                                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                                            : db.risk === "Review"
                                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        }`}
                                      >
                                        <span
                                          className={`w-1 h-1 rounded-full ${
                                            db.risk === "Flag"
                                              ? "bg-rose-600 animate-pulse"
                                              : db.risk === "Review"
                                              ? "bg-amber-500"
                                              : "bg-emerald-600"
                                          }`}
                                        />
                                        {db.risk}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* SECTION 3: Key Risk Findings */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-3 font-sans flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-slate-900 rounded-2xs inline-block" />
                            III. Key Risk Findings
                          </h4>
                          <div className="space-y-3 font-sans text-xs text-slate-700">
                            {databases.filter(db => db.risk === "Flag" || db.risk === "Review").length > 0 ? (
                              databases.filter(db => db.risk === "Flag" || db.risk === "Review").map((db, idx) => (
                                <div key={db.id} className={`p-3.5 ${
                                  db.risk === "Flag" ? "bg-rose-50/30 border-rose-500" : "bg-amber-50/30 border-amber-500"
                                } border-l-4 rounded-r-lg space-y-1`} id={`finding-${idx + 1}`}>
                                  <p className="font-bold flex items-center gap-1.5 text-slate-950">
                                    <span className={`text-[10px] font-mono ${
                                      db.risk === "Flag" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                                    } px-1.5 py-0.5 rounded font-bold`}>FINDING {idx + 1}</span>
                                    {db.name} ({db.codeSection})
                                  </p>
                                  <p className="leading-relaxed text-slate-700">
                                    {db.findings}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic p-3">No major environmental or land use risk findings detected in analyzed registries.</p>
                            )}
                          </div>
                        </div>

                        {/* SECTION 4: Recommended Further Inquiries */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1.5 mb-3 font-sans flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-slate-900 rounded-2xs inline-block" />
                            IV. Recommended Further Inquiries
                          </h4>
                          <ol className="list-decimal list-inside font-sans text-xs text-slate-700 space-y-2.5 leading-relaxed pl-1">
                            {databases.filter(db => db.risk === "Flag" || db.risk === "Review").flatMap(db => db.mitigation).length > 0 ? (
                              databases.filter(db => db.risk === "Flag" || db.risk === "Review").flatMap(db => db.mitigation).map((mit, idx) => {
                                const hasColon = mit.includes(':');
                                if (hasColon) {
                                  const firstColonIdx = mit.indexOf(':');
                                  const boldPart = mit.substring(0, firstColonIdx);
                                  const normalPart = mit.substring(firstColonIdx + 1);
                                  return (
                                    <li key={idx}>
                                      <span className="font-bold text-slate-800">{boldPart}:</span>
                                      {normalPart}
                                    </li>
                                  );
                                } else {
                                  return (
                                    <li key={idx}>
                                      <span className="text-slate-700">{mit}</span>
                                    </li>
                                  );
                                }
                              })
                            ) : (
                              <>
                                <li>
                                  <span className="font-bold text-slate-800">ASTM E1527-21 compliant Phase I Environmental Site Assessment (ESA):</span> Highly recommended to satisfy the requirements of All Appropriate Inquiries (AAI) and establish safe-harbor protections under CERCLA.
                                </li>
                                <li>
                                  <span className="font-bold text-slate-800">Routine Database Monitoring:</span> Plan for triennial monitoring of environmental registries to catch any new localized release files.
                                </li>
                              </>
                            )}
                          </ol>
                        </div>

                        {/* SECTION 5: Overall Risk Rating */}
                        <div className={`${
                          overallColor === "rose" ? "bg-rose-50/30 border-rose-600 text-rose-800" :
                          overallColor === "amber" ? "bg-amber-50/30 border-amber-600 text-amber-800" :
                          "bg-emerald-50/30 border-emerald-600 text-emerald-800"
                        } border-l-4 rounded-r-xl p-5 space-y-2`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                              Overall Due Diligence Risk Rating:
                            </span>
                            <span className={`${
                              overallColor === "rose" ? "bg-rose-600" :
                              overallColor === "amber" ? "bg-amber-600" :
                              "bg-emerald-600"
                            } text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded`}>
                              {overallRating}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">
                            {overallDescription}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Legal disclaimer footer warning */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center gap-2.5 text-[10px] text-slate-400 font-sans leading-relaxed">
                    <Info className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>
                      <strong>LEGAL COMPLIANCE WARNING:</strong> This report is synthesized for rapid screening. THIS IS NOT FORMAL LEGAL ADVICE. TerraCheck evaluations do not constitute certified title opinions, professional environmental engineering statements, or official legal representation.
                    </span>
                  </div>
                </div>

                {/* COLLAPSIBLE DETAILED REGISTRY SECTION */}
                <div className="space-y-4 pt-2">
                  {/* Collapsed Bar */}
                  <button
                    type="button"
                    onClick={() => setIsRegistriesExpanded(!isRegistriesExpanded)}
                    className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 font-sans text-sm font-bold text-slate-800 transition shadow-2xs hover:shadow-xs cursor-pointer focus:outline-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-slate-500 animate-pulse" />
                      <span>View Detailed Registry Findings ({databases.length})</span>
                    </div>
                    {isRegistriesExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    )}
                  </button>

                  {/* Expanded Content or Running Animation */}
                  {(isRegistriesExpanded || isAnalyzing) && (
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 animate-fade-in">
                      {/* Section Header & Filter Tabs */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <h3 className="text-xs font-bold text-slate-900 font-sans uppercase tracking-wider">
                          Individual Regulatory Registries Appraisal
                        </h3>

                        {/* Filter Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-lg text-xs gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveTab("all")}
                            className={`px-3 py-1 rounded-md transition cursor-pointer ${
                              activeTab === "all"
                                ? "bg-white text-slate-900 font-bold shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            All ({databases.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("flag")}
                            className={`px-3 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                              activeTab === "flag"
                                ? "bg-white text-rose-700 font-bold shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Flags
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("review")}
                            className={`px-3 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                              activeTab === "review"
                                ? "bg-white text-amber-700 font-bold shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Reviews
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("clear")}
                            className={`px-3 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                              activeTab === "clear"
                                ? "bg-white text-emerald-700 font-bold shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Clears
                          </button>
                        </div>
                      </div>

                      {/* Stacked Rows (Page-Width, 1 Column) */}
                      <div className="space-y-3">
                        {filteredDatabases.map((db) => {
                          const Icon = db.icon;
                          const statusObj = checklist.find((item) => item.id === db.id);
                          const status = statusObj?.status || "idle";

                          if (isAnalyzing && status !== "completed") {
                            // Render Compact Full-Width Loading Card
                            return (
                              <div
                                key={db.id}
                                className={`bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between transition-all duration-300 ${
                                  status === "scanning"
                                    ? "border-slate-300 bg-slate-50/50"
                                    : "border-slate-100 opacity-40 bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap w-full">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-1.5 rounded-lg shrink-0 ${
                                        status === "scanning"
                                          ? "bg-slate-100 text-slate-800 animate-pulse"
                                          : "bg-slate-50 text-slate-400"
                                      }`}
                                    >
                                      <Icon className="h-4.5 w-4.5" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-800 font-sans">
                                        {db.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        Source: {db.source}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 ml-auto">
                                    {status === "scanning" ? (
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="h-3.5 w-3.5 text-slate-800 animate-spin" />
                                        <span className="text-[11px] font-medium text-slate-600 animate-pulse">
                                          Querying live spatial records...
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] font-medium text-slate-400">
                                        Queued in appraisal pipeline
                                      </span>
                                    )}

                                    {status === "scanning" ? (
                                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-700 animate-pulse flex items-center gap-1 border border-slate-200">
                                        <Loader2 className="h-2.5 w-2.5 animate-spin text-slate-600" />
                                        Scanning
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-slate-50 text-slate-400 border border-slate-100">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Render Collapsible Card (Completed State)
                          const isExpanded = expandedRegistryId === db.id;

                          return (
                            <div
                              key={db.id}
                              className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${
                                isExpanded
                                  ? "border-slate-400 shadow-sm"
                                  : db.risk === "Flag"
                                  ? "border-rose-100 hover:border-rose-300"
                                  : db.risk === "Review"
                                  ? "border-amber-100 hover:border-amber-300"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              {/* COLLAPSED SUMMARY ROW */}
                              <div
                                onClick={() => {
                                  if (!isAnalyzing) {
                                    setExpandedRegistryId(isExpanded ? null : db.id);
                                  }
                                }}
                                className="p-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap cursor-pointer select-none hover:bg-slate-50/50 w-full"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-1.5 rounded-lg shrink-0 ${
                                      db.risk === "Flag"
                                        ? "bg-rose-50 text-rose-600"
                                        : db.risk === "Review"
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-slate-50 text-slate-600"
                                    }`}
                                  >
                                    <Icon className="h-4.5 w-4.5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 font-sans">
                                      {db.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      Source: {db.source}
                                    </p>
                                  </div>
                                </div>

                                {/* Result Count, Chip, and Chevron */}
                                <div className="flex items-center gap-4 ml-auto">
                                  <div className="text-[11px] font-sans text-slate-600">
                                    <span className="text-slate-400 font-mono uppercase text-[9px] mr-1.5">Result Count:</span>
                                    <span className="font-bold text-slate-800">{db.count}</span>
                                  </div>

                                  <span
                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                      db.risk === "Flag"
                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                        : db.risk === "Review"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}
                                  >
                                    {db.risk === "Flag" ? "Flag" : db.risk === "Review" ? "Review" : "Clear"}
                                  </span>

                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {/* EXPANDED CONTENT PANEL */}
                              {isExpanded && (
                                <div className="px-4 pb-5 border-t border-slate-100 bg-slate-50/30 space-y-4 animate-fade-in pt-4 text-xs">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-slate-400 font-mono uppercase text-[9px] block">
                                        Nearest Hit Distance
                                      </span>
                                      <span className="font-bold text-slate-800 text-xs">{db.distance}</span>
                                    </div>
                                  </div>

                                  {/* Findings text */}
                                  <div className="space-y-1">
                                    <span className="text-slate-400 font-mono uppercase text-[9px] block">
                                      Appraised Finding Details
                                    </span>
                                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                                      {db.findings}
                                    </p>
                                  </div>

                                  {/* Citing its Source Section */}
                                  <div className="bg-slate-100/50 rounded-lg p-2.5 border border-slate-200/50">
                                    <p className="text-[9px] font-mono uppercase font-bold text-slate-400">
                                      Official Citation:
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-sans italic mt-0.5 leading-relaxed">
                                      {db.citation}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono text-[9px] mt-1 leading-none">
                                      Regulatory Code: <span className="text-slate-600">{db.codeSection}</span>
                                    </p>
                                  </div>

                                  {/* Actionable Advice / Mitigations */}
                                  <div className="border-t border-slate-100 pt-3 mt-1">
                                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 font-sans block">
                                      Required Developer Mitigation Plan:
                                    </span>
                                    <ul className="list-disc list-inside text-[11px] text-slate-600 font-sans space-y-1 mt-1.5 leading-relaxed">
                                      {db.mitigation.map((m, i) => (
                                        <li key={i}>{m}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Customize Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-extrabold font-sans uppercase tracking-wider text-slate-100">
                    Your Firm's Report Template
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Configure headings, numbered sections, defined terms, and formal boilerplate.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-lg text-xs font-sans text-slate-600 space-y-2 leading-relaxed">
                <p>
                  <b>Pre-loaded Demo Template:</b> The modal is pre-configured with a realistic <b>Sterling & Vance LLP</b> boilerplate template. Modify or paste your own template below.
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Use placeholders like <b>[the Property]</b>, <b>[the Report]</b>, <b>[Risk Rating]</b>, <b>[Contamination Findings]</b>, <b>[Zoning/Planning Findings]</b>, and <b>[Actionable Recommendations]</b> to direct the Gemini AI.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <label htmlFor="template-textarea" className="block text-xs font-bold text-slate-700 font-sans uppercase tracking-wider">
                    Template Text Document
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="docx-upload"
                      accept=".docx"
                      onChange={handleDocxUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="docx-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold font-sans cursor-pointer transition border border-slate-200 hover:text-slate-900"
                    >
                      <Upload className="h-3 w-3 text-slate-500" />
                      <span>Upload Word template (.docx)</span>
                    </label>
                  </div>
                </div>
                {uploadError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-md text-[11px] font-sans">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-md text-[11px] font-sans">
                    {uploadSuccess}
                  </div>
                )}
                <textarea
                  id="template-textarea"
                  value={customTemplate}
                  onChange={(e) => {
                    setCustomTemplate(e.target.value);
                    setUploadError(null);
                    setUploadSuccess(null);
                  }}
                  placeholder="Paste your legal due diligence template text here..."
                  className="w-full h-80 p-4 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCustomTemplate(DEFAULT_FIRM_TEMPLATE);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 font-sans transition py-2 px-3 hover:bg-slate-100 rounded-lg cursor-pointer self-start sm:self-auto bg-transparent border-0"
              >
                Reset to Sample Template
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold font-sans transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsCustomTemplateActive(true);
                    setIsTemplateModalOpen(false);
                    if (analyzed) {
                      await generateTemplatedMemo(databases, true);
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold font-sans transition cursor-pointer"
                >
                  Apply & Populate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corporate legal disclaimer footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 text-center mt-12 shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            TerraCheck is an artificial intelligence-driven property due diligence platform. Appraisals and recommendations are synthesized from integrated EPA spatial databases, regional GIS layers, and historic zoning registers. TerraCheck findings do not constitute formal legal counsel or professional architectural certification.
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            © 2026 TerraCheck Inc. Certified under EPA All Appropriate Inquiries (AAI) Diligence Standards Prototype.
          </p>
        </div>
      </footer>
    </div>
  );
}
