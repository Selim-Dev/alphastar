import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookA, MapPin, Calculator, Lightbulb, Tag, Link2 } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  glossaryEntries,
  glossaryCategories,
} from '@/lib/help/glossaryContent';
import {
  filterGlossary,
  getCategoryCounts,
  sortGlossaryAlphabetically,
} from '@/lib/help/glossarySearch';
import type { GlossaryEntry, GlossaryCategory } from '@/lib/help/types';

/**
 * GlossaryTab Component - Searchable glossary with category filters
 * Requirements: 4.1 - Display search input field and categorized list
 * Requirements: 4.2 - Filter entries in real-time by term, acronym, or definition
 * Requirements: 4.3 - Show term, definition, where it appears, calculation, importance, example
 * Requirements: 4.4 - Include at least 25 aviation/MRO terms
 * Requirements: 4.5 - Organize entries by category tags
 */

const categoryColors: Record<GlossaryCategory, { bg: string; text: string; border: string }> = {
  Operations: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  Maintenance: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  Finance: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  General: {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

interface GlossaryEntryCardProps {
  entry: GlossaryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function GlossaryEntryCard({ entry, isExpanded, onToggle }: GlossaryEntryCardProps) {
  const colors = categoryColors[entry.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-foreground">{entry.term}</h3>
              {entry.acronym && (
                <span className="text-sm font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {entry.acronym}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entry.definition}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}
          >
            {entry.category}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
              {/* Full Definition */}
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.definition}
                </p>
              </div>

              {/* Where It Appears */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Where It Appears
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {entry.whereItAppears.map((location) => (
                      <span
                        key={location}
                        className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* How It's Calculated */}
              {entry.howCalculated && (
                <div className="flex items-start gap-2">
                  <Calculator className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      How It's Calculated
                    </span>
                    <p className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded mt-1">
                      {entry.howCalculated}
                    </p>
                  </div>
                </div>
              )}

              {/* Why It Matters */}
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Why It Matters
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{entry.whyItMatters}</p>
                </div>
              </div>

              {/* Example Value */}
              {entry.exampleValue && (
                <div className="flex items-start gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Example Value
                    </span>
                    <p className="text-sm text-foreground font-medium mt-1">
                      {entry.exampleValue}
                    </p>
                  </div>
                </div>
              )}

              {/* Related Terms */}
              {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Related Terms
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {entry.relatedTerms.map((term) => (
                        <span
                          key={term}
                          className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function GlossaryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    const filtered = filterGlossary({
      query: searchQuery,
      category: selectedCategory,
    });
    return sortGlossaryAlphabetically(filtered);
  }, [searchQuery, selectedCategory]);

  // Get category counts for badges
  const categoryCounts = useMemo(() => getCategoryCounts(glossaryEntries), []);

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
          <BookA className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Glossary</h2>
          <p className="text-sm text-muted-foreground">
            {glossaryEntries.length} aviation terms and acronyms
          </p>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Input */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search terms, acronyms, or definitions..."
          className="max-w-md"
        />

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All ({glossaryEntries.length})
          </button>
          {glossaryCategories.map((category) => {
            const colors = categoryColors[category];
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(isSelected ? null : category)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors border ${
                  isSelected
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
                }`}
              >
                {category} ({categoryCounts[category]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      {(searchQuery || selectedCategory) && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredEntries.length} of {glossaryEntries.length} entries
        </p>
      )}

      {/* Glossary Entries Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry) => (
            <GlossaryEntryCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => handleToggle(entry.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <BookA className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No terms found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search query or category filter
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default GlossaryTab;
