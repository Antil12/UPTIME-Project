// Permission middleware and role permission map
export const ROLE_PERMISSIONS = {
  SUPERADMIN: {
    canEditUser: true,
    canCreateUser: true,
    canAddSite: true,
    canViewAllSites: true,
    canAssignSite: true,
    canAssignRole: true,
  },
  ADMIN: {
    canEditUser: false,
    canCreateUser: false,
    canAddSite: true,
    canViewAllSites: true,
    canAssignSite: true,
    canAssignRole: false,
  },
  USER: {
    canEditUser: false,
    canCreateUser: false,
    canAddSite: true,
    canViewAllSites: false,
    canAssignSite: false,
    canAssignRole: false,
  },
  VIEWER: {
    canEditUser: false,
    canCreateUser: false,
    canAddSite: false,
    canViewAllSites: false,
    canAssignSite: false,
    canAssignRole: false,
    
  },
};

// Authorize by role names (keeps compatibility)
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied: insufficient permissions" });
    }
    return next();
  };
};

// Authorize by permission key from ROLE_PERMISSIONS
export const authorizePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const role = req.user.role || "";
    const perms = ROLE_PERMISSIONS[role] || {};

    if (perms[permissionKey]) return next();

    return res.status(403).json({ success: false, message: "Access denied: missing permission" });
  };
};

export default authorizePermission;
