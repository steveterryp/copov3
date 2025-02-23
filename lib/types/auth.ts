export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const AVAILABLE_ROLES: UserRole[] = [
  UserRole.USER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

export enum ResourceAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  COMMENT = 'comment',
  UPLOAD = 'upload',
}

export enum ResourceType {
  PoV = 'pov',
  PHASE = 'phase',
  TASK = 'task',
  USER = 'user',
  TEAM = 'team',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  USER_MANAGEMENT = 'user-management',
  PERMISSIONS = 'permissions',
  JOB_TITLES = 'job-titles',
  CRM = 'crm',
  CRM_SETTINGS = 'crm-settings',
  CRM_MAPPING = 'crm-mapping',
  CRM_SYNC = 'crm-sync',
  AUDIT = 'audit',
}

export interface Resource {
  id: string;
  type: ResourceType;
  ownerId?: string;
  teamId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
  customRoleId?: string | null;
  verificationToken?: string | null;
  isVerified: boolean;
  verifiedAt?: Date | null;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface JWTPayload extends Record<string, any> {
  userId: string;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

export interface Permission {
  action: ResourceAction;
  resourceType: ResourceType;
  conditions?: {
    isOwner?: boolean;
    isTeamMember?: boolean;
    hasRole?: UserRole[];
  };
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
}

export interface ResponseCookie {
  name: string;
  value: string;
  options?: {
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    maxAge?: number;
    expires?: Date;
  };
}

export interface ApiResponseWithCookies<T = any> {
  data?: T;
  error?: ApiError;
  cookies?: ResponseCookie[];
}

export type RolePermissions = Record<UserRole, Permission[]>;

export function convertUserResponse(user: any): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
    customRoleId: user.customRoleId || null,
    verificationToken: user.verificationToken || null,
    isVerified: user.isVerified || false,
    verifiedAt: user.verifiedAt ? new Date(user.verifiedAt) : null,
  };
}

export const rolePermissions: RolePermissions = {
  [UserRole.SUPER_ADMIN]: [
    // Super Admin has all permissions without conditions
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.PoV,
    })),
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.PHASE,
    })),
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.TASK,
    })),
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.USER,
    })),
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.TEAM,
    })),
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.SETTINGS,
    })),
    ...Object.values(ResourceAction).map(action => ({
      action,
      resourceType: ResourceType.ANALYTICS,
    })),
  ],
  [UserRole.ADMIN]: [
    // PoV permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.PoV },
    { action: ResourceAction.CREATE, resourceType: ResourceType.PoV },
    { action: ResourceAction.EDIT, resourceType: ResourceType.PoV },
    { action: ResourceAction.DELETE, resourceType: ResourceType.PoV },
    { action: ResourceAction.APPROVE, resourceType: ResourceType.PoV },
    { action: ResourceAction.REJECT, resourceType: ResourceType.PoV },
    { action: ResourceAction.ASSIGN, resourceType: ResourceType.PoV },
    { action: ResourceAction.COMMENT, resourceType: ResourceType.PoV },
    { action: ResourceAction.UPLOAD, resourceType: ResourceType.PoV },
    
    // Phase permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.PHASE },
    { action: ResourceAction.CREATE, resourceType: ResourceType.PHASE },
    { action: ResourceAction.EDIT, resourceType: ResourceType.PHASE },
    { action: ResourceAction.DELETE, resourceType: ResourceType.PHASE },
    
    // Task permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.TASK },
    { action: ResourceAction.CREATE, resourceType: ResourceType.TASK },
    { action: ResourceAction.EDIT, resourceType: ResourceType.TASK },
    { action: ResourceAction.DELETE, resourceType: ResourceType.TASK },
    { action: ResourceAction.ASSIGN, resourceType: ResourceType.TASK },
    { action: ResourceAction.COMMENT, resourceType: ResourceType.TASK },
    
    // User permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.USER },
    { action: ResourceAction.CREATE, resourceType: ResourceType.USER },
    { action: ResourceAction.EDIT, resourceType: ResourceType.USER },
    
    // Team permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.TEAM },
    { action: ResourceAction.CREATE, resourceType: ResourceType.TEAM },
    { action: ResourceAction.EDIT, resourceType: ResourceType.TEAM },
    
    // Analytics permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.ANALYTICS },

    // Admin section permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.USER_MANAGEMENT },
    { action: ResourceAction.VIEW, resourceType: ResourceType.PERMISSIONS },
    { action: ResourceAction.VIEW, resourceType: ResourceType.JOB_TITLES },
    { action: ResourceAction.VIEW, resourceType: ResourceType.AUDIT },
    
    // CRM permissions
    { action: ResourceAction.VIEW, resourceType: ResourceType.CRM },
    { action: ResourceAction.VIEW, resourceType: ResourceType.CRM_SETTINGS },
    { action: ResourceAction.EDIT, resourceType: ResourceType.CRM_SETTINGS },
    { action: ResourceAction.VIEW, resourceType: ResourceType.CRM_MAPPING },
    { action: ResourceAction.EDIT, resourceType: ResourceType.CRM_MAPPING },
    { action: ResourceAction.VIEW, resourceType: ResourceType.CRM_SYNC },
    { action: ResourceAction.EDIT, resourceType: ResourceType.CRM_SYNC },
  ],
  [UserRole.USER]: [
    // PoV permissions
    { 
      action: ResourceAction.VIEW, 
      resourceType: ResourceType.PoV,
      conditions: { isTeamMember: true, isOwner: true }  // Can view if owner OR team member
    },
    { 
      action: ResourceAction.CREATE, 
      resourceType: ResourceType.PoV 
    },
    { 
      action: ResourceAction.EDIT, 
      resourceType: ResourceType.PoV,
      conditions: { isOwner: true }  // Can only edit if owner
    },
    { 
      action: ResourceAction.COMMENT, 
      resourceType: ResourceType.PoV,
      conditions: { isTeamMember: true }
    },
    { 
      action: ResourceAction.UPLOAD, 
      resourceType: ResourceType.PoV,
      conditions: { isTeamMember: true }
    },
    
    // Phase permissions
    { 
      action: ResourceAction.VIEW, 
      resourceType: ResourceType.PHASE,
      conditions: { isTeamMember: true }
    },
    { 
      action: ResourceAction.CREATE, 
      resourceType: ResourceType.PHASE,
      conditions: { isTeamMember: true }
    },
    { 
      action: ResourceAction.EDIT, 
      resourceType: ResourceType.PHASE,
      conditions: { isTeamMember: true }
    },
    
    // Task permissions
    { 
      action: ResourceAction.VIEW, 
      resourceType: ResourceType.TASK,
      conditions: { isTeamMember: true }
    },
    { 
      action: ResourceAction.CREATE, 
      resourceType: ResourceType.TASK,
      conditions: { isTeamMember: true }
    },
    { 
      action: ResourceAction.EDIT, 
      resourceType: ResourceType.TASK,
      conditions: { isOwner: true }
    },
    { 
      action: ResourceAction.COMMENT, 
      resourceType: ResourceType.TASK,
      conditions: { isTeamMember: true }
    },
    
    // Team permissions
    { 
      action: ResourceAction.VIEW, 
      resourceType: ResourceType.TEAM,
      conditions: { isTeamMember: true }
    },
  ],
};
