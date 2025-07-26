import rolesData from '../config/roles-and-rates.json';

export interface Role {
  roleName: string;
  region: string;
  costRate: number;
  billRate: number;
}

export interface RolesData {
  roles: Role[];
}

/**
 * Get all available roles from the configuration
 */
export const getAllRoles = (): Role[] => {
  return rolesData.roles;
};

/**
 * Get unique role names (without region distinction)
 */
export const getUniqueRoleNames = (): string[] => {
  const roleNames = rolesData.roles.map(role => role.roleName);
  return [...new Set(roleNames)];
};

/**
 * Get unique regions
 */
export const getUniqueRegions = (): string[] => {
  const regions = rolesData.roles.map(role => role.region);
  return [...new Set(regions)];
};

/**
 * Get roles by region
 */
export const getRolesByRegion = (region: string): Role[] => {
  return rolesData.roles.filter(role => role.region === region);
};

/**
 * Get a specific role by name and region
 */
export const getRole = (roleName: string, region: string): Role | undefined => {
  return rolesData.roles.find(role => 
    role.roleName === roleName && role.region === region
  );
}; 