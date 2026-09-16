import assert from "node:assert/strict";
import { prepareApplication, telegramText } from "./application.mjs";

const validInput = {
  name: "Анна", phone: "+7 (994) 994-04-33", eventDate: "2099-01-01", city: "Владивосток", childAge: "7", comment: "Праздник дома", consent: true,
  items: [{ id: "arthur-pirozhkov", title: "Подменённое название", price: 1 }],
};
const application = prepareApplication(validInput);
assert.equal(application.items[0].title, "Артур Пирожков");
assert.equal(application.phone, "+7 (994) 994-04-33");
assert.match(telegramText(application), /Артур Пирожков/);
assert.throws(() => prepareApplication({ ...validInput, items: [{ id: "unknown" }] }), /недоступный вариант/);
console.log("Проверка подготовки заявки пройдена");
