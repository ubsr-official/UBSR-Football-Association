import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const previewUrl = process.argv[2];
const outputDir = "/home/ubuntu/ufa-auth-route-evidence";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!previewUrl || !url || !publishableKey || !serviceKey) throw new Error("Provide a preview URL and configured Supabase credentials.");

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Ufa-${stamp}-Evidence!`;
const managerEmail = `ufa-manager-evidence-${stamp}@example.test`;
const administratorEmail = `ufa-admin-evidence-${stamp}@example.test`;
let managerUserId; let administratorUserId; let managerMemberId; let originalMemberUserId; let originalArishUserId;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sessionCookies(email) {
  const client = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message || "Disposable sign-in failed.");
  const jar = new Map();
  const server = createServerClient(url, publishableKey, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: values => values.forEach(({ name, value }) => jar.set(name, value)) } });
  await server.auth.setSession(data.session);
  return [...jar].map(([name, value]) => ({ name, value }));
}

async function launchBrowser(port, profile) {
  const process = spawn("/usr/bin/chromium", ["--headless=new", "--no-sandbox", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { const response = await fetch(`http://127.0.0.1:${port}/json/version`); if (response.ok) return process; } catch { /* wait for Chromium */ }
    await wait(150);
  }
  process.kill("SIGKILL");
  throw new Error("Chromium debugging endpoint did not start.");
}

async function cdp(port) {
  const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  const target = await targetResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map();
  socket.onmessage = event => { const message = JSON.parse(event.data); const callback = pending.get(message.id); if (callback) { pending.delete(message.id); message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result); } };
  return { socket, call(method, params = {}) { const requestId = ++id; socket.send(JSON.stringify({ id: requestId, method, params })); return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject })); } };
}

async function captureSession({ role, email, port, paths }) {
  const browser = await launchBrowser(port, `/tmp/ufa-${role}-chromium-profile`);
  try {
    const connection = await cdp(port);
    try {
      await connection.call("Network.enable"); await connection.call("Page.enable");
      const cookies = await sessionCookies(email);
      for (const cookie of cookies) await connection.call("Network.setCookie", { name: cookie.name, value: cookie.value, url: previewUrl, secure: true, httpOnly: false, sameSite: "Lax" });
      for (const { path, label, expected, viewport } of paths) {
        await connection.call("Emulation.setDeviceMetricsOverride", { width: viewport[0], height: viewport[1], deviceScaleFactor: 1, mobile: viewport[0] < 600 });
        await connection.call("Page.navigate", { url: `${previewUrl}${path}` });
        let renderedText = "";
        for (let attempt = 0; attempt < 24; attempt += 1) {
          await wait(250);
          const text = await connection.call("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true });
          renderedText = String(text.result.value);
          if (renderedText.includes(expected)) break;
        }
        if (!renderedText.includes(expected)) throw new Error(`${role} route ${path} did not render the expected state: ${renderedText.slice(0, 420)}`);
        const image = await connection.call("Page.captureScreenshot", { format: "png" });
        await writeFile(`${outputDir}/${role}-${label}.png`, Buffer.from(image.data, "base64"));
      }
      if (role === "manager") {
        await connection.call("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
        await connection.call("Network.emulateNetworkConditions", { offline: false, latency: 1800, downloadThroughput: 80_000, uploadThroughput: 80_000, connectionType: "cellular3g" });
        const loadingPaths = ["/dashboard", "/fixtures", "/market", "/team-room", "/league", "/rosters", "/standings", "/admin"];
        for (const path of loadingPaths) {
          const label = path === "/" ? "dashboard" : path.slice(1);
          await connection.call("Page.navigate", { url: `${previewUrl}${path}?loading-evidence=${stamp}` }); await wait(240);
          const loading = await connection.call("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true });
          if (!String(loading.result.value).includes("Preparing league workspace")) throw new Error(`Protected loading state did not render for ${path}.`);
          const loadingImage = await connection.call("Page.captureScreenshot", { format: "png" });
          await writeFile(`${outputDir}/manager-desktop-loading-${label}.png`, Buffer.from(loadingImage.data, "base64"));
        }
        await connection.call("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1, connectionType: "none" });
      }
    } finally { connection.socket.close(); }
  } finally { browser.kill("SIGKILL"); }
}

try {
  await mkdir(outputDir, { recursive: true });
  const { data: team, error: teamError } = await admin.from("teams").select("manager_member_id").eq("is_active", true).limit(1).single();
  if (teamError || !team?.manager_member_id) throw new Error(teamError?.message || "No active manager team is available.");
  managerMemberId = team.manager_member_id;
  const { data: member, error: memberError } = await admin.from("league_members").select("auth_user_id").eq("id", managerMemberId).single();
  if (memberError) throw new Error(memberError.message);
  originalMemberUserId = member.auth_user_id;
  const { data: arish, error: arishError } = await admin.from("admin_seats").select("user_id").eq("seat", "arish").single();
  if (arishError) throw new Error(arishError.message);
  originalArishUserId = arish.user_id;
  const { data: managerUser, error: managerError } = await admin.auth.admin.createUser({ email: managerEmail, password, email_confirm: true });
  if (managerError || !managerUser.user) throw new Error(managerError?.message || "Could not create manager test session.");
  managerUserId = managerUser.user.id;
  const { data: administratorUser, error: administratorError } = await admin.auth.admin.createUser({ email: administratorEmail, password, email_confirm: true });
  if (administratorError || !administratorUser.user) throw new Error(administratorError?.message || "Could not create administrator test session.");
  administratorUserId = administratorUser.user.id;
  const { error: memberLinkError } = await admin.from("league_members").update({ auth_user_id: managerUserId }).eq("id", managerMemberId);
  if (memberLinkError) throw new Error(memberLinkError.message);
  const { error: seatLinkError } = await admin.from("admin_seats").update({ user_id: administratorUserId }).eq("seat", "arish");
  if (seatLinkError) throw new Error(seatLinkError.message);
  await captureSession({ role: "manager", email: managerEmail, port: 9231, paths: [
    { path: "/dashboard", label: "desktop-dashboard", expected: "Welcome to UFA League", viewport: [1280, 720] },
    { path: "/fixtures", label: "desktop-fixtures", expected: "Fixtures, agreed by day", viewport: [1280, 720] },
    { path: "/market", label: "desktop-market", expected: "Public trade desk", viewport: [1280, 720] },
    { path: "/team-room", label: "desktop-team-room", expected: "TEAM IDENTITY", viewport: [1280, 720] },
    { path: "/league", label: "desktop-league", expected: "League directory", viewport: [1280, 720] },
    { path: "/rosters", label: "desktop-rosters", expected: "Rosters and remaining balance", viewport: [1280, 720] },
    { path: "/standings", label: "desktop-standings", expected: "Live points table", viewport: [1280, 720] },
    { path: "/admin", label: "desktop-admin-denied", expected: "Administrator access required", viewport: [1280, 720] },
    { path: "/dashboard", label: "mobile-dashboard", expected: "Welcome to UFA League", viewport: [375, 812] },
    { path: "/fixtures", label: "mobile-fixtures", expected: "Fixtures, agreed by day", viewport: [375, 812] },
    { path: "/market", label: "mobile-market", expected: "Public trade desk", viewport: [375, 812] },
    { path: "/team-room", label: "mobile-team-room", expected: "TEAM IDENTITY", viewport: [375, 812] },
    { path: "/league", label: "mobile-league", expected: "League directory", viewport: [375, 812] },
    { path: "/rosters", label: "mobile-rosters", expected: "Rosters and remaining balance", viewport: [375, 812] },
    { path: "/standings", label: "mobile-standings", expected: "Live points table", viewport: [375, 812] },
  ] });
  await captureSession({ role: "administrator", email: administratorEmail, port: 9232, paths: [
    { path: "/admin", label: "desktop-admin", expected: "Commissioner workspace", viewport: [1280, 720] },
    { path: "/admin", label: "mobile-admin", expected: "Commissioner workspace", viewport: [375, 812] },
  ] });
  console.log(JSON.stringify({ evidenceDirectory: outputDir, managerRoutes: 15, administratorRoutes: 2, protectedLoadingRoutes: 8 }));
} finally {
  if (managerMemberId) await admin.from("league_members").update({ auth_user_id: originalMemberUserId ?? null }).eq("id", managerMemberId);
  if (originalArishUserId !== undefined) await admin.from("admin_seats").update({ user_id: originalArishUserId ?? null }).eq("seat", "arish");
  if (managerUserId) await admin.auth.admin.deleteUser(managerUserId);
  if (administratorUserId) await admin.auth.admin.deleteUser(administratorUserId);
  await rm("/tmp/ufa-manager-chromium-profile", { recursive: true, force: true });
  await rm("/tmp/ufa-administrator-chromium-profile", { recursive: true, force: true });
}
