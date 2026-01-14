import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Database,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { moduleGuides } from '@/lib/help/moduleGuidesContent';
import type { ModuleGuide } from '@/lib/help/types';

/**
 * ModuleGuidesTab Component - Displays accordion-based module documentation
 * Requirements: 3.1 - Display accordion/collapsible list with one section per module
 * Requirements: 3.2 - Display purpose, required data, step-by-step usage, expected outputs,
 *               empty-state causes, KPI definitions, export notes
 * Requirements: 3.3 - Include guides for all 9 modules
 * Requirements: 3.4 - Link KPIs/terms to glossary entries
 * Requirements: 3.5 - List specific API endpoints and MongoDB collections
 */

interface ModuleAccordionItemProps {
  guide: ModuleGuide;
  isExpanded: boolean;
  onToggle: () => void;
}

function ModuleAccordionItem({ guide, isExpanded, onToggle }: ModuleAccordionItemProps) {
  const Icon = guide.icon;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{guide.moduleName}</h3>
          <p className="text-sm text-muted-foreground truncate">{guide.purpose.slice(0, 80)}...</p>
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-6 border-t border-border pt-4">
              {/* Purpose */}
              <Section title="Purpose">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {guide.purpose}
                </p>
              </Section>

              {/* Required Data */}
              <Section title="Required Data" icon={Database}>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Collections */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      MongoDB Collections
                    </h5>
                    {guide.requiredData.collections.length > 0 ? (
                      <ul className="space-y-1">
                        {guide.requiredData.collections.map((collection) => (
                          <li
                            key={collection}
                            className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded inline-block mr-2 mb-1"
                          >
                            {collection}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No collections required</p>
                    )}
                  </div>

                  {/* Endpoints */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      API Endpoints
                    </h5>
                    {guide.requiredData.endpoints.length > 0 ? (
                      <ul className="space-y-1">
                        {guide.requiredData.endpoints.map((endpoint) => (
                          <li
                            key={endpoint}
                            className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded"
                          >
                            {endpoint}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No endpoints required</p>
                    )}
                  </div>
                </div>
              </Section>

              {/* Step-by-Step Usage */}
              <Section title="Step-by-Step Usage" icon={CheckCircle}>
                <ol className="space-y-2">
                  {guide.stepByStepUsage.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </Section>

              {/* Expected Outputs */}
              <Section title="Expected Outputs" icon={FileText}>
                <ul className="space-y-1.5">
                  {guide.expectedOutputs.map((output, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-success mt-0.5">•</span>
                      {output}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Empty State Causes */}
              <Section title="Common Empty-State Causes" icon={AlertCircle}>
                <ul className="space-y-1.5">
                  {guide.emptyStateCauses.map((cause, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-warning mt-0.5">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* KPI Definitions */}
              {guide.kpiDefinitions.length > 0 && (
                <Section title="Key KPI Definitions">
                  <div className="space-y-3">
                    {guide.kpiDefinitions.map((kpi) => (
                      <div
                        key={kpi.term}
                        className="bg-muted/50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {kpi.term}
                          </span>
                          {kpi.glossaryId && (
                            <Link
                              to={`/help?tab=glossary&term=${kpi.glossaryId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              View in Glossary
                            </Link>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{kpi.definition}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Export Notes */}
              {guide.exportNotes && (
                <Section title="Export Notes">
                  <p className="text-sm text-muted-foreground">{guide.exportNotes}</p>
                </Section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: typeof Database;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function ModuleGuidesTab() {
  const [expandedId, setExpandedId] = useState<string | null>(moduleGuides[0]?.id || null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Module Guides</h2>
          <p className="text-sm text-muted-foreground">
            Detailed documentation for each dashboard module
          </p>
        </div>
      </motion.div>

      {/* Accordion */}
      <div className="space-y-3">
        {moduleGuides.map((guide) => (
          <ModuleAccordionItem
            key={guide.id}
            guide={guide}
            isExpanded={expandedId === guide.id}
            onToggle={() => handleToggle(guide.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ModuleGuidesTab;
