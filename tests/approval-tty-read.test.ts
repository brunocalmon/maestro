import { describe, it, expect } from "vitest";
import { readTtyLine, type SyncReader } from "../src/approval/tty-read";

/** A fake terminal: bytes queued up front, EAGAIN whenever the queue is empty. */
function fakeTty(bytes: number[]): SyncReader {
  const queue = [...bytes];
  const sleeps: number[] = [];
  return {
    readSync: (_fd, buffer) => {
      if (queue.length === 0) {
        const err = new Error("EAGAIN: resource temporarily unavailable, read") as NodeJS.ErrnoException;
        err.code = "EAGAIN";
        throw err;
      }
      buffer[0] = queue.shift()!;
      return 1;
    },
    sleep: (ms) => sleeps.push(ms),
  };
}

const bytesOf = (s: string): number[] => [...Buffer.from(s, "utf8")];

describe("AC-090 — a terminal read survives EAGAIN instead of failing on it", () => {
  // This is the exact failure mode a real terminal produces: readFileSync(0)
  // throws EAGAIN immediately, before the person has typed anything.
  // TRACEABILITY: US-060 FR-060 AC-090
  it("retries past an immediate EAGAIN and still reads the answer", () => {
    const reader = fakeTty(bytesOf("y\n"));
    expect(readTtyLine(reader)).toBe("y");
  });

  // TRACEABILITY: US-060 FR-060 AC-090
  it("retries past EAGAIN appearing between bytes, not just at the start", () => {
    const queue = [...bytesOf("yes")];
    let calls = 0;
    const reader: SyncReader = {
      readSync: (_fd, buffer) => {
        calls++;
        // EAGAIN on every other call — a slow typist, not a dropped connection.
        if (calls % 2 === 0) {
          const err = new Error("EAGAIN") as NodeJS.ErrnoException;
          err.code = "EAGAIN";
          throw err;
        }
        if (queue.length === 0) {
          buffer[0] = 10; // \n
          return 1;
        }
        buffer[0] = queue.shift()!;
        return 1;
      },
      sleep: () => {},
    };
    expect(readTtyLine(reader)).toBe("yes");
  });

  // TRACEABILITY: US-060 FR-060 NFR-060 AC-090
  it("stops at newline without consuming what comes after it", () => {
    const reader = fakeTty(bytesOf("y\nignored"));
    expect(readTtyLine(reader)).toBe("y");
  });

  // TRACEABILITY: US-060 FR-060 AC-090
  it("strips a trailing carriage return", () => {
    const reader = fakeTty(bytesOf("y\r\n"));
    expect(readTtyLine(reader)).toBe("y");
  });

  // TRACEABILITY: US-060 FR-060 AC-090
  it("stops at EOF (fd closed) the same as at a newline", () => {
    const reader: SyncReader = {
      readSync: () => 0,
      sleep: () => {},
    };
    expect(readTtyLine(reader)).toBe("");
  });

  // TRACEABILITY: US-060 FR-060 NFR-060 AC-090
  it("propagates an error that isn't EAGAIN, instead of retrying forever", () => {
    const reader: SyncReader = {
      readSync: () => {
        throw new Error("EBADF: bad file descriptor");
      },
      sleep: () => {},
    };
    expect(() => readTtyLine(reader)).toThrow(/EBADF/);
  });
});
