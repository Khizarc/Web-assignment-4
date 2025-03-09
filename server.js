const express = require("express");
const siteData = require("./modules/data-service");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("home", { page: "/" });
});

app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

app.get("/sites", async (req, res) => {
  try {
    const { region, provinceOrTerritory } = req.query;
    let sites;

    if (region) {
      sites = await siteData.getSitesByRegion(region);
      if (!sites || sites.length === 0) {
        return res.status(404).render("404", { message: `No sites found for region: ${region}`, page: "" });
      }
    } else if (provinceOrTerritory) {
      sites = await siteData.getSitesByProvinceOrTerritoryName(provinceOrTerritory);
      if (!sites || sites.length === 0) {
        return res.status(404).render("404", { message: `No sites found for province: ${provinceOrTerritory}`, page: "" });
      }
    } else {
      sites = await siteData.getAllSites();
    }

    res.render("sites", { sites, page: "/sites" });
  } catch (err) {
    res.status(404).render("404", { message: err.message, page: "" });
  }
});

app.get("/sites/:id", async (req, res) => {
  try {
    const site = await siteData.getSiteById(req.params.id);
    if (!site) {
      return res.status(404).render("404", { message: `No site found with ID: ${req.params.id}`, page: "" });
    }
    res.render("site", { site, page: "" });
  } catch (err) {
    res.status(404).render("404", { message: err.message, page: "" });
  }
});

app.use((req, res) => {
  res.status(404).render("404", { message: "We can't find what you're looking for.", page: "" });
});

siteData.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to initialize site data:", err);
  });
