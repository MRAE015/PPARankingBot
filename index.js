const express = require("express");
const noblox = require("noblox.js");
require("dotenv").config();

const app = express();
app.use(express.json());

let botReady = false; // ✅ Flag to ensure we're logged in

// 🔐 Login using your bot's cookie
(async () => {
  try {
    await noblox.setCookie(process.env.ROBLOX_COOKIE);
    const user = await noblox.getCurrentUser();
    console.log(`🤖 Logged in as ${user.UserName}`);
    botReady = true;
  } catch (err) {
    console.error("❌ Login failed:", err);
  }
})();

// ✅ Uptime check
app.get("/rank", (req, res) => {
  res.send("✅ Rank bot is alive and running!");
});

// 🚀 POST /rank: promote user
app.post("/rank", async (req, res) => {
  if (!botReady) return res.status(503).send("Bot not ready");

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
    console.error("❌ Ranking error:", err.message);
    res.status(500).send("Error ranking user: " + err.message);
  }
});

// 🔼 GET /group/promote
app.get("/group/promote", async (req, res) => {
  if (!botReady) return res.status(503).send("Bot not ready");

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
    console.error("❌ Promotion error:", err.message);
    res.status(500).send("Promotion failed: " + err.message);
  }
});

// 🔽 GET /group/demote
app.get("/group/demote", async (req, res) => {
  if (!botReady) return res.status(503).send("Bot not ready");

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
    console.error("❌ Demotion error:", err.message);
    res.status(500).send("Demotion failed: " + err.message);
  }
});

// ✅ Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Bot server running on port ${PORT}`));
