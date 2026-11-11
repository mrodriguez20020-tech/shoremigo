import path from "node:path";

// Each Vitest worker gets its own JSON data folder. Workers run test files in
// parallel; sharing one db.json made atomic renames collide on Windows (EPERM).
process.env.SHOREMIGO_DATA_DIR = path.join(process.env.SHOREMIGO_DATA_DIR ?? ".data-test", `w${process.env.VITEST_POOL_ID ?? "0"}`);
