import { readFile } from "fs/promises";

const manifestPath = "manifest.json";
const raw = await readFile(manifestPath, "utf8");
const manifest = JSON.parse(raw);

const required = [
  "id",
  "name",
  "version",
  "minAppVersion",
  "description",
  "author",
  "isDesktopOnly",
];

const missing = required.filter((key) => !(key in manifest));
if (missing.length > 0) {
  throw new Error(`manifest.json missing fields: ${missing.join(", ")}`);
}

if (!/^[a-z0-9-]+$/.test(manifest.id)) {
  throw new Error("manifest.json id should be lowercase alphanumeric with dashes");
}

if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
  throw new Error("manifest.json version should be semver (x.y.z)");
}

if (!/^\d+\.\d+\.\d+$/.test(manifest.minAppVersion)) {
  throw new Error("manifest.json minAppVersion should be semver (x.y.z)");
}

console.log("manifest.json validation OK");
