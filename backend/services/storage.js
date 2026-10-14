import fs from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd(), "storage");

// key ko safe absolute path me convert karta hai
function resolveKey(key) {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

// 1) Original uploaded file ko storage me rakhna
export async function saveOriginal(localPath, key) {
  const dest = resolveKey(key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  try {
    await fs.rename(localPath, dest);          // fast: same drive pe move
  } catch (err) {
    if (err.code === "EXDEV") {                // alag drive: copy + delete
      await fs.copyFile(localPath, dest);
      await fs.unlink(localPath);
    } else throw err;
  }
  return key;
}

// 2) Key se local file path nikalna (FFmpeg ko iski zarurat padegi)
export function getFilePath(key) {
  return resolveKey(key);
}

// 3) HLS output folder ko storage me rakhna
export async function saveHlsOutput(localDir, keyPrefix) {
  const dest = resolveKey(keyPrefix);
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(localDir, dest, { recursive: true });
  return keyPrefix;
}

export async function deleteFile(key) {
  await fs.rm(resolveKey(key), {force: true});
}