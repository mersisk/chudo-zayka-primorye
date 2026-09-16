import assert from "node:assert/strict";
import { formatRussianPhone, normalizeRussianPhone, validateLead } from "../src/validation.js";

assert.equal(normalizeRussianPhone("8 (994) 994-04-33"), "79949940433");
assert.equal(normalizeRussianPhone("+7 994 994 04 33"), "79949940433");
assert.equal(normalizeRussianPhone("+7 994 99"), null);
assert.equal(normalizeRussianPhone("abc +7 994 994-04-33"), null);
assert.equal(formatRussianPhone("79949940433"), "+7 (994) 994-04-33");
const valid = validateLead({ name: "Анна-Мария", phone: "8 (994) 994-04-33", eventDate: "2026-10-01", city: "Владивосток", childAge: "7", consent: true }, "2026-09-16");
assert.equal(valid.valid, true);
assert.equal(valid.value.phone, "+7 (994) 994-04-33");
const invalid = validateLead({ name: "A1", phone: "123", eventDate: "2026-09-15", childAge: "120", consent: false }, "2026-09-16");
assert.equal(invalid.valid, false);
assert.equal(invalid.errors.length, 5);
console.log("Проверка валидации формы пройдена");
