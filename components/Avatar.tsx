function getInitials(email?: string | null, name?: string | null): string {
  if (email) return email.slice(0, 2).toUpperCase();
  if (name) return name.slice(0, 2).toUpperCase();
  return "??";
}

export default function Avatar({
  email,
  name,
  size = 32,
  className = "",
}: {
  email?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-yt-red font-medium text-white ${className}`}
    >
      {getInitials(email, name)}
    </div>
  );
}
