// Loopback test-only transport: private draft persistence and Storage authorization
// execute real migrations/RLS in PostgreSQL. Auth and object transport remain simulated.
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
export async function createSellerFixture() {
  const db = new PGlite(), blobs = new Map();
  for (const file of ["auth-schema.sql", "storage-schema.sql"]) await db.exec(await readFile(new URL(`../tests/fixtures/${file}`, import.meta.url), "utf8"));
  const dir = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  const columns = new Map(); for (const row of (await db.query("select table_name,column_name from information_schema.columns where table_schema='public'")).rows) { if (!columns.has(row.table_name)) columns.set(row.table_name, new Set()); columns.get(row.table_name).add(row.column_name); }
  async function handle(request, response, account) {
    const url = new URL(request.url, "http://127.0.0.1");
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(seller_create_draft|seller_save_draft|seller_manage_photo|seller_submit_listing)$/)?.[1];
    const table = url.pathname.match(/^\/rest\/v1\/(seller_listings|seller_listing_photos)$/)?.[1];
    const storage = url.pathname.match(/^\/storage\/v1\/object\/(?:authenticated\/)?seller-draft-photos(?:\/(.*))?$/);
    if (!rpc && !table && !storage) return false;
    const json = (value, status = 200) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(value, (_key, value) => typeof value === "bigint" ? Number(value) : value)); return true; };
    if (!account) return json({ code: "42501", message: "Test-only identity required" }, 401);
    await db.query("insert into auth.users(id) values ($1) on conflict do nothing", [account.id]);
    const transact = (fn) => db.transaction(async (tx) => { await tx.exec("set local role authenticated"); await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [account.id]); return fn(tx); });
    try {
      if (rpc) { let raw = ""; for await (const chunk of request) raw += chunk; const body = JSON.parse(raw); return json((await transact((tx) => tx.query(`select public.${rpc}($1::jsonb) as value`, [JSON.stringify(body.p_input)]))).rows[0].value); }
      if (storage) {
        const path = decodeURIComponent(storage[1] ?? "");
        if (request.method === "POST") {
          const chunks = []; for await (const chunk of request) chunks.push(chunk); const bytes = Buffer.concat(chunks);
          await transact((tx) => tx.query("insert into storage.objects(bucket_id,name) values ('seller-draft-photos',$1)", [path])); blobs.set(path, bytes); return json({ Key: `seller-draft-photos/${path}`, Id: path });
        }
        if (request.method === "DELETE") { let raw = ""; for await (const chunk of request) raw += chunk; const paths = JSON.parse(raw).prefixes; const removed = await transact((tx) => tx.query("delete from storage.objects where bucket_id='seller-draft-photos' and name=any($1::text[]) returning name", [paths])); for (const row of removed.rows) blobs.delete(row.name); return json(removed.rows); }
        const visible = await transact((tx) => tx.query("select name from storage.objects where bucket_id='seller-draft-photos' and name=$1", [path])); if (!visible.rows.length || !blobs.has(path)) return json({ message: "Not found" }, 404);
        response.writeHead(200, { "Content-Type": "image/jpeg" }); response.end(blobs.get(path)); return true;
      }
      if (request.method !== "GET") return json({ code: "42501" }, 403);
      const allowed = columns.get(table); const selected = (url.searchParams.get("select") ?? "id").split(","); if (selected.some((c) => !allowed.has(c))) throw new Error("projection");
      const conditions = [], params = [];
      for (const [column, value] of url.searchParams) {
        if (["select", "order", "limit", "offset"].includes(column)) continue; if (!allowed.has(column)) throw new Error("filter");
        if (value === "not.is.null") { conditions.push(`"${column}" is not null`); continue; }
        if (value.startsWith("in.(")) { params.push(value.slice(4,-1).split(",")); conditions.push(`"${column}"=any($${params.length}::uuid[])`); continue; }
        if (!value.startsWith("eq.")) throw new Error("operator"); params.push(value.slice(3)); conditions.push(`"${column}"=$${params.length}`);
      }
      const order = (url.searchParams.get("order") ?? "id.asc").split(",").map((item) => { const [column, direction] = item.split("."); if (!allowed.has(column) || !["asc", "desc"].includes(direction)) throw new Error("order"); return `"${column}" ${direction}`; }).join(",");
      const limit = Number(url.searchParams.get("limit") ?? 100), offset = Number(url.searchParams.get("offset") ?? 0); if (!Number.isInteger(limit) || limit > 100 || limit < 1 || !Number.isInteger(offset) || offset < 0) throw new Error("range");
      const rows = (await transact((tx) => tx.query(`select ${selected.map((c) => `"${c}"`).join(",")} from public.${table} ${conditions.length ? `where ${conditions.join(" and ")}` : ""} order by ${order} limit ${limit} offset ${offset}`, params))).rows;
      return request.headers.accept?.includes("vnd.pgrst.object") ? json(rows[0] ?? null) : json(rows);
    } catch (error) { return json({ code: error.code ?? "TEST_ONLY", message: "Test-only seller operation denied" }, 400); }
  }
  return { handle, close: () => db.close() };
}
