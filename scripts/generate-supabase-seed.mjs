import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("./seed-league.mjs", import.meta.url), "utf8");

function parseArray(name, pattern = `const ${name} = `) {
  const start = source.indexOf(pattern);
  if (start < 0) throw new Error(`Could not find ${name}.`);
  const openingBracket = source.indexOf("[", start);
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = openingBracket; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (!escaped && character === "\\") escaped = true;
      else if (!escaped && character === '"') quoted = false;
      else escaped = false;
      continue;
    }
    if (character === '"') quoted = true;
    if (character === "[") depth += 1;
    if (character === "]") depth -= 1;
    if (depth === 0) return JSON.parse(source.slice(openingBracket, index + 1).replace(/,\s*]/g, "]"));
  }
  throw new Error(`Could not parse ${name}.`);
}

const members = parseArray("members");
const managers = parseArray("managers");
const sold = parseArray("sold");
const unsoldCodes = new Set(parseArray("unsoldCodes", "const unsoldCodes = new Set("));
const notCalledCodes = new Set(parseArray("notCalledCodes", "const notCalledCodes = new Set("));

const quote = value => value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const values = rows => rows.map(row => `  (${row.map(quote).join(", ")})`).join(",\n");
const soldByPlayer = new Map(sold.map(([playerCode, managerCode, price]) => [playerCode, { managerCode, price }]));
const playerAuctionRows = members
  .filter(([, , , leagueRole]) => leagueRole === "player")
  .map(([memberCode]) => {
    const sale = soldByPlayer.get(memberCode);
    if (sale) return [memberCode, "sold", sale.managerCode, sale.price];
    if (unsoldCodes.has(memberCode)) return [memberCode, "unsold", null, null];
    if (notCalledCodes.has(memberCode)) return [memberCode, "not_called", null, null];
    return [memberCode, "unassigned", null, null];
  });

const sql = `-- Generated only from the supplied UBSR member list and auction summary.\n\nwith member_data(member_code, full_name, section, league_role, positions, rating, base_price) as (\nvalues\n${values(members)}\n)\ninsert into public.league_members(member_code, full_name, section, league_role, positions, rating, base_price)\nselect member_code, full_name, section, league_role::public.league_role, positions, rating, base_price::integer from member_data\non conflict (member_code) do update set\n  full_name = excluded.full_name, section = excluded.section, league_role = excluded.league_role,\n  positions = excluded.positions, rating = excluded.rating, base_price = excluded.base_price, updated_at = now();\n\nwith team_data(manager_code, team_name, current_balance) as (\nvalues\n${values(managers)}\n)\ninsert into public.teams(manager_member_id, name, current_balance)\nselect member.id, team_data.team_name, team_data.current_balance::integer\nfrom team_data join public.league_members member on member.member_code = team_data.manager_code\non conflict (manager_member_id) do update set name = excluded.name, current_balance = excluded.current_balance, updated_at = now();\n\nwith auction_data(player_code, auction_status, buyer_manager_code, final_bought_price) as (\nvalues\n${values(playerAuctionRows)}\n)\ninsert into public.auction_records(player_member_id, base_price, final_bought_price, status, buyer_team_id, resolved_at)\nselect player.id, player.base_price, auction_data.final_bought_price::integer, auction_data.auction_status::public.auction_status, buyer_team.id,\n  case when auction_data.auction_status = 'sold' then now() else null end\nfrom auction_data\njoin public.league_members player on player.member_code = auction_data.player_code\nleft join public.league_members buyer_member on buyer_member.member_code = auction_data.buyer_manager_code\nleft join public.teams buyer_team on buyer_team.manager_member_id = buyer_member.id\non conflict (player_member_id) do update set\n  base_price = excluded.base_price, final_bought_price = excluded.final_bought_price, status = excluded.status,\n  buyer_team_id = excluded.buyer_team_id, resolved_at = excluded.resolved_at, updated_at = now();\n\nwith sold_data(player_code, buyer_manager_code, acquired_price) as (\nvalues\n${values(sold)}\n)\ninsert into public.roster_entries(team_id, player_member_id, acquired_price, source)\nselect team.id, player.id, sold_data.acquired_price::integer, 'auction'\nfrom sold_data\njoin public.league_members player on player.member_code = sold_data.player_code\njoin public.league_members manager on manager.member_code = sold_data.buyer_manager_code\njoin public.teams team on team.manager_member_id = manager.id\non conflict (player_member_id) do update set\n  team_id = excluded.team_id, acquired_price = excluded.acquired_price, source = excluded.source, acquired_at = now();\n\ninsert into public.league_activity(category, headline, detail)\nselect 'auction', 'Auction database initialized', 'The supplied Session 4 and Session 5 auction log has been recorded. The transfer market remains closed.'\nwhere not exists (select 1 from public.league_activity where headline = 'Auction database initialized');\n`;

await writeFile(new URL("../supabase/seed-ufa-league.sql", import.meta.url), sql, "utf8");
