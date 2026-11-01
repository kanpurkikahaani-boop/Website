/**
 * Local stand-in for Supabase (Auth + PostgREST + Storage) used by the end-to-end tests.
 *
 * Every database request runs in a real Postgres (with the project's real migrations) under the
 * caller's role — anon, authenticated (with JWT claims) or service_role — so ROW LEVEL SECURITY
 * decides what is allowed, exactly as on Supabase. Auth emulates GoTrue's wire format closely
 * enough for @supabase/supabase-js + @supabase/ssr: password sign-in, Google (PKCE), reset links,
 * refresh, sign-out and TOTP 2-step verification.
 *
 *   PGHOST=… PGPORT=… PGUSER=postgres PGDATABASE=kkk_e2e node tests/support/fake-supabase.mjs
 *
 * Test-only. Listens on 127.0.0.1. Never point a real deployment at it.
 */
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import http from "node:http";
import pg from "pg";

const PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 54400);
const ANON_KEY = process.env.FAKE_ANON_KEY ?? "anon-test";
const SERVICE_KEY = process.env.FAKE_SERVICE_KEY ?? "service-test";
const JWT_SECRET = "e2e-jwt-secret";
const BASE = `http://127.0.0.1:${PORT}`;

const pool = new pg.Pool({ max: 8 });

/* ───────────────────────── helpers ───────────────────────── */

const b64url = (b) => Buffer.from(b).toString("base64url");
function signJwt(payload) {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
function verifyJwt(token) {
  const [h, b, s] = String(token ?? "").split(".");
  if (!h || !b || !s) return null;
  const expected = createHmac("sha256", JWT_SECRET).update(`${h}.${b}`).digest("base64url");
  if (expected !== s) return null;
  const payload = JSON.parse(Buffer.from(b, "base64url").toString());
  if (payload.exp * 1000 < Date.now()) return null;
  return payload;
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf) {
  let bits = "";
  for (const byte of buf) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}
function unbase32(s) {
  let bits = "";
  for (const c of s.replace(/=+$/, "")) bits += B32.indexOf(c).toString(2).padStart(5, "0");
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
export function totp(secret, at = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30000)));
  const h = createHmac("sha1", unbase32(secret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String(((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000)).padStart(6, "0");
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}
function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  res.writeHead(status, { "Content-Type": isBuf ? headers["Content-Type"] ?? "application/octet-stream" : "application/json", ...headers });
  res.end(body === undefined ? "" : isBuf ? body : JSON.stringify(body));
}

/* ───────────────────────── auth state ───────────────────────── */

const users = new Map(); // id -> { id, email, password, confirmed, lastSignIn, factors: [] }
const sessions = new Map(); // session_id -> { userId, aal, amr, refresh }
const refreshTokens = new Map(); // refresh -> session_id
const codes = new Map(); // auth code -> { userId, challenge, method }
const challenges = new Map(); // challenge id -> factor id
const control = { googleEmail: "team@kanpurkikahaani.site", lastMail: null };

async function addUser(email, password, confirmed = true) {
  const id = randomUUID();
  users.set(id, { id, email, password, confirmed: confirmed ? new Date().toISOString() : null, lastSignIn: null, factors: [] });
  await pool.query("insert into auth.users (id, email, email_confirmed_at) values ($1, $2, $3)", [id, email, confirmed ? new Date() : null]);
  return id;
}
const byEmail = (email) => [...users.values()].find((u) => u.email.toLowerCase() === String(email ?? "").toLowerCase());

function userJson(u) {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    email_confirmed_at: u.confirmed,
    confirmed_at: u.confirmed,
    phone: "",
    last_sign_in_at: u.lastSignIn,
    app_metadata: { provider: "email", providers: ["email", "google"] },
    user_metadata: {},
    identities: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip the TOTP secret from API output
    ...(u.factors.length ? { factors: u.factors.map(({ secret, ...f }) => f) } : {}),
  };
}

function issueSession(u, { aal = "aal1", method = "password", sessionId, keepSignIn = false } = {}) {
  if (!keepSignIn) u.lastSignIn = new Date().toISOString();
  const sid = sessionId ?? randomUUID();
  const prev = sessions.get(sid);
  const amr = [...(prev?.amr ?? []), { method, timestamp: Math.floor(Date.now() / 1000) }];
  const refresh = b64url(randomBytes(24));
  sessions.set(sid, { userId: u.id, aal, amr, refresh });
  refreshTokens.set(refresh, sid);
  const now = Math.floor(Date.now() / 1000);
  const access_token = signJwt({ aud: "authenticated", exp: now + 3600, iat: now, sub: u.id, email: u.email, role: "authenticated", aal, amr, session_id: sid, is_anonymous: false });
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: refresh, user: userJson(u) };
}

function currentAuth(req) {
  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const p = verifyJwt(token);
  if (!p || !sessions.has(p.session_id)) return null;
  const u = users.get(p.sub);
  return u ? { user: u, payload: p, session: sessions.get(p.session_id) } : null;
}

const authError = (res, status, code, msg) => send(res, status, { code: status, error_code: code, msg });

async function handleAuth(req, res, url, path) {
  const body = req.method === "GET" || req.method === "DELETE" ? {} : JSON.parse((await readBody(req)).toString() || "{}");

  if (path === "/auth/v1/token") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      const u = byEmail(body.email);
      if (!u || u.password !== body.password) return authError(res, 400, "invalid_credentials", "Invalid login credentials");
      if (!u.confirmed) return authError(res, 400, "email_not_confirmed", "Email not confirmed");
      return send(res, 200, issueSession(u, { method: "password" }));
    }
    if (grant === "refresh_token") {
      const sid = refreshTokens.get(body.refresh_token);
      const s = sid && sessions.get(sid);
      if (!s) return authError(res, 400, "refresh_token_not_found", "Invalid Refresh Token");
      refreshTokens.delete(body.refresh_token);
      const u = users.get(s.userId);
      return send(res, 200, issueSession(u, { aal: s.aal, method: "token_refresh", sessionId: sid, keepSignIn: true }));
    }
    if (grant === "pkce") {
      const c = codes.get(body.auth_code);
      codes.delete(body.auth_code);
      if (!c) return authError(res, 400, "flow_state_not_found", "invalid flow state");
      const hashed = createHash("sha256").update(body.code_verifier ?? "").digest("base64url");
      const ok = c.method?.toLowerCase() === "s256" ? hashed === c.challenge : body.code_verifier === c.challenge;
      if (!ok) return authError(res, 400, "bad_code_verifier", "code challenge does not match previously saved code verifier");
      return send(res, 200, issueSession(users.get(c.userId), { method: c.kind }));
    }
    return authError(res, 400, "unsupported_grant_type", "unsupported grant");
  }

  if (path === "/auth/v1/authorize") {
    // "Google": sign in as whichever account the test selected.
    const u = byEmail(control.googleEmail);
    const to = new URL(url.searchParams.get("redirect_to"));
    const code = randomUUID();
    codes.set(code, { userId: u.id, challenge: url.searchParams.get("code_challenge"), method: url.searchParams.get("code_challenge_method"), kind: "oauth" });
    to.searchParams.set("code", code);
    res.writeHead(302, { Location: to.toString() });
    return res.end();
  }

  if (path === "/auth/v1/recover") {
    const u = byEmail(body.email);
    if (u) {
      const code = randomUUID();
      codes.set(code, { userId: u.id, challenge: body.code_challenge, method: body.code_challenge_method, kind: "recovery" });
      const to = new URL(url.searchParams.get("redirect_to"));
      to.searchParams.set("code", code);
      control.lastMail = { to: u.email, link: to.toString() };
    }
    return send(res, 200, {});
  }

  const auth = currentAuth(req);
  if (!auth) return authError(res, 401, "bad_jwt", "invalid JWT: unable to parse or verify signature");

  if (path === "/auth/v1/user" && req.method === "GET") return send(res, 200, userJson(auth.user));
  if (path === "/auth/v1/user" && req.method === "PUT") {
    if (body.password) auth.user.password = body.password;
    return send(res, 200, userJson(auth.user));
  }
  if (path === "/auth/v1/logout") {
    sessions.delete(auth.payload.session_id);
    res.writeHead(204);
    return res.end();
  }
  if (path === "/auth/v1/factors" && req.method === "POST") {
    const secret = base32(randomBytes(20));
    const id = randomUUID();
    const f = { id, friendly_name: body.friendly_name, factor_type: "totp", status: "unverified", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), secret };
    auth.user.factors.push(f);
    const uri = `otpauth://totp/KanpurKiKahaani:${auth.user.email}?secret=${secret}&issuer=KanpurKiKahaani`;
    const qr = `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#fff"/><text x="8" y="80" font-size="9">${secret}</text></svg>`;
    return send(res, 200, { id, type: "totp", friendly_name: body.friendly_name, totp: { qr_code: qr, secret, uri } });
  }
  const m = path.match(/^\/auth\/v1\/factors\/([^/]+)(\/challenge|\/verify)?$/);
  if (m) {
    const f = auth.user.factors.find((x) => x.id === m[1]);
    if (!f) return authError(res, 404, "mfa_factor_not_found", "Factor not found");
    if (m[2] === "/challenge") {
      const id = randomUUID();
      challenges.set(id, f.id);
      return send(res, 200, { id, type: "totp", expires_at: Math.floor(Date.now() / 1000) + 300 });
    }
    if (m[2] === "/verify") {
      if (challenges.get(body.challenge_id) !== f.id) return authError(res, 422, "mfa_challenge_expired", "Challenge not found");
      challenges.delete(body.challenge_id);
      const ok = [-30000, 0, 30000].some((d) => totp(f.secret, Date.now() + d) === body.code);
      if (!ok) return authError(res, 422, "mfa_verification_failed", "Invalid TOTP code entered");
      f.status = "verified";
      return send(res, 200, issueSession(auth.user, { aal: "aal2", method: "totp", sessionId: auth.payload.session_id, keepSignIn: true }));
    }
    if (req.method === "DELETE") {
      if (f.status === "verified" && auth.payload.aal !== "aal2") return authError(res, 422, "insufficient_aal", "AAL2 required to unenroll verified factor");
      auth.user.factors = auth.user.factors.filter((x) => x !== f);
      return send(res, 200, { id: f.id });
    }
  }
  return authError(res, 404, "not_found", `No auth route ${req.method} ${path}`);
}

/* ───────────────────────── PostgREST ───────────────────────── */

const IDENT = /^[a-z_][a-z0-9_]*$/;
const q = (id) => {
  if (!IDENT.test(id)) throw Object.assign(new Error(`bad identifier ${id}`), { status: 400 });
  return `"${id}"`;
};
const RELATIONS = {
  posts: { authors: { table: "authors", fk: "author_id", to: "id" } },
  post_redirects: { posts: { table: "posts", fk: "post_id", to: "id" } },
};

function splitTop(s, sep = ",") {
  const out = [];
  let depth = 0;
  let cur = "";
  let quoted = false;
  for (const ch of s) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && ch === "(") depth++;
    if (!quoted && ch === ")") depth--;
    if (!quoted && depth === 0 && ch === sep) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function projection(table, select, alias = "t") {
  const parts = splitTop(select || "*");
  return parts
    .map((p) => {
      const embed = p.match(/^(?:([a-z_]+):)?([a-z_]+)(?:![a-z_]+)?\((.*)\)$/s);
      if (embed) {
        const [, as, name, inner] = embed;
        const rel = RELATIONS[table]?.[name];
        if (!rel) throw Object.assign(new Error(`no relation ${table}->${name}`), { status: 400 });
        const cols = splitTop(inner).map((c) => (c === "*" ? "_e.*" : `_e.${q(c)}`)).join(", ");
        return `(select to_jsonb(_x) from (select ${cols} from public.${q(rel.table)} _e where _e.${q(rel.to)} = ${alias}.${q(rel.fk)}) _x) as ${q(as ?? name)}`;
      }
      if (p === "*") return `${alias}.*`;
      const [as, col] = p.includes(":") ? p.split(":") : [p, p];
      return `${alias}.${q(col.trim())} as ${q(as.trim())}`;
    })
    .join(", ");
}

const unquote = (v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);

function condition(col, expr, params, alias) {
  let neg = false;
  let rest = expr;
  if (rest.startsWith("not.")) {
    neg = true;
    rest = rest.slice(4);
  }
  const dot = rest.indexOf(".");
  const op = rest.slice(0, dot);
  const val = rest.slice(dot + 1);
  const c = `${alias}.${q(col)}`;
  const p = (v) => {
    params.push(v);
    return `$${params.length}`;
  };
  let sql;
  switch (op) {
    case "eq": sql = `${c} = ${p(unquote(val))}`; break;
    case "neq": sql = `${c} <> ${p(unquote(val))}`; break;
    case "gt": sql = `${c} > ${p(unquote(val))}`; break;
    case "gte": sql = `${c} >= ${p(unquote(val))}`; break;
    case "lt": sql = `${c} < ${p(unquote(val))}`; break;
    case "lte": sql = `${c} <= ${p(unquote(val))}`; break;
    case "like": sql = `${c}::text like ${p(unquote(val).replace(/\*/g, "%"))}`; break;
    case "ilike": sql = `${c}::text ilike ${p(unquote(val).replace(/\*/g, "%"))}`; break;
    case "is": sql = `${c} is ${({ null: "null", true: "true", false: "false" })[val] ?? "null"}`; break;
    case "in": sql = `${c}::text = any(${p(splitTop(val.replace(/^\(|\)$/g, "")).map(unquote))}::text[])`; break;
    case "cs": sql = `${c} @> ${p(val)}`; break;
    case "ov": sql = `${c} && ${p(val)}`; break;
    default: throw Object.assign(new Error(`unsupported operator ${op}`), { status: 400 });
  }
  return neg ? `not (${sql})` : sql;
}

function logicTree(list, params, alias, joiner) {
  return `(${splitTop(list)
    .map((item) => {
      const nested = item.match(/^(not\.)?(and|or)\((.*)\)$/s);
      if (nested) {
        const inner = logicTree(nested[3], params, alias, nested[2] === "and" ? " and " : " or ");
        return nested[1] ? `not ${inner}` : inner;
      }
      const dot = item.indexOf(".");
      return condition(item.slice(0, dot), item.slice(dot + 1), params, alias);
    })
    .join(joiner)})`;
}

const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
function whereClause(url, params, alias) {
  const conds = [];
  for (const [k, v] of url.searchParams) {
    if (RESERVED.has(k)) continue;
    if (k === "or" || k === "and") conds.push(logicTree(v.replace(/^\(|\)$/g, ""), params, alias, k === "or" ? " or " : " and "));
    else conds.push(condition(k, v, params, alias));
  }
  return conds.length ? `where ${conds.join(" and ")}` : "";
}

function orderClause(url, alias) {
  const o = url.searchParams.get("order");
  if (!o) return "";
  return `order by ${splitTop(o)
    .map((item) => {
      const [col, ...mods] = item.split(".");
      const dir = mods.includes("desc") ? "desc" : "asc";
      const nulls = mods.includes("nullsfirst") ? " nulls first" : mods.includes("nullslast") ? " nulls last" : "";
      return `${alias}.${q(col)} ${dir}${nulls}`;
    })
    .join(", ")}`;
}

const pkCache = new Map();
async function primaryKey(client, table) {
  if (pkCache.has(table)) return pkCache.get(table);
  const { rows } = await client.query(
    `select a.attname from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey) where i.indrelid = $1::regclass and i.indisprimary`,
    [`public.${table}`],
  );
  const pk = rows.map((r) => r.attname);
  pkCache.set(table, pk);
  return pk;
}

function roleFor(req) {
  const bearer = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const apikey = req.headers.apikey;
  if (bearer === SERVICE_KEY || (!bearer && apikey === SERVICE_KEY)) return { role: "service_role", claims: { role: "service_role" } };
  if (!bearer || bearer === ANON_KEY) return { role: "anon", claims: { role: "anon" } };
  const p = verifyJwt(bearer);
  if (!p || !sessions.has(p.session_id)) return null;
  return { role: "authenticated", claims: p };
}

async function asRole(who, fn) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${who.role}`);
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(who.claims)]);
    const out = await fn(client);
    await client.query("commit");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

function pgError(res, e, who) {
  const status = e.status ?? (e.code === "42501" ? (who.role === "anon" ? 401 : 403) : e.code === "23505" ? 409 : e.code === "PGRST116" ? 406 : 400);
  return send(res, status, { code: e.code ?? "PGRST100", message: e.message, details: e.detail ?? null, hint: e.hint ?? null });
}

async function handleRest(req, res, url, table) {
  const who = roleFor(req);
  if (!who) return send(res, 401, { code: "PGRST301", message: "JWT invalid", details: null, hint: null });
  const prefer = req.headers.prefer ?? "";
  const wantsObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");
  const select = url.searchParams.get("select") ?? "*";
  const method = req.method;
  try {
    const result = await asRole(who, async (client) => {
      const params = [];
      if (method === "GET" || method === "HEAD") {
        const where = whereClause(url, params, "t");
        const limit = url.searchParams.get("limit");
        const offset = url.searchParams.get("offset");
        const sql = `select ${projection(table, select)} from public.${q(table)} t ${where} ${orderClause(url, "t")} ${limit ? `limit ${Number(limit)}` : ""} ${offset ? `offset ${Number(offset)}` : ""}`;
        const { rows } = await client.query(sql, params);
        let total = null;
        if (/count=exact/.test(prefer)) {
          const cp = [];
          const cw = whereClause(url, cp, "t");
          total = Number((await client.query(`select count(*) from public.${q(table)} t ${cw}`, cp)).rows[0].count);
        }
        return { rows, total, offset: Number(offset ?? 0) };
      }
      const raw = (await readBody(req)).toString();
      const body = raw ? JSON.parse(raw) : {};
      const ret = `select ${projection(table, select)} from _r t`;
      if (method === "POST") {
        const rows = Array.isArray(body) ? body : [body];
        const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
        const colList = cols.map(q).join(", ");
        let conflict = "";
        if (/resolution=merge-duplicates|resolution=ignore-duplicates/.test(prefer)) {
          const target = url.searchParams.get("on_conflict")?.split(",") ?? (await primaryKey(client, table));
          const updates = cols.filter((c) => !target.includes(c)).map((c) => `${q(c)} = excluded.${q(c)}`);
          conflict = /ignore-duplicates/.test(prefer) || !updates.length ? `on conflict (${target.map(q).join(", ")}) do nothing` : `on conflict (${target.map(q).join(", ")}) do update set ${updates.join(", ")}`;
        }
        params.push(JSON.stringify(rows));
        const { rows: out } = await client.query(
          `with _r as (insert into public.${q(table)} (${colList}) select ${colList} from json_populate_recordset(null::public.${q(table)}, $1::json) ${conflict} returning *) ${ret}`,
          params,
        );
        return { rows: out, status: 201 };
      }
      if (method === "PATCH") {
        const cols = Object.keys(body);
        params.push(JSON.stringify(body));
        const sets = cols.map((c) => `${q(c)} = (select ${q(c)} from json_populate_record(null::public.${q(table)}, $1::json))`).join(", ");
        const where = whereClause(url, params, "_u");
        const { rows: out } = await client.query(`with _r as (update public.${q(table)} _u set ${sets} ${where} returning _u.*) ${ret}`, params);
        return { rows: out, status: 200 };
      }
      if (method === "DELETE") {
        const where = whereClause(url, params, "_u");
        const { rows: out } = await client.query(`with _r as (delete from public.${q(table)} _u ${where} returning _u.*) ${ret}`, params);
        return { rows: out, status: 200 };
      }
      throw Object.assign(new Error("method not allowed"), { status: 405 });
    });

    const rows = result.rows;
    const headers = {};
    if (result.total !== null && result.total !== undefined) {
      headers["Content-Range"] = rows.length ? `${result.offset}-${result.offset + rows.length - 1}/${result.total}` : `*/${result.total}`;
    } else headers["Content-Range"] = rows.length ? `0-${rows.length - 1}/*` : "*/*";
    if (method === "HEAD") return send(res, 200, undefined, headers);
    if (method !== "GET" && !/return=representation/.test(prefer)) {
      res.writeHead(method === "POST" ? 201 : 204, headers);
      return res.end();
    }
    if (wantsObject) {
      if (rows.length !== 1) return send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows`, hint: null });
      return send(res, result.status ?? 200, rows[0], headers);
    }
    return send(res, result.status ?? 200, rows, headers);
  } catch (e) {
    return pgError(res, e, who);
  }
}

/* ───────────────────────── Storage ───────────────────────── */

const files = new Map(); // "bucket/path" -> { type, data }

async function handleStorage(req, res, url, path) {
  const pub = path.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (pub && req.method === "GET") {
    const f = files.get(`${pub[1]}/${decodeURIComponent(pub[2])}`);
    return f ? send(res, 200, f.data, { "Content-Type": f.type }) : send(res, 404, { message: "Object not found" });
  }
  const up = path.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
  if (!up || (req.method !== "POST" && req.method !== "PUT")) return send(res, 404, { message: "not found" });
  const who = roleFor(req);
  if (!who) return send(res, 401, { statusCode: "401", error: "Unauthorized", message: "Invalid JWT" });
  const [, bucket, rawName] = up;
  const name = decodeURIComponent(rawName);
  const buf = await readBody(req);
  let type = req.headers["content-type"] ?? "application/octet-stream";
  let data = buf;
  if (type.startsWith("multipart/form-data")) {
    const form = await new Request("http://x", { method: "POST", headers: { "content-type": type }, body: buf }).formData();
    const file = [...form.values()].find((v) => typeof v === "object");
    type = file.type;
    data = Buffer.from(await file.arrayBuffer());
  }
  const { rows } = await pool.query("select file_size_limit, allowed_mime_types from storage.buckets where id = $1", [bucket]);
  if (!rows.length) return send(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
  if (rows[0].allowed_mime_types && !rows[0].allowed_mime_types.includes(type)) return send(res, 415, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${type} is not supported` });
  if (rows[0].file_size_limit && data.length > Number(rows[0].file_size_limit)) return send(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
  try {
    await asRole(who, (c) => c.query("insert into storage.objects (bucket_id, name) values ($1, $2)", [bucket, name]));
  } catch (e) {
    return send(res, 403, { statusCode: "403", error: "Unauthorized", message: `new row violates row-level security policy (${e.message})` });
  }
  files.set(`${bucket}/${name}`, { type, data });
  return send(res, 200, { Key: `${bucket}/${name}`, Id: randomUUID() });
}

/* ───────────────────────── server ───────────────────────── */

const log = [];
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, BASE);
  const path = url.pathname;
  log.push(`${req.method} ${path}${url.search}`);
  if (log.length > 500) log.shift();
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    if (path === "/__control/google") {
      control.googleEmail = url.searchParams.get("email");
      return send(res, 200, { ok: true });
    }
    if (path === "/__control/mail") return send(res, 200, control.lastMail ?? {});
    if (path === "/__control/totp") {
      const u = byEmail(url.searchParams.get("email"));
      const f = u?.factors.find((x) => x.status === "verified") ?? u?.factors.at(-1);
      return send(res, 200, f ? { code: totp(f.secret) } : {});
    }
    if (path === "/__control/age-session") {
      // Pretend the user signed in N days ago (tests the 7-day limit).
      const u = byEmail(url.searchParams.get("email"));
      u.lastSignIn = new Date(Date.now() - Number(url.searchParams.get("days")) * 86400000).toISOString();
      return send(res, 200, { ok: true });
    }
    if (path === "/__control/reset-factors") {
      for (const u of users.values()) u.factors = [];
      return send(res, 200, { ok: true });
    }
    if (path === "/__log") return send(res, 200, log);
    if (path.startsWith("/auth/v1/")) return await handleAuth(req, res, url, path);
    if (path.startsWith("/rest/v1/")) return await handleRest(req, res, url, path.slice("/rest/v1/".length));
    if (path.startsWith("/storage/v1/")) return await handleStorage(req, res, url, path);
    return send(res, 404, { message: "not found" });
  } catch (e) {
    console.error(e);
    return send(res, 500, { message: String(e?.message ?? e) });
  }
});

await pool.query("delete from auth.users");
await addUser("team@kanpurkikahaani.site", "Correct-Horse-Battery-9");
await addUser("someone@gmail.com", "Visitor-Pass-12345");
server.listen(PORT, "127.0.0.1", () => console.log(`fake supabase on ${BASE}`));
