import { cn } from "@/lib/utils";

/**
 * Maps a file extension to an SVG icon in `/public/book`.
 * Ported from gkebook-school-frontend FileIcon, adapted for this project.
 */
const FILE_ICON_MAP: Record<string, string> = {
  aep: "aep",
  ai: "ai",
  audio: "audio",
  avi: "avi",
  code: "code",
  css: "css",
  csv: "csv",
  dmg: "dmg",
  doc: "doc",
  docx: "docx",
  document: "document",
  empty: "empty",
  eps: "eps",
  exe: "exe",
  fig: "fig",
  folder: "folder",
  gif: "gif",
  html: "html",
  image: "image",
  img: "img",
  jpeg: "jpeg",
  jpg: "jpg",
  js: "js",
  json: "json",
  mkv: "mkv",
  mov: "mp4",
  mp3: "mp3",
  mp4: "mp4",
  mpeg: "mpeg",
  m4a: "audio",
  ogg: "audio",
  obj: "3d",
  glb: "3d",
  gltf: "3d",
  fbx: "3d",
  pdf: "pdf",
  png: "png",
  ppt: "ppt",
  pptx: "pptx",
  psd: "psd",
  rar: "rar",
  rss: "rss",
  sql: "sql",
  svg: "svg",
  tif: "tiff",
  tiff: "tiff",
  txt: "txt",
  wav: "wav",
  webp: "webp",
  xls: "xls",
  xlsx: "xlsx",
  xml: "xml",
  zip: "zip",
};

interface FileIconProps {
  /** File name with extension, e.g. "lesson.pdf" */
  name?: string;
  className?: string;
}

export function FileIcon({ name, className }: FileIconProps) {
  const fileName = name?.toLowerCase() ?? "";
  const extMatch = fileName.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch?.[1];
  const icon = (ext && FILE_ICON_MAP[ext]) || "empty";

  return (
    <img
      src={`/book/${icon}.svg`}
      alt={ext ?? "file"}
      className={cn("h-10 w-10 rounded object-cover", className)}
    />
  );
}
