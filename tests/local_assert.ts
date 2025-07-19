// Local implementation of core assert functions

export function assertEquals(actual: any, expected: any, msg?: string): void {
  if (!Object.is(actual, expected)) {
    const message = msg || `Values are not equal. Expected: ${expected}, Actual: ${actual}`;
    throw new Error(message);
  }
}

export function assertExists(value: any, msg?: string): void {
  if (value === null || value === undefined) {
    const message = msg || 'Value does not exist';
    throw new Error(message);
  }
}

export function assertStringIncludes(actual: string, expected: string, msg?: string): void {
  if (!actual.includes(expected)) {
    const message = msg || `String does not include expected substring. Expected: ${expected}, Actual: ${actual}`;
    throw new Error(message);
  }
}

// Additional utility assertion function
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
} 