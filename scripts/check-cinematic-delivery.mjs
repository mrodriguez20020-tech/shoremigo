/** Technical delivery QC only. This is not an artistic-quality acceptance test. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
const manifestPath = process.argv[2] || "public/cinematic/film/manifest.json";
const reportPath = process.argv[3] || "work/signature/delivery-qc.json";
const report = {
  manifest: manifestPath,
  productionMediaReady: false,
  visualApproval: "required separately",
  checks: [],
  errors: [],
};
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.status !== "ready")
    throw new Error(
      "Matched production footage is not supplied. The public manifest explicitly remains awaiting-production-media.",
    );
  if (
    manifest.version !== 1 ||
    !manifest.geometryId ||
    !manifest.cameraId ||
    !manifest.rights ||
    !manifest.desktop ||
    !manifest.lighting?.day ||
    !manifest.lighting?.sunset
  )
    throw new Error(
      "Version 1, canonical scene, frozen camera-rig, lighting and rights metadata are required.",
    );
  for (const [name, variant] of Object.entries({
    desktop: manifest.desktop,
    mobile: manifest.mobile,
  }).filter(([, v]) => v)) {
    const pair = [];
    for (const light of ["day", "sunset"]) {
      for (const format of ["mp4", "webm"].filter((f) => variant[light]?.[f])) {
        const url = variant[light][format];
        if (
          !/^\/cinematic\/film\/[a-z0-9][a-z0-9_./-]*\.(mp4|webm)$/.test(url) ||
          url.includes("..")
        )
          throw new Error(`Invalid local delivery path: ${url}`);
        const file = path.join("public", url);
        const metadata = spawnSync(
          "ffprobe",
          [
            "-v",
            "error",
            "-count_frames",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            file,
          ],
          { encoding: "utf8" },
        );
        if (metadata.status !== 0)
          throw new Error(`Cannot probe ${file}: ${metadata.stderr}`);
        const info = JSON.parse(metadata.stdout);
        if (info.streams.some((s) => s.codec_type === "audio"))
          throw new Error(
            `${file}: remove all audio streams; optional app audio is separate.`,
          );
        const video = info.streams.find((s) => s.codec_type === "video");
        if (!video) throw new Error(`${file}: no video stream`);
        const [num, den] = video.avg_frame_rate.split("/").map(Number);
        const fps = num / den;
        const expectedCodec = format === "mp4" ? "h264" : "vp9";
        if (video.codec_name !== expectedCodec)
          throw new Error(`${file}: expected ${expectedCodec}`);
        if (
          video.width !== variant.width ||
          video.height !== variant.height ||
          Math.abs(fps - variant.fps) > 0.001 ||
          Number(video.nb_read_frames) !== variant.frames
        )
          throw new Error(
            `${file}: cadence, frame count or dimensions differ from the declared matched pair.`,
          );
        if (
          ![24, 30].includes(fps) ||
          variant.frames / fps < 6 ||
          variant.frames / fps > 16
        )
          throw new Error(
            `${file}: require 6–16 seconds at constant 24/30 fps.`,
          );
        if (name === "desktop" && (video.width < 1280 || video.height < 720))
          throw new Error(`${file}: desktop must be at least 1280×720.`);
        const bytes = fs.statSync(file).size;
        const budget = name === "mobile" ? 2_500_000 : 6_000_000;
        if (bytes > budget)
          throw new Error(
            `${file}: exceeds the ${budget} byte ${name} delivery budget.`,
          );
        const row = {
          variant: name,
          light,
          format,
          file,
          width: video.width,
          height: video.height,
          fps,
          frames: Number(video.nb_read_frames),
          bytes,
          sha256: crypto
            .createHash("sha256")
            .update(fs.readFileSync(file))
            .digest("hex"),
        };
        pair.push(row);
        report.checks.push(row);
      }
      const poster = variant[light]?.poster;
      if (
        typeof poster !== "string" ||
        !/^\/cinematic\/film\/[a-z0-9][a-z0-9_./-]*\.webp$/.test(poster) ||
        poster.includes("..") ||
        !fs.existsSync(path.join("public", poster))
      )
        throw new Error(`${name}/${light}: missing local WebP poster.`);
    }
    if (variant.day.mp4 === variant.sunset.mp4)
      throw new Error(
        `${name}: daylight and sunset cannot point at the same file.`,
      );
    if (pair.filter((r) => r.format === "mp4").length !== 2)
      throw new Error(`${name}: both H.264 lighting states are required.`);
    for (const format of ["mp4", "webm"]) {
      const clips = pair.filter((row) => row.format === format);
      if (clips.length === 2 && clips[0].sha256 === clips[1].sha256)
        throw new Error(`${name}: lighting variants contain identical ${format} bytes.`);
    }
  }
  report.productionMediaReady = true;
} catch (error) {
  report.errors.push(error.message);
}
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionMediaReady ? 0 : 2;
