import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { UserRole } from '../models/user.model';

export function useRequireRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();
  const { showToast } = useToast();
  const roleKey = allowedRoles.join(',');
  const isAllowed = Boolean(user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (!user || isAllowed) return;
    showToast('No tienes permisos para acceder a esta sección.');
    router.replace('/');
  }, [user, isAllowed, roleKey, showToast]);

  return isAllowed;
}
