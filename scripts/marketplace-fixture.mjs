// Test-only loopback adapter. Real SQL/RLS, simulated PostgREST/Storage transport.
// Never imported by src/ or connected to a real Supabase project.
import { PGlite } from "@electric-sql/pglite";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";

export async function startMarketplaceFixture() {
  const db = new PGlite();
  for (const name of ["auth-schema.sql", "storage-schema.sql"]) await db.exec(await readFile(new URL(`../tests/fixtures/${name}`, import.meta.url), "utf8"));
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(name, migrations), "utf8"));
  await db.exec(await readFile(new URL("../tests/fixtures/marketplace.sql", import.meta.url), "utf8"));
  const { rows } = await db.query("select table_name,column_name from information_schema.columns where table_schema='public'");
  const columns = new Map();
  rows.forEach(({ table_name, column_name }) => {
    if (!columns.has(table_name)) columns.set(table_name, new Set());
    columns.get(table_name).add(column_name);
  });
  const image = await readFile(new URL("../tests/fixtures/vehicle-photo.png", import.meta.url));
  const server = createServer(async (request, response) => {
    const json = (value, status = 200, headers = {}) => {
      response.writeHead(status, { "Content-Type": "application/json", ...headers });
      response.end(JSON.stringify(value, (_key, value) => typeof value === "bigint" ? Number(value) : value));
    };
    try {
      if (request.headers.apikey !== "sb_publishable_autobid_fixture_only") return json({ message: "Test adapter key required" }, 401);
      const url = new URL(request.url, "http://127.0.0.1");
      if (url.pathname === "/rest/v1/rpc/marketplace_facets") {
        const result = await db.transaction(async (tx) => { await tx.exec("set local role anon"); return tx.query("select public.marketplace_facets() as data"); });
        return json(result.rows[0].data);
      }
      const photo = url.pathname.match(/^\/storage\/v1\/object\/(?:authenticated\/)?vehicle-photos\/(.+)$/);
      if (photo) {
        const result = await db.transaction(async (tx) => { await tx.exec("set local role anon"); return tx.query("select id from storage.objects where bucket_id='vehicle-photos' and name=$1", [decodeURIComponent(photo[1])]); });
        if (!result.rows.length) return json({ message: "Not found" }, 404);
        response.writeHead(200, { "Content-Type": "image/png" }); response.end(image); return;
      }
      const table = url.pathname.match(/^\/rest\/v1\/(vehicle_listings|vehicle_media)$/)?.[1];
      if (!table) return json({ message: "Test adapter route unavailable" }, 404);
      const allowed = columns.get(table);
      const selected = (url.searchParams.get("select") ?? "id").split(",");
      if (selected.some((column) => !allowed.has(column))) return json({ message: "Unsupported test projection" }, 400);
      const params = [], conditions = [];
      for (const [column, value] of url.searchParams) {
        if (["select", "order", "offset", "limit"].includes(column)) continue;
        if (!allowed.has(column)) return json({ message: "Unsupported test filter" }, 400);
        if (value === "not.is.null") { conditions.push(`"${column}" is not null`); continue; }
        if (value.startsWith("in.(") && value.endsWith(")")) {
          params.push(value.slice(4, -1).split(",")); conditions.push(`"${column}" = any($${params.length}::uuid[])`); continue;
        }
        const match = value.match(/^(eq|gte|lte|ilike)\.(.*)$/s);
        if (!match) return json({ message: "Unsupported test operator" }, 400);
        params.push(match[2]); conditions.push(`"${column}" ${{ eq: "=", gte: ">=", lte: "<=", ilike: "ilike" }[match[1]]} $${params.length}`);
      }
      const order = (url.searchParams.get("order") ?? "id.asc").split(",").map((value) => {
        const [column, direction = "asc"] = value.split(".");
        if (!allowed.has(column) || !["asc", "desc"].includes(direction)) throw new Error("Unsupported test order");
        return `"${column}" ${direction}`;
      }).join(",");
      const offset = Number(url.searchParams.get("offset") ?? 0), limit = Number(url.searchParams.get("limit") ?? 200);
      if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 200) return json({ message: "Unsupported test range" }, 400);
      const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
      const result = await db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        const count = await tx.query(`select count(*)::int as count from public.${table} ${where}`, params);
        const data = await tx.query(`select ${selected.map((column) => `"${column}"`).join(",")} from public.${table} ${where} order by ${order} offset ${offset} limit ${limit}`, params);
        return { data: data.rows, count: count.rows[0].count };
      });
      json(result.data, 200, { "Content-Range": `${offset}-${offset + Math.max(0, result.data.length - 1)}/${result.count}` });
    } catch { json({ message: "Test adapter query failed" }, 500); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    async close() { await new Promise((resolve) => server.close(resolve)); await db.close(); },
  };
}
