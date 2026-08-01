export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    initialDelay: number;
    factor?: number;
    maxDelay?: number;
  },
  currentAttempt = 1,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (currentAttempt >= options.maxAttempts) {
      throw error;
    }

    const factor = options.factor ?? 1;
    let delay = options.initialDelay * Math.pow(factor, currentAttempt);

    if (options.maxDelay !== undefined) {
      delay = Math.min(delay, options.maxDelay);
    }

    await new Promise((resolve) => setTimeout(resolve, delay));

    const remaining = options.maxAttempts - currentAttempt;
    console.log(
      `delay ${delay}ms, retrying...\n remaining attempts: ${remaining}`,
    );

    return await retry(fn, options, currentAttempt + 1);
  }
}
