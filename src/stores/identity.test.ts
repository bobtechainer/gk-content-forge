import { beforeEach, describe, expect, it } from "vitest";
import { useIdentity } from "./identity";

function reset() {
  useIdentity.setState({ activeLoginId: null, activeMembershipId: null, verifiedPins: {} });
}
describe("identity store", () => {
  beforeEach(reset);

  it("loginAs hệ thống (admin) tự chọn hồ sơ hệ thống", () => {
    useIdentity.getState().loginAs("login-admin");
    expect(useIdentity.getState().activeLoginId).toBe("login-admin");
  });

  it("selectProfile mở hồ sơ không khoá ngay; hồ sơ khoá cần verifyPin", () => {
    useIdentity.getState().loginAs("login-hong");
    // hồ sơ cá nhân (không khoá)
    expect(useIdentity.getState().selectProfile("ms-hong-personal")).toBe(true);
    expect(useIdentity.getState().activeMembershipId).toBe("ms-hong-personal");
    // hồ sơ NXB (khoá) — chưa verify
    expect(useIdentity.getState().selectProfile("ms-hong-nxbgd")).toBe(false);
    // sai PIN
    expect(useIdentity.getState().verifyPin("ms-hong-nxbgd", "0000")).toBe(false);
    // đúng PIN -> mở được
    expect(useIdentity.getState().verifyPin("ms-hong-nxbgd", "1234")).toBe(true);
    expect(useIdentity.getState().selectProfile("ms-hong-nxbgd")).toBe(true);
    expect(useIdentity.getState().activeMembershipId).toBe("ms-hong-nxbgd");
  });
});
