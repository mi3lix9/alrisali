import { os } from "./orpc";

export const healthCheck = os.healthCheck.handler(() => "OK" as const);
