import type { CSSProperties } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Info, Shield, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  About Iowa Water Quality Dashboard
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  A comprehensive platform for monitoring water quality across
                  Iowa&rsquo;s public water systems and recreational sites.
                </p>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Project Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The Iowa Water Quality Dashboard provides real-time
                      monitoring of water contaminants including nitrate,
                      nitrite, E. coli, PFAS, arsenic, disinfection byproducts,
                      and fluoride across Iowa&rsquo;s public water systems and
                      recreational sites.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Real-time Data</Badge>
                      <Badge variant="secondary">EPA Standards</Badge>
                      <Badge variant="secondary">Public Health</Badge>
                      <Badge variant="secondary">Transparency</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Data Sources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Primary Sources</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Iowa Department of Natural Resources (DNR)</li>
                        <li>
                          • EPA Safe Drinking Water Information System (SDWIS)
                        </li>
                        <li>• Iowa DNR Beach Monitoring Program</li>
                        <li>• USGS Water Quality Monitoring</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Update Frequency</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Drinking water: Monthly to quarterly</li>
                        <li>• Recreational water: Weekly during season</li>
                        <li>• Advisories: Real-time</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Methodology
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Status Determination
                        </h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span>Safe: Below 50% of EPA standard</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span>
                              Warning: 50-100% of standard or stale data
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span>Alert: At or above standard</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resources & Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href="https://www.epa.gov/ground-water-and-drinking-water"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          EPA Drinking Water Standards
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href="https://www.iowadnr.gov/Environmental-Protection/Water-Quality"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Iowa DNR Water Quality
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href="https://www.cdc.gov/healthywater/drinking/public/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          CDC Public Water Systems
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Disclaimer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This dashboard provides information for general public
                  awareness and should not be used as the sole basis for health
                  decisions. Always consult with local health authorities and
                  water utilities for the most current information. Data may
                  have delays and should be verified with official sources for
                  critical health decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
