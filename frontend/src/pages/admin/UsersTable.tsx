import React, { useState } from "react";
import { Shield, ShieldCheck, LogIn, KeyRound, User } from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";
import { PlayfulSelect } from "../../components/PlayfulSelect";
import { PlayfulSwitch } from "../../components/PlayfulSwitch";
import { SettingsSectionHeader } from "../settings/SettingsRow";
import type { AdminUser } from "./types";

type UsersTableProps = {
  users: AdminUser[];
  loading: boolean;
  currentUserId?: string;
  resetPasswordLoadingId: string | null;
  onRoleChange: (user: AdminUser, role: string) => void;
  onToggleActive: (user: AdminUser) => void;
  onToggleMustReset: (user: AdminUser) => void;
  onImpersonate: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void | Promise<void>;
};

const headerCellClass =
  "px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 sm:px-6";
const actionButtonClass =
  "ui-button-secondary whitespace-nowrap px-2.5 py-1.5 text-xs";

type UserControlProps = {
  user: AdminUser;
  currentUserId?: string;
};

const RoleSelect: React.FC<
  UserControlProps & { onRoleChange: UsersTableProps["onRoleChange"] }
> = ({ user, currentUserId, onRoleChange }) => (
  <PlayfulSelect
    ariaLabel={`Role for ${user.name}`}
    value={user.role}
    disabled={user.id === currentUserId || user.id === "bootstrap-admin"}
    onChange={(role) => onRoleChange(user, role)}
    size="sm"
    portal
    options={[
      { value: "USER", label: "USER", icon: <User size={13} /> },
      { value: "ADMIN", label: "ADMIN", icon: <ShieldCheck size={13} /> },
    ]}
  />
);

const LabeledSwitch: React.FC<{
  label: string;
  ariaLabel: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}> = ({ label, ariaLabel, checked, disabled, onChange }) => (
  // A <label> forwards taps on the caption to the switch button inside it.
  <label
    className={`inline-flex items-center gap-2 ${disabled ? "" : "cursor-pointer"}`}
  >
    <PlayfulSwitch
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      ariaLabel={ariaLabel}
    />
    <span className="text-xs font-semibold text-slate-600 dark:text-neutral-300">
      {label}
    </span>
  </label>
);

const UserActions: React.FC<
  UserControlProps &
    Pick<
      UsersTableProps,
      "resetPasswordLoadingId" | "onImpersonate" | "onResetPassword"
    >
> = ({
  user,
  currentUserId,
  resetPasswordLoadingId,
  onImpersonate,
  onResetPassword,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <button
      onClick={() => onImpersonate(user)}
      disabled={user.id === currentUserId}
      aria-label={`Impersonate ${user.name}`}
      className={actionButtonClass}
    >
      <LogIn size={14} />
      Impersonate
    </button>
    <button
      onClick={() => void onResetPassword(user)}
      disabled={user.id === currentUserId || resetPasswordLoadingId === user.id}
      className={actionButtonClass}
      title={
        user.id === currentUserId
          ? "Use Profile → Change Password for your own account"
          : "Generate a temporary password"
      }
    >
      <KeyRound size={14} />
      {resetPasswordLoadingId === user.id
        ? "Generating…"
        : "Temporary password"}
    </button>
  </div>
);

const UserIdentity: React.FC<{ user: AdminUser }> = ({ user }) => (
  <>
    <div className="font-bold text-slate-900 dark:text-white truncate">
      {user.name}
    </div>
    <div className="text-slate-500 dark:text-neutral-400 truncate">
      {user.email}
    </div>
    {user.username && (
      <div className="text-xs text-slate-400 dark:text-neutral-500">
        @{user.username}
      </div>
    )}
  </>
);

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  currentUserId,
  resetPasswordLoadingId,
  onRoleChange,
  onToggleActive,
  onToggleMustReset,
  onImpersonate,
  onResetPassword,
}) => {
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(
    null,
  );

  // Deactivating locks someone out, so it asks first; activating does not.
  const requestToggleActive = (user: AdminUser) => {
    if (user.isActive) setDeactivateTarget(user);
    else onToggleActive(user);
  };

  const activeSwitch = (user: AdminUser) => (
    <LabeledSwitch
      label={user.isActive ? "Active" : "Inactive"}
      ariaLabel={`Active: ${user.name}`}
      checked={user.isActive}
      disabled={user.id === currentUserId}
      onChange={() => requestToggleActive(user)}
    />
  );

  const mustResetSwitch = (user: AdminUser, label?: string) => (
    <LabeledSwitch
      label={label ?? (user.mustResetPassword ? "Yes" : "No")}
      ariaLabel={`Must change password: ${user.name}`}
      checked={user.mustResetPassword}
      onChange={() => onToggleMustReset(user)}
    />
  );

  const emptyState =
    users.length === 0 && !loading ? (
      <span className="font-medium text-slate-500 dark:text-neutral-500">
        No users found.
      </span>
    ) : null;

  return (
    <section>
      <SettingsSectionHeader
        icon={<Shield size={20} />}
        tileClassName="border-black bg-indigo-400 text-black dark:border-neutral-700 dark:bg-indigo-400 dark:text-black"
        title="Users"
      >
        {loading ? (
          <span className="text-xs font-bold text-slate-400 dark:text-neutral-500">
            Loading…
          </span>
        ) : null}
      </SettingsSectionHeader>

      <div className="overflow-hidden rounded-2xl border-2 border-slate-800 bg-white shadow-[3px_3px_0px_0px_rgba(30,41,59,0.9)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.18)]">
        {/* shortcut: viewport breakpoint, so a very wide sidebar at 1280–1500 px
            still gets the (horizontally scrollable) table; use a container query if that matters. */}
        <ul className="divide-y divide-slate-100 dark:divide-neutral-800 xl:hidden">
          {users.map((user) => (
            <li key={user.id} className="space-y-3 px-4 py-3.5 text-sm">
              <div className="min-w-0">
                <UserIdentity user={user} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <RoleSelect
                  user={user}
                  currentUserId={currentUserId}
                  onRoleChange={onRoleChange}
                />
                {activeSwitch(user)}
                {mustResetSwitch(user, "Must change password")}
              </div>
              <UserActions
                user={user}
                currentUserId={currentUserId}
                resetPasswordLoadingId={resetPasswordLoadingId}
                onImpersonate={onImpersonate}
                onResetPassword={onResetPassword}
              />
            </li>
          ))}
          {emptyState ? <li className="px-4 py-6">{emptyState}</li> : null}
        </ul>

        <div className="hidden overflow-x-auto xl:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-neutral-800/70">
              <tr className="text-left">
                <th className={headerCellClass}>User</th>
                <th className={headerCellClass}>Role</th>
                <th className={headerCellClass}>Active</th>
                <th className={headerCellClass}>Must change password</th>
                <th className={headerCellClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-slate-100 dark:border-neutral-800"
                >
                  <td className="px-4 sm:px-6 py-3 min-w-[220px]">
                    <UserIdentity user={user} />
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <RoleSelect
                      user={user}
                      currentUserId={currentUserId}
                      onRoleChange={onRoleChange}
                    />
                  </td>
                  <td className="px-4 sm:px-6 py-3">{activeSwitch(user)}</td>
                  <td className="px-4 sm:px-6 py-3">{mustResetSwitch(user)}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <UserActions
                      user={user}
                      currentUserId={currentUserId}
                      resetPasswordLoadingId={resetPasswordLoadingId}
                      onImpersonate={onImpersonate}
                      onResetPassword={onResetPassword}
                    />
                  </td>
                </tr>
              ))}
              {emptyState ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6">
                    {emptyState}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deactivateTarget)}
        title={deactivateTarget ? `Deactivate ${deactivateTarget.name}?` : ""}
        message="They can no longer sign in. Their drawings are kept."
        confirmText="Deactivate"
        onConfirm={() => {
          if (deactivateTarget) onToggleActive(deactivateTarget);
          setDeactivateTarget(null);
        }}
        onCancel={() => setDeactivateTarget(null)}
      />
    </section>
  );
};
