import * as fs from "node:fs/promises";
import path from "node:path";

// TODO [PRI-03] refactor.........
export class FileStorageOperation {
  private constructor() {}

  static readonly DEFAULT_FILE_STORAGE_PATH = path.join(import.meta.dirname, "..", "..", "storage");

  static readonly DEFAULT_FILE_STORAGE_TRASH_PATH = path.join(
    import.meta.dirname,
    "..",
    "..",
    "storage",
    "trash",
  );

  static async removePermanently(
    filename: string,
    pathDir: "storage" | "trash" = "trash",
  ): Promise<void> {
    const STORAGE_PATH =
      pathDir === "storage"
        ? FileStorageOperation.DEFAULT_FILE_STORAGE_PATH
        : FileStorageOperation.DEFAULT_FILE_STORAGE_TRASH_PATH;

    const pathToFile = path.join(STORAGE_PATH, filename);
    await fs.rm(pathToFile);
  }

  static async restoreBinaryToStorageFolder(filename: string): Promise<void> {
    const newFilePath = path.join(FileStorageOperation.DEFAULT_FILE_STORAGE_PATH, filename);
    const oldFilePath = path.join(FileStorageOperation.DEFAULT_FILE_STORAGE_TRASH_PATH, filename);
    await fs.rename(oldFilePath, newFilePath);
  }

  static async moveBinaryToTrashFolder(filename: string): Promise<void> {
    const isTrashFolderAvailable = await fs.readdir(
      FileStorageOperation.DEFAULT_FILE_STORAGE_TRASH_PATH,
    );

    if (!isTrashFolderAvailable) {
      await fs.mkdir(FileStorageOperation.DEFAULT_FILE_STORAGE_TRASH_PATH);
    }

    const oldFilePath = path.join(FileStorageOperation.DEFAULT_FILE_STORAGE_PATH, filename);
    const newFilePath = path.join(FileStorageOperation.DEFAULT_FILE_STORAGE_TRASH_PATH, filename);
    await fs.rename(oldFilePath, newFilePath);
  }
}
