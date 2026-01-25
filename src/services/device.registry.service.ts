import * as DeviceDAL from "@dal/device.dal";
import * as ProjectDAL from "@dal/project.dal";
import { DeviceDTO, DeviceSchema } from "@schemas/device.schema";
import { ApiError } from "@utils/error";
import { Logger } from "@utils/logger";
import { computeElapsedTimeAsync } from "@utils/performance";
import { StatusCodes } from "http-status-codes";
import * as uuid from "uuid";

export class DeviceRegistryService {
  public async registerDevice(payload: DeviceDTO): Promise<void> {
    const { projectId, macAddress } = await DeviceSchema.parseAsync(payload);

    const millis = await computeElapsedTimeAsync(async () => {
      const project = await ProjectDAL.findProjectByPublicId(projectId);

      if (!project) {
        throw new ApiError("Project not found", StatusCodes.NOT_FOUND);
      }

      const isRegistered = await DeviceDAL.isDeviceRegistered(project.getId(), macAddress);
      if (isRegistered) {
        throw new ApiError(
          `Device MAC (${macAddress}) is already registered!`,
          StatusCodes.CONFLICT,
          uuid.v4()
        );
      }

      await DeviceDAL.registerDevice(project.getId(), macAddress);
    });

    Logger.info(`Device has been registered successfully in ${millis / 1000} seconds!`);
  }

  public async removeDevice(payload: DeviceDTO): Promise<void> {
    const { projectId, macAddress } = await DeviceSchema.parseAsync(payload);
    const project = await ProjectDAL.findProjectByPublicId(projectId);

    if (!project) {
      throw new ApiError("Project not found", StatusCodes.NOT_FOUND);
    }

    const isRemoved = await DeviceDAL.removeDevice(project.getId(), macAddress);
    if (!isRemoved) {
      throw new ApiError("Failed to remove the resource!", StatusCodes.BAD_REQUEST, uuid.v4());
    }

    Logger.info("Resource removed successfully!");
  }

  public async authenticate(payload: DeviceDTO): Promise<void> {
    const { projectId, macAddress } = await DeviceSchema.parseAsync(payload);
    const project = await ProjectDAL.findProjectByPublicId(projectId);

    if (!project) {
      throw new ApiError("Project not found", StatusCodes.NOT_FOUND);
    }

    const isRegistered = await DeviceDAL.isDeviceRegistered(project.getId(), macAddress);
    if (!isRegistered) {
      throw new ApiError("Device is not registered!", StatusCodes.UNAUTHORIZED, uuid.v4());
    }

    Logger.info("Device Authenticated!");
  }
}
