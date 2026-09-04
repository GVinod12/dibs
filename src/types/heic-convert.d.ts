declare module "heic-convert" {
  interface ConvertOptions {
    buffer: ArrayBufferLike | Uint8Array | Buffer;
    format: "JPEG" | "PNG";
    quality?: number; // 0..1, JPEG only
  }
  function convert(options: ConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}
