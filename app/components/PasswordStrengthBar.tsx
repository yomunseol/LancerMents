const LEVELS = [
  null,
  { color: "bg-red-500", width: "25%" },
  { color: "bg-orange-500", width: "50%" },
  { color: "bg-yellow-500", width: "75%" },
  { color: "bg-green-500", width: "100%" },
] as const;

export function getPasswordStrength(password: string): number {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

export default function PasswordStrengthBar({
  password,
}: {
  password: string;
}) {
  const level = getPasswordStrength(password);
  const meta = LEVELS[level];

  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E2D8E0] dark:bg-[#4A2E46]">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${
          meta ? meta.color : ""
        }`}
        style={{ width: meta ? meta.width : "0%" }}
      />
    </div>
  );
}
