// Reads the copyright (name ID 0) and licence (name ID 13) that KFGQPC embeds
// in the Hafs TTF, so the bundled notice quotes them word for word.

const NAME_COPYRIGHT = 0;
const NAME_LICENSE = 13;
const PLATFORM_WINDOWS = 3;
const LANGUAGE_EN_US = 0x04_09;

export const readFontLicense = (
  font: Uint8Array
): { copyright: string; license: string } => {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tableCount = view.getUint16(4);
  let nameTable = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const record = 12 + index * 16;
    const tag = String.fromCodePoint(
      ...font.subarray(record, record + 4).values()
    );
    if (tag === "name") {
      nameTable = view.getUint32(record + 8);
    }
  }
  if (nameTable < 0) {
    throw new Error("The font has no name table");
  }
  const count = view.getUint16(nameTable + 2);
  const storage = nameTable + view.getUint16(nameTable + 4);
  const names = new Map<number, string>();
  for (let index = 0; index < count; index += 1) {
    const record = nameTable + 6 + index * 12;
    if (
      view.getUint16(record) === PLATFORM_WINDOWS &&
      view.getUint16(record + 4) === LANGUAGE_EN_US
    ) {
      const start = storage + view.getUint16(record + 10);
      const bytes = font.subarray(start, start + view.getUint16(record + 8));
      names.set(
        view.getUint16(record + 6),
        new TextDecoder("utf-16be").decode(bytes).replaceAll("\r\n", "\n")
      );
    }
  }
  const copyright = names.get(NAME_COPYRIGHT);
  const license = names.get(NAME_LICENSE);
  if (!(copyright && license)) {
    throw new Error("The font lacks its copyright or licence text");
  }
  return { copyright, license };
};
