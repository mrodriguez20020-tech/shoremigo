/** Preserve already reviewed evidence; future media belongs in versioned review assets. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const baseline = "c64ace134e228403c11ece9e152a8a30faa66350";
const media = /\.(png|jpe?g|webp|gif|avif|mp4|webm|mov|zip|gz)$/i;
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const allowed = new Map(git("ls-tree", "-r", baseline, "--", "docs").split("\n").map(row => {
  const [meta, file] = row.split("\t");
  return [file, meta?.split(" ")[2]];
}));
const files = git("ls-files", "--cached", "--others", "--exclude-standard", "--", "docs").split("\n");
const errors = [];
for (const file of allowed.keys()) {
  if (media.test(file) && !fs.existsSync(file)) errors.push(`${file}: historical review evidence is missing; preserve an accessible archive before retiring it.`);
}
for (const file of files.filter(file => media.test(file) && fs.existsSync(file))) {
  if (!allowed.has(file)) errors.push(`${file}: new review media must be published outside Git history.`);
  else if (git("hash-object", "--", file) !== allowed.get(file)) errors.push(`${file}: preserve the reviewed snapshot; publish a new version instead.`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`Review evidence policy passed: historical media at ${baseline.slice(0, 7)} preserved; no new/overwritten binary evidence under docs/.`);
