import { describe,it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { evidenceFormat,validateEvidenceBytes } from '@/features/verification/bytes';
describe('private original verification bytes',()=>{
 it('keeps original readable raster bytes after actual decoding',async()=>{const original=await readFile(new URL('../fixtures/vehicle-photo.png',import.meta.url));expect(evidenceFormat(original)).toBe('png');expect(await validateEvidenceBytes(original,'png')).toEqual(original);});
 it.each(['<svg xmlns="http://www.w3.org/2000/svg"></svg>','<html>not an image</html>','not a PDF'])('rejects unsupported content even with a friendly file name',async raw=>{await expect(validateEvidenceBytes(Buffer.from(raw),'jpg')).rejects.toThrow();});
 it('rejects forged PDF headers without a complete trailer',async()=>{await expect(validateEvidenceBytes(Buffer.from('%PDF-1.7 incomplete document bytes'),'pdf')).rejects.toThrow();});
 it('rejects a stored format mismatch',async()=>{const original=await readFile(new URL('../fixtures/vehicle-photo.png',import.meta.url));await expect(validateEvidenceBytes(original,'jpg')).rejects.toThrow();});
 it('rejects oversized files before decoding',async()=>{await expect(validateEvidenceBytes(Buffer.alloc(8*1024*1024+1),'png')).rejects.toThrow();});
});
