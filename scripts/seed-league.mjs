import mysql from "mysql2/promise";

const members = [
  ["UBSR-006", "Shubhayu Dey", "Commerce A", "manager", "GK, CB", "9/10", 450],
  ["UBSR-022", "Swarnadip Kar", "Science A", "manager", "GK, CB", "9/10", 450],
  ["UBSR-024", "Ayush Barua", "Science B", "manager", "CB, CDM, CM, CAM, SS", "8/10", 400],
  ["UBSR-028", "Puspal Das (Dey)", "Science B", "manager", "CB, CDM", "8/10", 400],
  ["UBSR-029", "Rishyraj Adhikari", "Science B", "manager", "CDM, CM", "8/10", 400],
  ["UBSR-031", "Sayanya Paul", "Science B", "manager", "SS, CF, RF", "7/10", 350],
  ["UBSR-032", "Shaheek", "Science B", "manager", "CDM, CM", "7/10", 350],
  ["UBSR-034", "Vignesh Dey", "Science B", "manager", "CB, CDM", "8/10", 400],
  ["UBSR-047", "Smayan Adhikari", "Humanities", "manager", "CDM, CM, CAM", "7/10", 350],
  ["UBSR-001", "Aarav Shaw", "Commerce A", "player", "CM, CDM, CAM, SS", "7/10", 350],
  ["UBSR-002", "Devansh Agarwal", "Commerce A", "player", "CDM", "4.5/10", 225],
  ["UBSR-003", "Farasat Alam", "Commerce A", "player", "CB, CDM", "5/10", 250],
  ["UBSR-004", "Kinshuk", "Commerce A", "player", "CAM, SS", "6.5/10", 325],
  ["UBSR-005", "Rahul Prasad", "Commerce A", "player", "LW, RF, CF", "7/10", 350],
  ["UBSR-007", "Altamash", "Commerce B", "player", "CAM, SS, CF", "8/10", 400],
  ["UBSR-008", "Arhaan Molla", "Commerce B", "player", "LW, LM", "6.5/10", 325],
  ["UBSR-009", "Aritra Kar", "Commerce B", "player", "CB, CDM", "6/10", 300],
  ["UBSR-011", "Ayushman Dey", "Commerce B", "player", "CB, CDM", "6.5/10", 325],
  ["UBSR-012", "Fahim Laskar", "Commerce B", "player", "CB, CDM, CM, CAM, LW", "9/10", 450],
  ["UBSR-013", "Naiteek Borar", "Commerce B", "player", "WildCard", "WildCard", 50],
  ["UBSR-015", "Touhid Anzar", "Commerce B", "player", "SS, CF", "7.5/10", 375],
  ["UBSR-048", "Hemadri", "Commerce B", "player", "GK, CB", "7.5/10", 375],
  ["UBSR-049", "Tamim Khan", "Commerce B", "player", "CB, CDM", "4.5/10", 225],
  ["UBSR-053", "Adarsh", "Commerce B", "player", "WildCard", "WildCard", 50],
  ["UBSR-054", "Samriddha", "Commerce B", "player", "CB, CDM", "6/10", 300],
  ["UBSR-055", "Ankit Paul", "Commerce B", "player", "GK, CB", "7/10", 350],
  ["UBSR-056", "Abhirup Dutta", "Commerce B", "player", "RW, RM, SS", "7.5/10", 375],
  ["UBSR-016", "Ankit Mondal", "Science A", "player", "GK, CB", "7/10", 350],
  ["UBSR-017", "Atrik Bose", "Science A", "player", "WildCard", "WildCard", 50],
  ["UBSR-018", "Azlan Mubashir Khan", "Science A", "player", "WildCard", "WildCard", 50],
  ["UBSR-019", "Praborshee Patra", "Science A", "player", "CDM, CM", "7/10", 350],
  ["UBSR-020", "Rupam Rit", "Science A", "player", "SS, CF", "6.5/10", 325],
  ["UBSR-021", "Soham Deb", "Science A", "player", "CAM, CM, CDM", "7.5/10", 375],
  ["UBSR-023", "Sutirtho Malya", "Science A", "player", "CB", "6/10", 300],
  ["UBSR-025", "Darpan Chakraborty", "Science B", "player", "GK, CB", "7/10", 350],
  ["UBSR-026", "Harshit Saha", "Science B", "player", "CDM, CM, CAM, LM, RM", "7.5/10", 375],
  ["UBSR-027", "Mourin Polley", "Science B", "player", "CB", "4.5/10", 225],
  ["UBSR-030", "Satwick Mallik", "Science B", "player", "CB, LB, RB", "7.5/10", 375],
  ["UBSR-033", "Subharup Roy", "Science B", "player", "CAM, SS, CF, LW", "8.5/10", 425],
  ["UBSR-035", "Writam Bhattacharjee", "Science B", "player", "CB, CDM", "4/10", 200],
  ["UBSR-050", "Mrigank Moulik Goswami", "Science B", "player", "LW, SS", "8/10", 400],
  ["UBSR-051", "Atri Mondol", "Science B", "player", "LB, LW", "7.5/10", 375],
  ["UBSR-036", "Arnav Jha", "Science C", "player", "CB, CDM", "5.5/10", 275],
  ["UBSR-037", "Prabal", "Science C", "player", "WildCard", "WildCard", 50],
  ["UBSR-038", "Rupayan Bera", "Science C", "player", "CAM, SS, CF, LF", "8/10", 400],
  ["UBSR-039", "SK Al Aakib", "Science C", "player", "CDM, CM, LM, RM, CAM, SS", "9/10", 450],
  ["UBSR-040", "SK Arish", "Science C", "player", "CM, SS, CF, LW", "9/10", 450],
  ["UBSR-041", "Sopan Basu", "Science C", "player", "SS, LF, CF, RF", "8.5/10", 425],
  ["UBSR-042", "Soumajit Santra", "Science C", "player", "WildCard", "WildCard", 50],
  ["UBSR-043", "Suhan Khosla", "Science C", "player", "GK, CB, CDM", "6.5/10", 325],
  ["UBSR-044", "Sunit Sarkar", "Science C", "player", "SS, CF, LF", "7.5/10", 375],
  ["UBSR-045", "Sushabhan Ghosh", "Science C", "player", "CM, SS, CF, LW", "9/10", 450],
  ["UBSR-052", "Sagnik", "Science C", "player", "WildCard", "WildCard", 50],
  ["UBSR-046", "Rik Mandal", "Humanities", "player", "WildCard", "WildCard", 50],
];

const managers = [
  ["UBSR-024", "Ayush Barua FC", 370],
  ["UBSR-032", "Shaheek FC", 30],
  ["UBSR-006", "Shubhayu Dey FC", 720],
  ["UBSR-034", "Vignesh Dey FC", 1225],
  ["UBSR-028", "Puspal Das FC", 1150],
  ["UBSR-031", "Sayanya Paul FC", 1190],
  ["UBSR-029", "Rishyraj Adhikari FC", 255],
  ["UBSR-022", "Swarnadip Kar FC", 255],
  ["UBSR-047", "Smayan Adhikari FC", 1105],
];

const sold = [
  ["UBSR-001", "UBSR-024", 550], ["UBSR-040", "UBSR-024", 580], ["UBSR-048", "UBSR-024", 500],
  ["UBSR-005", "UBSR-032", 375], ["UBSR-045", "UBSR-032", 555], ["UBSR-041", "UBSR-032", 575], ["UBSR-007", "UBSR-032", 465],
  ["UBSR-052", "UBSR-006", 75], ["UBSR-050", "UBSR-006", 705], ["UBSR-012", "UBSR-006", 500],
  ["UBSR-030", "UBSR-034", 400], ["UBSR-025", "UBSR-034", 375],
  ["UBSR-026", "UBSR-028", 725], ["UBSR-046", "UBSR-028", 125],
  ["UBSR-017", "UBSR-031", 175], ["UBSR-019", "UBSR-031", 635],
  ["UBSR-015", "UBSR-029", 450], ["UBSR-008", "UBSR-029", 350], ["UBSR-055", "UBSR-029", 375], ["UBSR-054", "UBSR-029", 570],
  ["UBSR-021", "UBSR-022", 625], ["UBSR-023", "UBSR-022", 425], ["UBSR-020", "UBSR-022", 695],
  ["UBSR-039", "UBSR-047", 895],
];

const unsoldCodes = new Set(["UBSR-043", "UBSR-027", "UBSR-053", "UBSR-016", "UBSR-056", "UBSR-036", "UBSR-037", "UBSR-003", "UBSR-049", "UBSR-013", "UBSR-018", "UBSR-011"]);
const notCalledCodes = new Set(["UBSR-002", "UBSR-004", "UBSR-009", "UBSR-033", "UBSR-035", "UBSR-051", "UBSR-038", "UBSR-042", "UBSR-044"]);

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed the league.");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.beginTransaction();
    const [[existing]] = await connection.query("SELECT COUNT(*) AS count FROM league_members");
    if (existing.count > 0) throw new Error("League seed cancelled because league_members already contains data.");

    await connection.query("INSERT INTO market_settings (id, ownerEnabled, arishEnabled, isOpen) VALUES (1, false, false, false)");
    await connection.query("INSERT INTO admin_seats (seat, displayName) VALUES ('owner', 'League Owner'), ('arish', 'Arish')");

    const memberIdByCode = new Map();
    for (const [memberCode, fullName, section, leagueRole, positions, rating, basePrice] of members) {
      const [result] = await connection.query(
        "INSERT INTO league_members (memberCode, fullName, section, leagueRole, positions, rating, basePrice) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [memberCode, fullName, section, leagueRole, positions, rating, basePrice]
      );
      memberIdByCode.set(memberCode, result.insertId);
    }

    const managerIdByCode = new Map();
    for (const [memberCode, teamName, currentBalance] of managers) {
      const [result] = await connection.query(
        "INSERT INTO managers (memberId, teamName, openingBalance, currentBalance) VALUES (?, ?, 2000, ?)",
        [memberIdByCode.get(memberCode), teamName, currentBalance]
      );
      managerIdByCode.set(memberCode, result.insertId);
    }

    const soldByCode = new Map(sold.map(([playerCode, managerCode, price]) => [playerCode, { managerCode, price }]));
    for (const [memberCode, , , leagueRole, , , basePrice] of members) {
      if (leagueRole === "manager") continue;
      const sale = soldByCode.get(memberCode);
      const status = sale ? "sold" : unsoldCodes.has(memberCode) ? "unsold" : notCalledCodes.has(memberCode) ? "not_called" : "unassigned";
      const buyerManagerId = sale ? managerIdByCode.get(sale.managerCode) : null;
      const finalBoughtPrice = sale ? sale.price : null;
      await connection.query(
        "INSERT INTO auction_records (playerMemberId, basePrice, finalBoughtPrice, status, buyerManagerId, resolvedAt) VALUES (?, ?, ?, ?, ?, ?)",
        [memberIdByCode.get(memberCode), basePrice, finalBoughtPrice, status, buyerManagerId, sale ? new Date() : null]
      );
      if (sale) {
        await connection.query(
          "INSERT INTO roster_entries (managerId, playerMemberId, acquiredPrice, source) VALUES (?, ?, ?, 'auction')",
          [buyerManagerId, memberIdByCode.get(memberCode), sale.price]
        );
      }
    }

    await connection.query(
      "INSERT INTO league_activity (category, headline, detail) VALUES ('auction', 'Auction database initialized', 'The supplied Session 4 and Session 5 auction log has been recorded. The transfer market remains closed.')"
    );
    await connection.commit();
    console.log(`Seeded ${members.length} members, ${managers.length} managers, and ${sold.length} sold auction records.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
