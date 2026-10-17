export const normalizePhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  if (d.length === 11 && (d.startsWith("8") || d.startsWith("7"))) return "+7" + d.slice(1);
  if (d.length === 10) return "+7" + d;
  return d ? "+" + d : "";
};
