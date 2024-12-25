/**
 * Function that executes a function with a delay.
 *
 * @param fn The function to execute.
 * @param delay The delay in milliseconds.
 */
export const executeWithDelay = (fn: () => void, delay = 0): number => setTimeout(fn, delay);
