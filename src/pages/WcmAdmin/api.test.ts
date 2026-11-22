import { adminApi } from "./api";

test("uses the local multi-tenant API and a separate credentialed admin client", () => {
    expect(adminApi.defaults.baseURL).toBe("http://localhost:8080/wcmadmin");
    expect(adminApi.defaults.withCredentials).toBe(true);
    expect(adminApi.defaults.headers.common.Authorization).toBeUndefined();
});
