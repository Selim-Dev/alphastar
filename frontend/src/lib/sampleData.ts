/**
 * Data Sampling Utility
 * 
 * Reduces large datasets to a manageable size for chart rendering performance.
 * Uses step-based sampling to maintain data distribution while reducing point count.
 * 
 * @module sampleData
 */

/**
 * Samples data array to reduce the number of points for chart rendering.
 * 
 * This function is designed to optimize chart performance when dealing with large datasets.
 * It uses a step-based sampling algorithm that takes every Nth point to maintain
 * the overall shape and distribution of the data while reducing the total number of points.
 * 
 * **Algorithm:**
 * - If the dataset has fewer points than maxPoints, returns the original array unchanged
 * - Otherwise, calculates a step size (N) based on the ratio of data length to maxPoints
 * - Returns every Nth element from the original array
 * 
 * **Use Cases:**
 * - Monthly trend charts with years of data
 * - Heatmaps with many data points
 * - Line charts with high-frequency data
 * - Any visualization where rendering all points would cause performance issues
 * 
 * @template T - The type of elements in the data array
 * @param {T[]} data - The original data array to sample
 * @param {number} [maxPoints=100] - Maximum number of points to return (default: 100)
 * @returns {T[]} - Sampled array with at most maxPoints elements
 * 
 * @example
 * // Sample a large dataset for a line chart
 * const monthlyData = [...]; // 500 data points
 * const sampledData = sampleData(monthlyData, 100);
 * // Returns ~100 evenly distributed points
 * 
 * @example
 * // Small dataset remains unchanged
 * const smallData = [1, 2, 3, 4, 5];
 * const result = sampleData(smallData, 100);
 * // Returns [1, 2, 3, 4, 5] (unchanged)
 * 
 * @example
 * // Custom max points
 * const data = Array.from({ length: 1000 }, (_, i) => ({ x: i, y: Math.random() }));
 * const sampled = sampleData(data, 50);
 * // Returns 50 evenly distributed points
 */
export function sampleData<T>(data: T[], maxPoints: number = 100): T[] {
  // If dataset is already small enough, return as-is
  if (data.length <= maxPoints) {
    return data;
  }
  
  // Calculate step size to achieve target number of points
  const step = Math.ceil(data.length / maxPoints);
  
  // Return every Nth element
  return data.filter((_, index) => index % step === 0);
}
