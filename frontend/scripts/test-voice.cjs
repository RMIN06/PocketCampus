const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const source = ts.transpileModule(fs.readFileSync("lib/voice-expense.ts", "utf8"), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
const context = { exports: {} }; vm.runInNewContext(source, context);
const parse = context.exports.parseVoiceExpense;
for (const input of ["Hey Pocket, I just spended 500 rupess at indrive", "Hey Pocket, I spent 500 rupees at inDrive", "I spent five hundred rupees at inDrive"]) {
  const result = parse(input);
  assert.equal(result.amount, 500); assert.equal(result.category, "transport"); assert.match(result.description, /indrive/i);
}
assert.equal(parse("I paid 1,250.50 rupees for books").amount, 1250.5);
assert.equal(parse("I spent two thousand five hundred rupees on groceries").amount, 2500);
assert.equal(parse("I spent 250 rupees on chai").category, "food");
assert.equal(parse("I spent 100 rupees at a mystery shop").category, "other");
for (const input of ["Hey Pocket", "I spent zero rupees at indrive", "I spent 0 rupees at indrive", "I spent -500 rupees at indrive", "I spent 500 on food and 200 on books", "I spent 10 dollars on lunch", "I received 500 rupees", "I spent 500 yesterday", "I spent 500 rupees", "I spent 1.005 rupees at a cafe"]) assert.throws(() => parse(input), undefined, input);
console.log("Voice parsing: 17 scenarios passed");
