/********************************************************************************
* WEB322 – Assignment 04
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: Khizar Chaudhry Student ID: 029957156  Date: 2025-03/09
* Published URL: web-assignment-4-nine.vercel.app
*
********************************************************************************/

const express = require("express");
const siteData = require("./modules/data-service");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.set('views', __dirname + '/views');
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));


app.use(express.urlencoded({ extended: true }));


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


app.get("/addSite", async (req, res) => {
  try {
    const provincesAndTerritories = await siteData.getAllProvincesAndTerritories();
    res.render("addSite", { provincesAndTerritories, page: "/addSite" });
  } catch (err) {
    res.render("500", { message: `Error loading provinces: ${err}`, page: "" });
  }
});


app.post("/addSite", async (req, res) => {
  try {
    await siteData.addSite(req.body);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}`, page: "" });
  }
});


app.get("/editSite/:id", async (req, res) => {
  try {
    const [site, provincesAndTerritories] = await Promise.all([
      siteData.getSiteById(req.params.id),
      siteData.getAllProvincesAndTerritories()
    ]);
    if (!site) {
      return res.status(404).render("404", { message: `No site found with ID: ${req.params.id}`, page: "" });
    }
    res.render("editSite", { site, provincesAndTerritories, page: "" });
  } catch (err) {
    res.status(404).render("404", { message: err.message, page: "" });
  }
});


app.post("/editSite", async (req, res) => {
  try {
    const siteId = req.body.id;
    
    req.body.worldHeritageSite = (req.body.worldHeritageSite === "on");
    await siteData.editSite(siteId, req.body);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}`, page: "" });
  }
});


app.get("/deleteSite/:id", async (req, res) => {
  try {
    await siteData.deleteSite(req.params.id);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}`, page: "" });
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
