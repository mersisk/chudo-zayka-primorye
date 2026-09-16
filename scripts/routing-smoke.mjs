import assert from "node:assert/strict";
import { getRoute, routeHref } from "../src/ui.js";

assert.equal(routeHref("/"), "/");
assert.equal(routeHref("/catalog/express/"), "/catalog/express");
assert.equal(routeHref("service/arthur-pirozhkov"), "/service/arthur-pirozhkov");
assert.equal(getRoute({ pathname: "/" }), "/");
assert.equal(getRoute({ pathname: "/catalog/express/" }), "/catalog/express");
assert.equal(getRoute({ hash: "#/service/arthur-pirozhkov", pathname: "/" }), "/service/arthur-pirozhkov");
assert.equal(getRoute({ hash: "#main", pathname: "/catalog/shows" }), "/catalog/shows");

console.log("Проверка маршрутизации пройдена");
