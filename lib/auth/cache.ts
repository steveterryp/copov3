import { ResourceAction, ResourceType } from '../types/auth';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface PermissionCacheKey {
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  action: ResourceAction;
}

class PermissionCache {
  private cache: Map<string, CacheEntry<boolean>> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  private createKey(key: PermissionCacheKey): string {
    return `${key.userId}:${key.resourceType}:${key.resourceId}:${key.action}`;
  }

  async get(
    key: PermissionCacheKey,
    fetchFn: () => Promise<boolean>
  ): Promise<boolean> {
    const cacheKey = this.createKey(key);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await fetchFn();
    this.set(key, value);
    return value;
  }

  set(key: PermissionCacheKey, value: boolean, ttl: number = this.defaultTTL): void {
    const cacheKey = this.createKey(key);
    this.cache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(key: PermissionCacheKey): void {
    const cacheKey = this.createKey(key);
    this.cache.delete(cacheKey);
  }

  invalidateUserPermissions(userId: string): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    });
  }

  invalidateResourcePermissions(resourceType: ResourceType, resourceId: string): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.includes(`${resourceType}:${resourceId}`)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

interface TeamCacheKey {
  userId: string;
  teamId: string;
}

class TeamMembershipCache {
  private cache: Map<string, CacheEntry<boolean>> = new Map();
  private readonly defaultTTL = 10 * 60 * 1000; // 10 minutes

  private createKey(key: TeamCacheKey): string {
    return `${key.userId}:${key.teamId}`;
  }

  async get(
    key: TeamCacheKey,
    fetchFn: () => Promise<boolean>
  ): Promise<boolean> {
    const cacheKey = this.createKey(key);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const value = await fetchFn();
    this.set(key, value);
    return value;
  }

  set(key: TeamCacheKey, value: boolean, ttl: number = this.defaultTTL): void {
    const cacheKey = this.createKey(key);
    this.cache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  invalidate(key: TeamCacheKey): void {
    const cacheKey = this.createKey(key);
    this.cache.delete(cacheKey);
  }

  invalidateUserTeams(userId: string): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    });
  }

  invalidateTeam(teamId: string): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.endsWith(`:${teamId}`)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instances
export const permissionCache = new PermissionCache();
export const teamMembershipCache = new TeamMembershipCache();
