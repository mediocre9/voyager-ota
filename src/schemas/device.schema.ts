import { z } from "zod";

export const DeviceSchema = z.object({
  projectId: z
    .string()
    .min(1, "project_id cannot be empty")
    .regex(/^[a-zA-Z0-9_-]{21}$/, "Invalid project_id format"),
  macAddress: z
    .string()
    .min(1, "mac_address cannot be empty")
    .regex(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/, "Invalid MAC-Address format"),
});

export type DeviceDTO = z.infer<typeof DeviceSchema>;
