import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Introspect the actual migrated PostgreSQL catalog, without credentials or Docker.
export async function generateDatabaseTypes() {
  const db = new PGlite();
  try {
    await db.exec(await readFile(new URL("../tests/fixtures/auth-schema.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../tests/fixtures/storage-schema.sql", import.meta.url), "utf8"));
    const migrationDir = new URL("../supabase/migrations/", import.meta.url);
    for (const name of (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort()) {
      await db.exec(await readFile(new URL(name, migrationDir), "utf8"));
    }
    const { rows: columns } = await db.query(`
      select table_name, column_name, data_type, is_nullable, column_default, is_generated
      from information_schema.columns where table_schema = 'public'
      order by table_name, ordinal_position
    `);
    const { rows: relationships } = await db.query(`
      select c.conname as name, t.relname as table_name, a.attname as column_name,
        rt.relname as referenced_relation, ra.attname as referenced_column,
        exists(select 1 from pg_constraint u where u.conrelid = c.conrelid
          and u.contype in ('p', 'u') and u.conkey = c.conkey) as is_one_to_one
      from pg_constraint c join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      join pg_class rt on rt.oid = c.confrelid
      join pg_attribute a on a.attrelid = t.oid and a.attnum = c.conkey[1]
      join pg_attribute ra on ra.attrelid = rt.oid and ra.attnum = c.confkey[1]
      where c.contype = 'f' and n.nspname = 'public' order by t.relname, c.conname
    `);
    const typeFor = (column) => {
      const types = { uuid: "string", text: "string", jsonb: "Json", "timestamp with time zone": "string", smallint: "number", integer: "number", bigint: "number", boolean: "boolean" };
      if (!types[column.data_type]) throw new Error(`Unsupported database type: ${column.data_type}`);
      return types[column.data_type] + (column.is_nullable === "YES" ? " | null" : "");
    };
    let output = "// Generated from SQL migrations by npm run db:types. Do not edit manually.\n";
    output += "export type Database = {\n  public: {\n    Tables: {\n";
    for (const table of [...new Set(columns.map((column) => column.table_name))]) {
      const fields = columns.filter((column) => column.table_name === table);
      output += `      ${table}: {\n`;
      for (const mode of ["Row", "Insert", "Update"]) {
        output += `        ${mode}: {\n`;
        for (const column of fields) {
          const generated = column.is_generated === "ALWAYS" && mode !== "Row";
          const optional = generated || mode === "Update" || (mode === "Insert" && (column.column_default !== null || column.is_nullable === "YES"));
          output += `          ${column.column_name}${optional ? "?" : ""}: ${generated ? "never" : typeFor(column)};\n`;
        }
        output += "        };\n";
      }
      const relations = relationships.filter((relation) => relation.table_name === table);
      output += "        Relationships: [\n";
      for (const relation of relations) {
        output += `          { foreignKeyName: "${relation.name}"; columns: ["${relation.column_name}"]; isOneToOne: ${relation.is_one_to_one}; referencedRelation: "${relation.referenced_relation}"; referencedColumns: ["${relation.referenced_column}"] },\n`;
      }
      output += "        ];\n      };\n";
    }
    const { rows: functions } = await db.query("select p.proname as name, pg_catalog.format_type(p.prorettype, null) as return_type, p.pronargs as args, p.proargnames as arg_names, p.proargtypes::text as arg_types from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prorettype <> 'trigger'::regtype order by p.proname");
    output += "    };\n    Views: { [_ in never]: never };\n    Functions: {\n";
    for (const fn of functions) {
      if (fn.return_type !== "jsonb" || (fn.args !== 0 && !(fn.args === 1 && fn.arg_types === "3802" && fn.arg_names[0] === "p_input"))) throw new Error("Extend type generation for the new RPC signature.");
      output += `      ${fn.name}: { Args: ${fn.args === 0 ? "Record<string, never>" : "{ p_input: Json }"}; Returns: Json };\n`;
    }
    output += "    };\n    Enums: { [_ in never]: never };\n    CompositeTypes: { [_ in never]: never };\n  };\n};\n";
    output += "\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n";
    return output;
  } finally { await db.close(); }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const outputPath = new URL("../src/types/database.ts", import.meta.url);
  const generated = await generateDatabaseTypes();
  if (process.argv.includes("--check")) {
    if (await readFile(outputPath, "utf8") !== generated) throw new Error("Database types are stale. Run npm run db:types.");
    process.stdout.write("Database types match migrated PostgreSQL catalog.\n");
  } else {
    await writeFile(outputPath, generated);
    process.stdout.write("Generated src/types/database.ts from migrated PostgreSQL catalog.\n");
  }
}
