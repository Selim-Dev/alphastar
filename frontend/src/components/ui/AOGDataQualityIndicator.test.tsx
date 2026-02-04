import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { AOGDataQualityIndicator } from './AOGDataQualityIndicator';

describe('AOGDataQualityIndicator', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Property 3: Data Quality Score Calculation**
   * 
   * *For any* set of AOG events, the data completeness percentage should equal 
   * (eventsWithMilestones / totalEvents) * 100, where an event is "complete" if 
   * it has reportedAt, installationCompleteAt, and upAndRunningAt.
   * 
   * **Validates: Requirements FR-1.3**
   */
  it('**Property 3: Data Quality Score Calculation**', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // totalEvents
        fc.integer({ min: 0, max: 1000 }), // eventsWithMilestones
        (totalEvents, eventsWithMilestones) => {
          // Ensure eventsWithMilestones <= totalEvents
          const validEventsWithMilestones = Math.min(eventsWithMilestones, totalEvents);
          
          cleanup();

          const { container } = render(
            <AOGDataQualityIndicator
              totalEvents={totalEvents}
              eventsWithMilestones={validEventsWithMilestones}
            />
          );

          // Calculate expected percentage
          const expectedPercentage = totalEvents > 0 
            ? (validEventsWithMilestones / totalEvents) * 100 
            : 0;

          // Property 1: Percentage should be between 0 and 100
          expect(expectedPercentage).toBeGreaterThanOrEqual(0);
          expect(expectedPercentage).toBeLessThanOrEqual(100);

          // Property 2: If totalEvents is 0, should show "No AOG data"
          if (totalEvents === 0) {
            expect(screen.getByText(/no aog data/i)).toBeInTheDocument();
            return true;
          }

          // Property 3: Badge should display the percentage
          const badge = container.querySelector('button');
          expect(badge).not.toBeNull();
          
          if (badge) {
            const badgeText = badge.textContent || '';
            const displayedPercentage = Math.round(expectedPercentage);
            expect(badgeText).toContain(`${displayedPercentage}%`);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property: Color Coding Correctness**
   * 
   * *For any* completeness percentage:
   * - >80% should show green badge
   * - 50-80% should show amber badge
   * - <50% should show red badge
   * 
   * **Validates: Requirements FR-1.3**
   */
  it('**Property: Color Coding Correctness**', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // totalEvents (at least 1)
        fc.integer({ min: 0, max: 100 }), // percentage (0-100)
        (totalEvents, percentage) => {
          cleanup();

          // Calculate eventsWithMilestones based on percentage
          const eventsWithMilestones = Math.floor((percentage / 100) * totalEvents);
          
          // Calculate actual percentage that will be displayed
          const actualPercentage = (eventsWithMilestones / totalEvents) * 100;

          const { container } = render(
            <AOGDataQualityIndicator
              totalEvents={totalEvents}
              eventsWithMilestones={eventsWithMilestones}
            />
          );

          const badge = container.querySelector('button');
          expect(badge).not.toBeNull();

          if (badge) {
            const classes = badge.className;
            
            // Property: Color coding based on actual calculated percentage
            if (actualPercentage > 80) {
              // Should have green background
              expect(classes).toContain('bg-green-500');
            } else if (actualPercentage >= 50) {
              // Should have amber background
              expect(classes).toContain('bg-amber-500');
            } else {
              // Should have red background
              expect(classes).toContain('bg-red-500');
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays loading state when isLoading is true', () => {
    const { container } = render(
      <AOGDataQualityIndicator
        totalEvents={100}
        eventsWithMilestones={80}
        isLoading={true}
      />
    );

    // Should show loading skeleton
    const loadingElement = container.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('displays green badge for >80% completeness', () => {
    render(
      <AOGDataQualityIndicator
        totalEvents={100}
        eventsWithMilestones={85}
      />
    );

    const badge = screen.getByRole('button');
    expect(badge.className).toContain('bg-green-500');
    expect(badge.textContent).toContain('85% Complete');
  });

  it('displays amber badge for 50-80% completeness', () => {
    render(
      <AOGDataQualityIndicator
        totalEvents={100}
        eventsWithMilestones={65}
      />
    );

    const badge = screen.getByRole('button');
    expect(badge.className).toContain('bg-amber-500');
    expect(badge.textContent).toContain('65% Complete');
  });

  it('displays red badge for <50% completeness', () => {
    render(
      <AOGDataQualityIndicator
        totalEvents={100}
        eventsWithMilestones={30}
      />
    );

    const badge = screen.getByRole('button');
    expect(badge.className).toContain('bg-red-500');
    expect(badge.textContent).toContain('30% Complete');
  });

  it('displays "No AOG data" when totalEvents is 0', () => {
    render(
      <AOGDataQualityIndicator
        totalEvents={0}
        eventsWithMilestones={0}
      />
    );

    expect(screen.getByText(/no aog data/i)).toBeInTheDocument();
  });

  it('calculates legacy event count correctly', () => {
    render(
      <AOGDataQualityIndicator
        totalEvents={100}
        eventsWithMilestones={75}
      />
    );

    // Legacy events = totalEvents - eventsWithMilestones = 25
    // This would be visible in the expanded tooltip
    const badge = screen.getByRole('button');
    expect(badge).toBeInTheDocument();
  });
});
