import type { TeamMember } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function PersonAvatar({ member, size = "md", title = true }: { member: TeamMember; size?: "sm" | "md" | "lg"; title?: boolean }) {
  const sizes = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs";
  return (
    <span
      title={title ? `${member.full_name}${member.role_title ? ` · ${member.role_title}` : ""}` : undefined}
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-[var(--tbx-avatar)] font-bold text-white shadow-sm ${sizes}`}
    >
      {member.avatar_url ? <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" /> : initials(member.full_name)}
    </span>
  );
}

export function AvatarStack({ members }: { members: TeamMember[] }) {
  const visible = members.slice(0, 3);
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((member) => <PersonAvatar key={member.id} member={member} size="sm" />)}
      {members.length > 3 ? <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-700">+{members.length - 3}</span> : null}
    </div>
  );
}
