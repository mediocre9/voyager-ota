import { z } from "zod";

export const ReleaseIdMacAddressPathParamSchema = z.object(
  {
    releaseId: z.string().nonempty(),
    macAddress: z
      .mac({ delimiter: ":", error: "Invalid MAC-Address format!" })
      .nonempty("macAddress path param is required!")
      .nonoptional(),
  },
  { error: "releaseId and macAddress path params are required!" },
);

export const DeviceSchema = z.object(
  {
    macAddress: z
      .mac({ delimiter: ":", error: "Invalid MAC-Address format!" })
      .nonempty({ error: "macAddress field is empty!" })
      .nonoptional("macAddress field is required!"),

    status: z
      .enum(["success", "failed"], { error: "status can either be success or failed!" })
      .nonoptional(),
  },
  {
    error: "releaseId path param and macAddress and status [success, failed] fields are required!",
  },
);

export type DeviceDTO = z.infer<typeof DeviceSchema>;
export type ReleaseIdMacAddressPathParam = z.infer<typeof ReleaseIdMacAddressPathParamSchema>;
