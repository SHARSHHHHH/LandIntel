'use client';

import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';

export type DemoRole = 'RESEARCHER' | 'POLICYMAKER' | 'GOVERNMENT_OFFICIAL' | 'ACADEMIC_INSTITUTION' | 'PUBLIC_USER';

const ROLES: { id: DemoRole; label: string }[] = [
  { id: 'RESEARCHER', label: 'Researcher / Scholar' },
  { id: 'POLICYMAKER', label: 'Policymaker' },
  { id: 'GOVERNMENT_OFFICIAL', label: 'Government Official' },
  { id: 'ACADEMIC_INSTITUTION', label: 'Academic Institution' },
  { id: 'PUBLIC_USER', label: 'Public User' },
];

export function RoleSwitcher() {
  const [selectedRole, setSelectedRole] = useState<DemoRole>('RESEARCHER');

  useEffect(() => {
    const saved = localStorage.getItem('sih_demo_role') as DemoRole;
    if (saved && ROLES.some(r => r.id === saved)) {
      setSelectedRole(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as DemoRole;
    setSelectedRole(role);
    localStorage.setItem('sih_demo_role', role);
    window.dispatchEvent(new Event('roleChanged'));
  };

  return (
    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Demo Role</span>
        <select
          value={selectedRole}
          onChange={handleChange}
          aria-label="Demo Role Switcher"
          className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
        >
          {ROLES.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
