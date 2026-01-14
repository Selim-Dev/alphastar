// Glossary Search Filtering Logic
// Requirements: 4.2 - Filter glossary entries in real-time by term, acronym, or definition

import type { GlossaryEntry, GlossaryCategory } from './types';
import { glossaryEntries, glossaryCategories } from './glossaryContent';

/**
 * Search options for filtering glossary entries
 */
export interface GlossarySearchOptions {
  query?: string;
  category?: GlossaryCategory | null;
}

/**
 * Filter glossary entries by search query (case-insensitive).
 * Matches against term, acronym, or definition.
 * 
 * Requirements: 4.2 - Filter glossary entries in real-time to show matching terms
 * 
 * @param query - The search query string
 * @param entries - The glossary entries to filter (defaults to all entries)
 * @returns Filtered glossary entries matching the query
 */
export function filterGlossaryByQuery(
  query: string,
  entries: GlossaryEntry[] = glossaryEntries
): GlossaryEntry[] {
  if (!query || query.trim() === '') {
    return entries;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return entries.filter(entry => {
    // Check term (case-insensitive)
    if (entry.term.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Check acronym if present (case-insensitive)
    if (entry.acronym && entry.acronym.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Check definition (case-insensitive)
    if (entry.definition.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    return false;
  });
}

/**
 * Filter glossary entries by category.
 * 
 * @param category - The category to filter by (null returns all entries)
 * @param entries - The glossary entries to filter (defaults to all entries)
 * @returns Filtered glossary entries in the specified category
 */
export function filterGlossaryByCategory(
  category: GlossaryCategory | null,
  entries: GlossaryEntry[] = glossaryEntries
): GlossaryEntry[] {
  if (!category) {
    return entries;
  }

  return entries.filter(entry => entry.category === category);
}

/**
 * Filter glossary entries by both search query and category.
 * Combines query filtering (term, acronym, definition) with category filtering.
 * 
 * @param options - Search options containing query and/or category
 * @param entries - The glossary entries to filter (defaults to all entries)
 * @returns Filtered glossary entries matching both criteria
 */
export function filterGlossary(
  options: GlossarySearchOptions,
  entries: GlossaryEntry[] = glossaryEntries
): GlossaryEntry[] {
  let result = entries;

  // Apply category filter first (more restrictive)
  if (options.category) {
    result = filterGlossaryByCategory(options.category, result);
  }

  // Apply query filter
  if (options.query) {
    result = filterGlossaryByQuery(options.query, result);
  }

  return result;
}

/**
 * Get the count of entries per category.
 * Useful for displaying category badges with counts.
 * 
 * @param entries - The glossary entries to count (defaults to all entries)
 * @returns Object mapping category to entry count
 */
export function getCategoryCounts(
  entries: GlossaryEntry[] = glossaryEntries
): Record<GlossaryCategory, number> {
  const counts: Record<GlossaryCategory, number> = {
    Operations: 0,
    Maintenance: 0,
    Finance: 0,
    General: 0,
  };

  for (const entry of entries) {
    counts[entry.category]++;
  }

  return counts;
}

/**
 * Sort glossary entries alphabetically by term.
 * 
 * @param entries - The glossary entries to sort
 * @returns Sorted glossary entries
 */
export function sortGlossaryAlphabetically(entries: GlossaryEntry[]): GlossaryEntry[] {
  return [...entries].sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * Group glossary entries by category.
 * 
 * @param entries - The glossary entries to group (defaults to all entries)
 * @returns Object mapping category to array of entries
 */
export function groupGlossaryByCategory(
  entries: GlossaryEntry[] = glossaryEntries
): Record<GlossaryCategory, GlossaryEntry[]> {
  const grouped: Record<GlossaryCategory, GlossaryEntry[]> = {
    Operations: [],
    Maintenance: [],
    Finance: [],
    General: [],
  };

  for (const entry of entries) {
    grouped[entry.category].push(entry);
  }

  return grouped;
}

// Re-export for convenience
export { glossaryEntries, glossaryCategories };
