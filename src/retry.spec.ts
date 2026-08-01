import { retry } from "./main";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("retry function", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should return the result immediately on the first successful call", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const promise = retry(fn, { maxAttempts: 3, initialDelay: 1000 });
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(console.log).not.toHaveBeenCalled();
  });

  it("should retry on failure applying factor immediately on 1st retry", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValueOnce("success");

    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelay: 1000,
      factor: 2,
    });

    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);

    expect(console.log).toHaveBeenNthCalledWith(
      1,
      "delay 2000ms, retrying...\n remaining attempts: 2",
    );
    expect(console.log).toHaveBeenNthCalledWith(
      2,
      "delay 4000ms, retrying...\n remaining attempts: 1",
    );
  });

  it("should respect maxDelay cap when calculated delay exceeds it", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockResolvedValueOnce("success");

    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelay: 1000,
      factor: 3,
      maxDelay: 1500,
    });

    await vi.advanceTimersByTimeAsync(1500);

    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(
      1,
      "delay 1500ms, retrying...\n remaining attempts: 2",
    );
  });

  it("should throw the error if all attempts fail", async () => {
    const error = new Error("Retry failed");
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retry(fn, { maxAttempts: 3, initialDelay: 1000 });

    const rejectionExpectation =
      expect(promise).rejects.toThrow("Retry failed");

    await vi.advanceTimersByTimeAsync(2000);
    await rejectionExpectation;

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
