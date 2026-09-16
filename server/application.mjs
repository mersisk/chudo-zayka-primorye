import { randomUUID } from "node:crypto";
import { getService } from "../src/project.js";
import { validateLead } from "../src/validation.js";

const MAX_ITEMS = 12;

export function prepareApplication(input) {
  const checked = validateLead(input);
  if (!checked.valid) {
    const error = new Error(checked.errors[0]);
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > MAX_ITEMS) {
    const error = new Error("Выберите от одного до двенадцати вариантов для заявки.");
    error.statusCode = 400;
    throw error;
  }

  const itemIds = [...new Set(input.items.map((item) => String(item?.id || "")))];
  const items = itemIds.map((id) => getService(id)).filter(Boolean).map((service) => ({
    id: service.id,
    title: service.title,
    category: service.category,
    duration: service.duration,
    price: service.price ?? null,
    priceUnit: service.priceUnit || null,
  }));
  if (items.length !== itemIds.length) {
    const error = new Error("В заявке найден недоступный вариант. Обновите страницу и попробуйте снова.");
    error.statusCode = 400;
    throw error;
  }

  return {
    id: randomUUID(),
    ...checked.value,
    items,
    knownTotal: items.reduce((total, item) => total + (item.price || 0), 0),
  };
}

export function telegramText(application) {
  const lines = [
    "Новая заявка с сайта «Чудо Зайка»",
    `Имя: ${application.name}`,
    `Телефон: ${application.phone}`,
    `Дата: ${application.eventDate}`,
    application.city ? `Город / район: ${application.city}` : "Город / район: не указан",
    application.childAge ? `Возраст ребёнка: ${application.childAge}` : "Возраст ребёнка: не указан",
    `Выбрано: ${application.items.map((item) => item.title).join(", ")}`,
    application.comment ? `Комментарий: ${application.comment}` : "Комментарий: —",
  ];
  if (application.knownTotal) lines.push(`Известная сумма: ${application.knownTotal} ₽`);
  return lines.join("\n");
}
