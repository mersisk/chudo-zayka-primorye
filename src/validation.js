const todayIso = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

export function normalizeRussianPhone(value) {
  const raw = String(value || "").trim();
  if (!raw || /[^0-9+().\-\s]/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return /^7\d{10}$/.test(digits) ? digits : null;
}

export function formatRussianPhone(value) {
  const digits = normalizeRussianPhone(value);
  if (!digits) return String(value || "").trim();
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

export function validateLead(values, today = todayIso()) {
  const name = String(values.name || "").trim().replace(/\s+/g, " ");
  const phone = normalizeRussianPhone(values.phone);
  const eventDate = String(values.eventDate || "").trim();
  const city = String(values.city || "").trim().replace(/\s+/g, " ");
  const childAge = String(values.childAge || "").trim();
  const comment = String(values.comment || "").trim();
  const errors = [];

  if (!/^[\p{L}][\p{L}\p{M}\s.'-]{1,79}$/u.test(name)) errors.push("Укажите имя: минимум две буквы, без цифр и специальных символов.");
  if (!phone) errors.push("Введите российский номер в формате +7 (999) 999-99-99.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || eventDate < today) errors.push("Укажите дату события: сегодня или позже.");
  if (city && (city.length < 2 || !/^[\p{L}\p{M}\d][\p{L}\p{M}\d\s.,'/-]*$/u.test(city))) errors.push("Проверьте город или район.");
  if (childAge && (!/^\d{1,2}$/.test(childAge) || Number(childAge) > 99)) errors.push("Возраст ребёнка укажите числом от 0 до 99.");
  if (comment.length > 1000) errors.push("Комментарий не должен быть длиннее 1000 символов.");
  if (!values.consent) errors.push("Подтвердите согласие на обработку персональных данных.");

  return { valid: errors.length === 0, errors, value: { name, phone: phone ? formatRussianPhone(phone) : String(values.phone || "").trim(), eventDate, city, childAge, comment } };
}
