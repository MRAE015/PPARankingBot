const express = require("express");
const noblox = require("noblox.js");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🔐 Login using your bot's cookie
(async () => {
  try {
    await noblox.setCookie(process.env.ROBLOX_COOKIE);
    const user = await noblox.getCurrentUser();
    console.log(`🤖 Logged in as ${user.UserName}`);
  } catch (err) {
    console.error("Login failed:", err);
  }
})();

// ✅ For UptimeRobot
app.get("/rank", (req, res) => {
  res.send("✅ Rank bot is alive and running!");
});

// 🚀 POST /rank: for touchpads or scripted HTTPService
app.post("/rank", async (req, res) => {
  const { UserId, Group, Role } = req.body;
  if (!UserId || !Group || !Role) {
    return res.status(400).send("Missing data");
  }

  try {
    const roles = await noblox.getRoles(Group);
    const target = roles.find(r => r.name === Role);
    if (!target) return res.status(404).send("Role not found");

    await noblox.setRank(Group, UserId, target.rank);
    console.log(`✅ Ranked UserId ${UserId} to ${Role}`);
    res.send("Ranked successfully");
  } catch (err) {
    console.error("Ranking error:", err);
    res.status(500).send("Error ranking user");
  }
});

// 🔼 GET /group/promote: promote by username
app.get("/group/promote", async (req, res) => {
  const { user_name, groupid } = req.query;
  if (!user_name || !groupid) return res.status(400).send("Missing data");

  try {
    const userId = await noblox.getIdFromUsername(user_name);
    const currentRank = await noblox.getRankInGroup(groupid, userId);
    const roles = await noblox.getRoles(groupid);

    const index = roles.findIndex(r => r.rank === currentRank);
    if (index === -1 || index + 1 >= roles.length) {
      return res.status(400).send("Cannot promote further.");
    }

    const nextRole = roles[index + 1];
    await noblox.setRank(groupid, userId, nextRole.rank);
    console.log(`✅ Promoted ${user_name} to ${nextRole.name}`);
    res.send("Promoted successfully");
  } catch (err) {
    console.error("Promotion error:", err);
    res.status(500).send("Promotion failed");
  }
});

// 🔽 GET /group/demote: demote by username
app.get("/group/demote", async (req, res) => {
  const { user_name, groupid } = req.query;
  if (!user_name || !groupid) return res.status(400).send("Missing data");

  try {
    const userId = await noblox.getIdFromUsername(user_name);
    const currentRank = await noblox.getRankInGroup(groupid, userId);
    const roles = await noblox.getRoles(groupid);

    const index = roles.findIndex(r => r.rank === currentRank);
    if (index <= 0) {
      return res.status(400).send("Cannot demote further.");
    }

    const lowerRole = roles[index - 1];
    await noblox.setRank(groupid, userId, lowerRole.rank);
    console.log(`✅ Demoted ${user_name} to ${lowerRole.name}`);
    res.send("Demoted successfully");
  } catch (err) {
    console.error("Demotion error:", err);
    res.status(500).send("Demotion failed");
  }
});

// Start server
app.listen(3000, () => console.log("🚀 Bot server running on port 3000"));
