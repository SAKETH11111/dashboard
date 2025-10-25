"use client";

import * as React from "react";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Contaminant } from "@/types/water";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type ContaminantInfo = {
  name: string;
  description: string;
  healthEffects: string[];
  sources: string[];
  mcl: number;
  unit: string;
  healthCopy: string;
  color: string;
};

const contaminantInfo: Record<Contaminant, ContaminantInfo> = {
  [Contaminant.NITRATE]: {
    name: "Nitrate",
    description:
      "Nitrate is a chemical compound that can be found naturally in soil and water, but elevated levels often come from agricultural runoff, septic systems, and industrial waste.",
    healthEffects: [
      "Blue baby syndrome (methemoglobinemia) in infants under 6 months",
      "Reduced oxygen transport in blood",
      "Potential increased risk of certain cancers with long-term exposure",
    ],
    sources: [
      "Agricultural fertilizers and manure",
      "Septic system leakage",
      "Industrial waste",
      "Natural soil processes",
    ],
    mcl: 10,
    unit: "mg/L",
    healthCopy:
      "Safe for adults, but can cause serious health problems in infants",
    color: "bg-blue-500",
  },
  [Contaminant.NITRITE]: {
    name: "Nitrite",
    description:
      "Nitrite is a chemical compound that can form from nitrate in water and is often an indicator of bacterial contamination or incomplete water treatment.",
    healthEffects: [
      "More severe than nitrate - can cause immediate health effects",
      "Methemoglobinemia in infants and adults",
      "Potential carcinogenic effects",
    ],
    sources: [
      "Bacterial reduction of nitrate",
      "Incomplete water treatment",
      "Industrial processes",
      "Natural water chemistry",
    ],
    mcl: 1,
    unit: "mg/L",
    healthCopy: "Immediate health concern - avoid consumption",
    color: "bg-orange-500",
  },
  [Contaminant.ECOLI]: {
    name: "E. coli Bacteria",
    description:
      "Escherichia coli is a type of bacteria that lives in the intestines of humans and animals. While most strains are harmless, some can cause serious illness.",
    healthEffects: [
      "Gastrointestinal illness",
      "Diarrhea, vomiting, and stomach cramps",
      "Severe cases can lead to kidney failure",
      "Can be life-threatening for vulnerable populations",
    ],
    sources: [
      "Human and animal fecal contamination",
      "Sewage overflows",
      "Agricultural runoff",
      "Wildlife waste",
    ],
    mcl: 0,
    unit: "CFU/100mL",
    healthCopy: "Any detection indicates potential health risk",
    color: "bg-red-500",
  },
  [Contaminant.PFAS]: {
    name: "PFAS (Per- and Polyfluoroalkyl Substances)",
    description:
      "PFAS are a group of man-made chemicals that have been used in a variety of industries around the globe, including in firefighting foams, non-stick cookware, and water-repellent clothing.",
    healthEffects: [
      "Increased cholesterol levels",
      "Changes in liver enzymes",
      "Decreased vaccine response in children",
      "Increased risk of certain cancers",
      "Developmental effects in children",
    ],
    sources: [
      "Firefighting foam",
      "Industrial manufacturing",
      "Landfills and waste disposal",
      "Consumer products",
    ],
    mcl: 4,
    unit: "ng/L",
    healthCopy: "Emerging contaminant with evolving health standards",
    color: "bg-purple-500",
  },
  [Contaminant.ARSENIC]: {
    name: "Arsenic",
    description:
      "Arsenic is a naturally occurring element that can be found in rocks, soil, water, and air. It can also be released into the environment through industrial activities.",
    healthEffects: [
      "Skin damage and problems with circulatory systems",
      "Increased risk of cancer",
      "Neurological effects",
      "Developmental effects in children",
    ],
    sources: [
      "Natural geological deposits",
      "Industrial activities",
      "Agricultural pesticides (historical)",
      "Mining operations",
    ],
    mcl: 10,
    unit: "μg/L",
    healthCopy: "Long-term exposure increases cancer risk",
    color: "bg-gray-500",
  },
  [Contaminant.DBP]: {
    name: "Disinfection Byproducts (DBPs)",
    description:
      "DBPs are chemicals that form when disinfectants used to treat drinking water react with naturally occurring organic matter in water.",
    healthEffects: [
      "Increased risk of bladder cancer",
      "Reproductive and developmental effects",
      "Liver, kidney, and central nervous system problems",
      "Potential increased risk of miscarriage",
    ],
    sources: [
      "Chlorine disinfection of water",
      "Natural organic matter in source water",
      "Water treatment processes",
      "Distribution system reactions",
    ],
    mcl: 80,
    unit: "μg/L",
    healthCopy: "Long-term exposure may increase cancer risk",
    color: "bg-yellow-500",
  },
  [Contaminant.FLUORIDE]: {
    name: "Fluoride",
    description:
      "Fluoride is a naturally occurring mineral that is added to many public water supplies to help prevent tooth decay. However, too much fluoride can cause health problems.",
    healthEffects: [
      "Dental fluorosis (tooth discoloration) in children",
      "Skeletal fluorosis with very high levels",
      "Bone and joint pain",
      "Thyroid problems",
    ],
    sources: [
      "Natural geological deposits",
      "Water fluoridation programs",
      "Industrial processes",
      "Agricultural runoff",
    ],
    mcl: 4,
    unit: "mg/L",
    healthCopy: "Beneficial at low levels, harmful at high levels",
    color: "bg-cyan-500",
  },
};

type ContaminantInfoCardProps = {
  contaminant: Contaminant;
  currentValue?: number;
  unit?: string;
  status?: "safe" | "warn" | "alert";
};

export function ContaminantInfoCard({
  contaminant,
  currentValue,
  unit,
  status,
}: ContaminantInfoCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const info = contaminantInfo[contaminant];

  const getStatusIcon = () => {
    switch (status) {
      case "safe":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "alert":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "safe":
        return "border-green-200 bg-green-50";
      case "warn":
        return "border-yellow-200 bg-yellow-50";
      case "alert":
        return "border-red-200 bg-red-50";
      default:
        return "border-muted";
    }
  };

  return (
    <Card className={`transition-all ${getStatusColor()}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {info.name}
              {getStatusIcon()}
            </CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            MCL: {info.mcl} {info.unit}
          </Badge>
        </div>

        {currentValue !== undefined && (
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current Level: </span>
              <span className="font-medium">
                {currentValue} {unit || info.unit}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Health Status: </span>
              <span className="font-medium">{info.healthCopy}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
            >
              <span className="text-sm font-medium">
                Show detailed information
              </span>
              <span className="text-xs text-muted-foreground">
                {isExpanded ? "Hide" : "Show"}
              </span>
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Health Effects</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {info.healthEffects.map((effect, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Common Sources</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {info.sources.map((source, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{source}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <h4 className="font-medium text-sm mb-2">
                Maximum Contaminant Level (MCL)
              </h4>
              <p className="text-sm text-muted-foreground">
                The EPA has set a maximum contaminant level of{" "}
                <strong>
                  {info.mcl} {info.unit}
                </strong>{" "}
                for {info.name.toLowerCase()}. This is the highest level of a
                contaminant that is allowed in drinking water.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
