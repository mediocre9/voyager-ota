import z from "zod";

export const TelemetryIdAndTopicSchema = z.object(
  {
    telemetryId: z.string("telemetryId is required!"),
    topic: z.string("topic is required!"),
  },
  { error: "projectId and topic is required!" }
);

export type TelemetryIdAndTopicDTO = z.infer<typeof TelemetryIdAndTopicSchema>;
