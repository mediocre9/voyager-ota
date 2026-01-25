import { redis } from "@config/redis.connection.config";
import * as Types from "@interfaces/common/common";
import { Logger } from "@utils/logger";
import { injectable } from "tsyringe";

export abstract class CacheService {
  public async add(id: string, data: string): Promise<void> {
    const EXPIRATION = 4 * 3600; // 4hrs in seconds....
    const JITTER = Math.random() * (60 * 7); // 7 minutes jitter variation.....
    const TTL = Math.ceil(EXPIRATION + JITTER);
    await redis.set(id, data, "EX", TTL);
  }

  public async isEmpty(key: string): Promise<boolean> {
    return (await this.get(key)) === null;
  }

  public async isNotEmpty(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  public async get<T = string>(key: string): Promise<T> {
    const _isJSON = (data: string): boolean => {
      try {
        JSON.parse(data);
      } catch (error) {
        Logger.error((error as SyntaxError).message);
        return false;
      }
      return true;
    };

    const data = (await redis.get(key))!;
    if (_isJSON(data)) {
      return JSON.parse(data) as T;
    }
    return data as T;
  }

  public async remove(key: string): Promise<void> {
    await redis.del(key);
  }
}

@injectable()
export class ReleaseCacheService extends CacheService {
  public async invalidateCache(
    key: string,
    channel: "staging" | "production",
  ): Promise<{ isInvalidated: boolean; cacheKey: string }> {
    const cacheKey = key.concat(":").concat(channel);
    if (await this.isNotEmpty(cacheKey)) {
      await this.remove(cacheKey);
      return { isInvalidated: true, cacheKey: cacheKey };
    }
    return { isInvalidated: false, cacheKey: cacheKey };
  }

  public async invalidateCacheChannels(key: string): Promise<{
    staging: { isCached: boolean; key: Types.Nullable<string> };
    production: { isCached: boolean; key: Types.Nullable<string> };
  }> {
    const stagingChannelKey = key.concat(":").concat("staging");
    const isStagingCached = await this.isNotEmpty(stagingChannelKey);
    if (isStagingCached) {
      await this.remove(stagingChannelKey);
    }

    const productionChannelKey = key.concat(":").concat("production");
    const isProductionCached = await this.isNotEmpty(productionChannelKey);
    if (isProductionCached) {
      await this.remove(productionChannelKey);
    }

    return {
      staging: {
        isCached: isStagingCached,
        key: isStagingCached ? stagingChannelKey : null,
      },
      production: {
        isCached: isProductionCached,
        key: isProductionCached ? productionChannelKey : null,
      },
    };
  }

  public async addChannelBased<T>(
    key: string,
    data: T,
    channel: "staging" | "production",
  ): Promise<{ isCached: boolean; cacheKey: string }> {
    const cacheKey = key.concat(":").concat(channel);
    if (await this.isEmpty(cacheKey)) {
      await this.add(cacheKey, JSON.stringify(data));
      return { isCached: true, cacheKey: cacheKey };
    }
    return { isCached: false, cacheKey: cacheKey };
  }

  public async getChannelBased<T>(
    key: string,
    channel: "staging" | "production",
  ): Promise<{ cachedData: Types.Nullable<T>; cacheKey: string }> {
    const cacheKey = key.concat(":").concat(channel);
    if (await this.isNotEmpty(cacheKey)) {
      return { cachedData: await this.get<T>(cacheKey), cacheKey: cacheKey };
    }
    return { cachedData: null, cacheKey: cacheKey };
  }
}
