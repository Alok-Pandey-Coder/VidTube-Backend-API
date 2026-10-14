import {spawn} from "child_process"
import fs from "fs/promises"
import path from "path"
import { stdout } from "process"

const RENDITIONS = [
  {
    name: "360p", height: 360, bandwidth: 800000
  },
  {
    name: "720p", height: 720, bandwidth: 2800000
  }
]

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d))
    p.stderr.on("data", (d) => (stderr += d));
    p.on("error", reject)
    p.on("close", (code) => {
      if(code == 0) resolve({stdout, stderr});
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`));
    })
  })
}

export async function probeVideo(filePath) {
  const {stdout} =  await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration",
    "-of", "json",
    filePath,
  ])

  const info = JSON.parse(stdout);
  return {
    width: info.streams[0].width,
    height: info.streams[0].height,
    duration: Math.round(parseFloat(info.format.duration))
  }
}

export async function transcodeTOHls(inputPath, outDir, srcWidth, srcHeight) {
  let variants = RENDITIONS.filter((r) => r.height <= srcHeight);
  if(variants.length === 0) variants = [RENDITIONS[0]];

  for(const v of variants) {
    const dir = path.join(outDir, v.name);
    await fs.mkdir(dir, {recursive: true});

    await run("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-vf", `scale=-2:${v.height}`,
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-force_key_frames", "expr:gte(t,n_forced*6)",
      "-c:a", "aac",
      "-b:a", "128k",
      "-f", "hls",
      "-hls_time", "6",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(dir, "seg_%03d.ts"),
      path.join(dir, "index.m3u8"),
    ])
  }

  let master = "#EXTM3U\n#EXT-X-VERSION:3\n";
  for (const v of variants) {
    const w = Math.round((v.height * srcWidth) / srcHeight / 2) * 2;
    master += `#EXT-X-STREAM-INF:BANDWIDTH=${v.bandwidth},RESOLUTION=${w}x${v.height}\n${v.name}/index.m3u8\n`;
  }
  await fs.writeFile(path.join(outDir, "master.m3u8"), master);

  return variants.map((v) => v.name);
}