import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AircraftSelect } from './AircraftSelect';
import * as useAircraftModule from '@/hooks/useAircraft';
import type { Aircraft } from '@/types';

// Mock the useAircraft hook
vi.mock('@/hooks/useAircraft', () => ({
  useAircraft: vi.fn(),
}));

// Helper to create a QueryClient wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Generate valid ISO date strings using integer timestamps
const validDateStringArbitrary = fc
  .integer({ min: 946684800000, max: 1924905600000 }) // 2000-01-01 to 2030-12-31
  .map((timestamp) => new Date(timestamp).toISOString());

// Arbitrary for generating valid aircraft data
const aircraftArbitrary = fc.record({
  _id: fc.uuid(),
  registration: fc.stringMatching(/^[A-Z]{2}-[A-Z0-9]{3,4}$/),
  fleetGroup: fc.constantFrom('A340', 'A330', 'A320', 'G650ER', 'Hawker', 'Cessna'),
  aircraftType: fc.string({ minLength: 3, maxLength: 20 }),
  msn: fc.string({ minLength: 3, maxLength: 10 }),
  owner: fc.constantFrom('Alpha Star Aviation', 'Sky Prime Aviation', 'RSAF'),
  manufactureDate: validDateStringArbitrary,
  enginesCount: fc.constantFrom(2, 4),
  status: fc.constantFrom('active', 'parked', 'leased'),
  createdAt: validDateStringArbitrary,
  updatedAt: validDateStringArbitrary,
});

describe('AircraftSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: demo-preparation, Property 1: Aircraft Dropdown Population**
   * 
   * *For any* page with an aircraft filter, when the page loads and the API returns 
   * aircraft data, the dropdown should contain exactly the same number of options 
   * as active aircraft in the response.
   * 
   * **Validates: Requirements 1.1**
   */
  it('**Feature: demo-preparation, Property 1: Aircraft Dropdown Population**', () => {
    fc.assert(
      fc.property(
        fc.array(aircraftArbitrary, { minLength: 0, maxLength: 20 }),
        (aircraftList) => {
          // Clean up before each property test iteration
          cleanup();
          
          // Setup mock to return the generated aircraft list
          const mockResponse = {
            data: aircraftList as Aircraft[],
            total: aircraftList.length,
            page: 1,
            limit: 100,
          };

          vi.mocked(useAircraftModule.useAircraft).mockReturnValue({
            data: mockResponse,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
          } as unknown as ReturnType<typeof useAircraftModule.useAircraft>);

          // Render the component
          const { container } = render(
            <AircraftSelect
              value=""
              onChange={() => {}}
              includeAll={false}
              placeholder="Select Aircraft"
            />,
            { wrapper: createWrapper() }
          );

          // If no aircraft, should show empty state message
          if (aircraftList.length === 0) {
            expect(screen.queryByText(/no aircraft found/i)).toBeInTheDocument();
            return true;
          }

          // Get the select element
          const selectElement = container.querySelector('select');
          
          // If we have aircraft, select should exist
          expect(selectElement).not.toBeNull();
          
          if (selectElement) {
            // Count options (excluding placeholder)
            const options = selectElement.querySelectorAll('option');
            // First option is placeholder "Select Aircraft"
            const aircraftOptions = Array.from(options).filter(
              (opt) => opt.value !== ''
            );
            
            // Property: number of aircraft options should equal number of aircraft in response
            expect(aircraftOptions.length).toBe(aircraftList.length);
            
            // Property: each aircraft registration should appear in the options
            aircraftList.forEach((aircraft) => {
              const hasOption = Array.from(aircraftOptions).some(
                (opt) => opt.textContent?.includes(aircraft.registration)
              );
              expect(hasOption).toBe(true);
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays loading state when fetching aircraft', () => {
    vi.mocked(useAircraftModule.useAircraft).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAircraftModule.useAircraft>);

    render(
      <AircraftSelect value="" onChange={() => {}} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/loading aircraft/i)).toBeInTheDocument();
  });

  it('displays error state with retry button on API failure', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useAircraftModule.useAircraft).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useAircraftModule.useAircraft>);

    render(
      <AircraftSelect value="" onChange={() => {}} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/failed to load aircraft/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('displays empty state guidance when no aircraft exist', () => {
    vi.mocked(useAircraftModule.useAircraft).mockReturnValue({
      data: { data: [], total: 0, page: 1, limit: 100 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAircraftModule.useAircraft>);

    render(
      <AircraftSelect value="" onChange={() => {}} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/no aircraft found/i)).toBeInTheDocument();
    expect(screen.getByText(/add aircraft via the admin page/i)).toBeInTheDocument();
  });
});
