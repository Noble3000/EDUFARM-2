declare module "mammoth" {
  export function extractRawText(opts: { buffer: Buffer }): Promise<{ value: string }>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
