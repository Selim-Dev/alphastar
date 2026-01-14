import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Link2,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  Wallet
} from 'lucide-react';
import { Button, Input, Select, FormField } from '@/components/ui/Form';
import { useGenerateAOGSpend, useUpdateAOGBudgetIntegration } from '@/hooks/useAOGEvents';
import { usePermissions } from '@/hooks/usePermissions';
import type { AOGEvent, CostAuditEntry } from '@/types';

interface CostsTabProps {
  aogEvent: AOGEvent;
  onUpdate?: () => void;
}

// Budget clause options (from system architecture)
const BUDGET_CLAUSE_OPTIONS = [
  { value: '1', label: '1 - Aircraft Lease' },
  { value: '2', label: '2 - Airframe Maintenance' },
  { value: '3', label: '3 - Engines and APU Corporate Care Program' },
  { value: '4', label: '4 - Landing Gear Overhaul' },
  { value: '5', label: '5 - Component Repair' },
  { value: '6', label: '6 - Spare Parts' },
  { value: '7', label: '7 - Consumables' },
  { value: '8', label: '8 - Ground Support Equipment' },
  { value: '9', label: '9 - Fuel' },
  { value: '10', label: '10 - Subscriptions' },
  { value: '11', label: '11 - Insurance' },
  { value: '12', label: '12 - Cabin Crew' },
  { value: '13', label: '13 - Manpower' },
  { value: '14', label: '14 - Handling and Permits' },
  { value: '15', label: '15 - Catering' },
  { value: '16', label: '16 - Communication' },
  { value: '17', label: '17 - Miscellaneous' },
  { value: '18', label: '18 - Training' },
];

// Generate spend form schema
const generateSpendSchema = z.object({
  budgetClauseId: z.coerce.number().min(1, 'Budget clause is required'),
  budgetPeriod: z.string().min(1, 'Period is required'),
  notes: z.string().optional(),
});

type GenerateSpendFormData = z.infer<typeof generateSpendSchema>;

// Cost card component
function CostCard({ 
  label, 
  estimated, 
  actual, 
  icon: Icon 
}: { 
  label: string; 
  estimated?: number; 
  actual?: number;
  icon: React.ElementType;
}) {
  const hasEstimated = estimated !== undefined && estimated > 0;
  const hasActual = actual !== undefined && actual > 0;
  const variance = hasEstimated && hasActual ? actual - estimated : null;
  const variancePercent = variance !== null && estimated ? ((variance / estimated) * 100) : null;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      
      <div className="space-y-2">
        {/* Estimated */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estimated</span>
          <span className="text-sm font-medium text-foreground">
            {hasEstimated ? `$${estimated.toLocaleString()}` : '—'}
          </span>
        </div>
        
        {/* Actual */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Actual</span>
          <span className={`text-sm font-medium ${hasActual ? 'text-green-600' : 'text-foreground'}`}>
            {hasActual ? `$${actual.toLocaleString()}` : '—'}
          </span>
        </div>
        
        {/* Variance */}
        {variance !== null && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Variance</span>
            <div className="flex items-center gap-1">
              {variance > 0 ? (
                <TrendingUp className="w-3 h-3 text-red-500" />
              ) : variance < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : null}
              <span className={`text-xs font-medium ${
                variance > 0 ? 'text-red-500' : variance < 0 ? 'text-green-500' : 'text-muted-foreground'
              }`}>
                {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                {variancePercent !== null && ` (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Audit trail entry component
function AuditEntry({ entry }: { entry: CostAuditEntry }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <History className="w-3 h-3 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground capitalize">
            {entry.field.replace('cost', '')}
          </span>
          <span className="text-muted-foreground">changed from</span>
          <span className="text-red-500">${entry.previousValue.toLocaleString()}</span>
          <span className="text-muted-foreground">to</span>
          <span className="text-green-600">${entry.newValue.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(entry.changedAt), 'MMM dd, yyyy HH:mm')}</span>
          {entry.reason && (
            <>
              <span>•</span>
              <span>{entry.reason}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CostsTab({ aogEvent, onUpdate }: CostsTabProps) {
  const { canWrite } = usePermissions();
  const generateSpendMutation = useGenerateAOGSpend();
  const updateBudgetMutation = useUpdateAOGBudgetIntegration();
  
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const form = useForm<GenerateSpendFormData>({
    resolver: zodResolver(generateSpendSchema) as never,
    defaultValues: {
      budgetClauseId: aogEvent.budgetClauseId || 0,
      budgetPeriod: aogEvent.budgetPeriod || format(new Date(), 'yyyy-MM'),
      notes: '',
    },
  });

  // Calculate totals
  const totalEstimated = (aogEvent.estimatedCostLabor || 0) + 
                         (aogEvent.estimatedCostParts || 0) + 
                         (aogEvent.estimatedCostExternal || 0);
  const totalActual = (aogEvent.costLabor || 0) + 
                      (aogEvent.costParts || 0) + 
                      (aogEvent.costExternal || 0);

  const hasLinkedSpend = !!aogEvent.linkedActualSpendId;
  const isBudgetAffecting = aogEvent.isBudgetAffecting;

  const handleGenerateSpend = async (data: GenerateSpendFormData) => {
    try {
      await generateSpendMutation.mutateAsync({
        id: aogEvent._id,
        budgetClauseId: data.budgetClauseId,
        budgetPeriod: data.budgetPeriod,
        notes: data.notes,
      });
      setShowGenerateForm(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to generate spend:', error);
    }
  };

  const handleToggleBudgetAffecting = async () => {
    try {
      await updateBudgetMutation.mutateAsync({
        id: aogEvent._id,
        isBudgetAffecting: !isBudgetAffecting,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update budget integration:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-primary" />
          Cost Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CostCard
            label="Labor"
            estimated={aogEvent.estimatedCostLabor}
            actual={aogEvent.costLabor}
            icon={DollarSign}
          />
          <CostCard
            label="Parts"
            estimated={aogEvent.estimatedCostParts}
            actual={aogEvent.costParts}
            icon={DollarSign}
          />
          <CostCard
            label="External"
            estimated={aogEvent.estimatedCostExternal}
            actual={aogEvent.costExternal}
            icon={DollarSign}
          />
        </div>

        {/* Total */}
        <div className="mt-4 bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Total Cost</span>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                ${totalActual.toLocaleString()}
              </div>
              {totalEstimated > 0 && (
                <div className="text-xs text-muted-foreground">
                  Estimated: ${totalEstimated.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Integration */}
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-primary" />
          Budget Integration
        </h3>

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          {/* Budget affecting toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Budget Affecting</p>
              <p className="text-sm text-muted-foreground">
                {isBudgetAffecting 
                  ? 'This AOG cost affects budget variance calculations'
                  : 'This AOG cost is informational only'}
              </p>
            </div>
            {canWrite && (
              <Button
                variant={isBudgetAffecting ? 'primary' : 'outline'}
                size="sm"
                onClick={handleToggleBudgetAffecting}
                isLoading={updateBudgetMutation.isPending}
              >
                {isBudgetAffecting ? 'Enabled' : 'Disabled'}
              </Button>
            )}
          </div>

          {/* Budget clause mapping */}
          {aogEvent.budgetClauseId && (
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Mapped to:</span>
              <span className="font-medium text-foreground">
                Clause {aogEvent.budgetClauseId}
              </span>
              {aogEvent.budgetPeriod && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground">{aogEvent.budgetPeriod}</span>
                </>
              )}
            </div>
          )}

          {/* Linked ActualSpend status */}
          {hasLinkedSpend ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">
                ActualSpend entry has been generated for this AOG
              </span>
            </div>
          ) : totalActual > 0 && canWrite ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-600">
                  No ActualSpend entry generated yet
                </span>
              </div>
              
              {!showGenerateForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateForm(true)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Generate ActualSpend
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/30 rounded-lg p-4"
                  >
                    <form onSubmit={form.handleSubmit(handleGenerateSpend)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Budget Clause" error={form.formState.errors.budgetClauseId} required>
                          <Select
                            {...form.register('budgetClauseId')}
                            options={BUDGET_CLAUSE_OPTIONS}
                          />
                        </FormField>
                        <FormField label="Period (YYYY-MM)" error={form.formState.errors.budgetPeriod} required>
                          <Input
                            type="month"
                            {...form.register('budgetPeriod')}
                          />
                        </FormField>
                      </div>
                      <FormField label="Notes">
                        <Input
                          {...form.register('notes')}
                          placeholder="Optional notes..."
                        />
                      </FormField>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Amount: <span className="font-medium text-foreground">${totalActual.toLocaleString()}</span>
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowGenerateForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            isLoading={generateSpendMutation.isPending}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      {generateSpendMutation.isError && (
                        <p className="text-sm text-destructive">
                          Failed to generate ActualSpend. It may already exist.
                        </p>
                      )}
                    </form>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Cost Audit Trail */}
      {aogEvent.costAuditTrail && aogEvent.costAuditTrail.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-primary" />
            Cost Change History
          </h3>
          
          <div className="bg-card border border-border rounded-lg p-4">
            {aogEvent.costAuditTrail.map((entry, index) => (
              <AuditEntry key={`${entry.changedAt}-${index}`} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for audit trail */}
      {(!aogEvent.costAuditTrail || aogEvent.costAuditTrail.length === 0) && (
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No cost changes recorded yet.</p>
        </div>
      )}
    </div>
  );
}

export default CostsTab;
