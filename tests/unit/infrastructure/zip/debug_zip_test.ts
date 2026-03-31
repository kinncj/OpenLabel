import { it } from "vitest";
import { readZip } from "@/common/infrastructure/zip/ZipReader";
import { strToU8, zipSync } from "fflate";

it("debug: show map contents", () => {
  const zip = zipSync({ "images/train/cat.jpg": strToU8("data") });
  console.log("zip bytes:", zip.byteLength);
  const result = readZip(zip);
  console.log("map size:", result.size);
  console.log("map keys:", [...result.keys()]);
});
