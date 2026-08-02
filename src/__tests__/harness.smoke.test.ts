/**
 * Phase-0 harness proof: confirms the jest-expo test runner is wired up and
 * green. Worker H builds out the real independent suite in Phase 2; this file
 * only exists to prove `yarn test` / `yarn gate` executes tests successfully.
 */
describe("jest-expo harness", () => {
  it("runs a trivial passing test", () => {
    expect(1 + 1).toBe(2);
  });
});
