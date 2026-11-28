import { Global, Injectable, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { promises as fs } from 'fs';
import { dirname, join, resolve, sep } from 'path';

/**
 * Hujjatlar ombori.
 *  - SUPABASE_URL + SUPABASE_SERVICE_KEY berilsa: Supabase Storage (PRIVATE bucket, nom: SUPABASE_BUCKET, default "documents").
 *  - Aks holda, UPLOAD_DIR berilmasa: ma'lumotlar bazasi (FileBlob) — doimiy, qo'shimcha xizmat kerak emas.
 *  - UPLOAD_DIR berilsa: lokal papka (doimiy disk ulangan bo'lsa).
 * Fayllar HECH QACHON ochiq URL bilan berilmaydi: faqat egasi tekshirilgan API orqali yuklab olinadi.
 */
@Injectable()
export class StorageService {
  private url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  private key = process.env.SUPABASE_SERVICE_KEY;
  private bucket = process.env.SUPABASE_BUCKET ?? 'documents';
  private dir = resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'));
  private remote = !!(this.url && this.key);
  private useDb = !this.remote && !process.env.UPLOAD_DIR;
  constructor(private db: PrismaService) {}
  /** Admin diagnostikasi uchun. */
  mode() { return this.remote ? 'supabase' : this.useDb ? 'database' : 'disk'; }

  private local(key: string) {
    const p = resolve(this.dir, key);
    if (!p.startsWith(this.dir + sep)) throw new Error('bad_key'); // path traversal himoyasi
    return p;
  }
  private headers(extra: Record<string, string> = {}) { return { Authorization: `Bearer ${this.key}`, apikey: this.key as string, ...extra }; }

  async put(key: string, data: Buffer, mime: string) {
    if (this.remote) {
      const r = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${key}`, { method: 'POST', headers: this.headers({ 'Content-Type': mime, 'x-upsert': 'false' }), body: new Uint8Array(data), signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(`storage_put_${r.status}`);
      return;
    }
    if (this.useDb) { await this.db.fileBlob.upsert({ where: { key }, update: { data: data, mime }, create: { key, data, mime } }); return; }
    const p = this.local(key);
    await fs.mkdir(dirname(p), { recursive: true });
    await fs.writeFile(p, data);
  }

  async get(key: string): Promise<Buffer> {
    if (this.remote) {
      const r = await fetch(`${this.url}/storage/v1/object/${this.bucket}/${key}`, { headers: this.headers(), signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(`storage_get_${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    }
    if (this.useDb) { const r = await this.db.fileBlob.findUnique({ where: { key } }); if (!r) throw new Error('storage_get_404'); return Buffer.from(r.data); }
    return fs.readFile(this.local(key));
  }

  async remove(key: string) {
    try {
      if (this.remote) await fetch(`${this.url}/storage/v1/object/${this.bucket}/${key}`, { method: 'DELETE', headers: this.headers(), signal: AbortSignal.timeout(20_000) });
      else if (this.useDb) await this.db.fileBlob.deleteMany({ where: { key } });
      else await fs.unlink(this.local(key));
    } catch { /* fayl allaqachon yo'q bo'lishi mumkin */ }
  }
}

@Global()
@Module({ providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
