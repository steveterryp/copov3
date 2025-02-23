export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLogin: true,
  createdAt: true,
  password: true,
  resetTokenHash: true,
  resetTokenExpiry: true,
  verificationToken: true,
  isVerified: true,
  verifiedAt: true,
  updatedAt: true,
  customRoleId: true,
  customRole: {
    select: {
      id: true,
      name: true,
    }
  },
} as const;

export const roleSelect = {
  id: true,
  name: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const roleWithUsersSelect = {
  ...roleSelect,
  users: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  },
} as const;

export const activitySelect = {
  id: true,
  userId: true,
  type: true,
  action: true,
  metadata: true,
  createdAt: true,
} as const;

export const activityWithUserSelect = {
  ...activitySelect,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

export const systemSettingsSelect = {
  id: true,
  notifications: true,
  twoFactor: true,
  darkMode: true,
  updatedAt: true,
} as const;
