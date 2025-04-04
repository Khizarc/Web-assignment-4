const express = require("express");
const clientSessions = require("client-sessions");
const siteData = require("./modules/data-service");
const authData = require("./modules/auth-service");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: "session",
    secret: "some_long_unguessable_string",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

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

app.get("/addSite", ensureLogin, async (req, res) => {
  try {
    const provincesAndTerritories = await siteData.getAllProvincesAndTerritories();
    res.render("addSite", { provincesAndTerritories, page: "/addSite" });
  } catch (err) {
    res.render("500", { message: `Error loading provinces: ${err}`, page: "" });
  }
});

app.post("/addSite", ensureLogin, async (req, res) => {
  try {
    await siteData.addSite(req.body);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}`, page: "" });
  }
});

app.get("/editSite/:id", ensureLogin, async (req, res) => {
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

app.post("/editSite", ensureLogin, async (req, res) => {
  try {
    const siteId = req.body.id;
    req.body.worldHeritageSite = req.body.worldHeritageSite === "on";
    await siteData.editSite(siteId, req.body);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}`, page: "" });
  }
});

app.get("/deleteSite/:id", ensureLogin, async (req, res) => {
  try {
    await siteData.deleteSite(req.params.id);
    res.redirect("/sites");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}`, page: "" });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { page: "", errorMessage: null, userName: null });
});

app.get("/register", (req, res) => {
  res.render("register", { page: "", errorMessage: null, successMessage: null, userName: null });
});

app.post("/register", async (req, res) => {
  try {
    await authData.registerUser(req.body);
    res.render("register", { page: "", successMessage: "User created", errorMessage: null, userName: null });
  } catch (err) {
    res.render("register", { page: "", errorMessage: err, successMessage: null, userName: req.body.userName });
  }
});

app.post("/login", async (req, res) => {
  req.body.userAgent = req.get("User-Agent");
  try {
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect("/sites");
  } catch (err) {
    res.render("login", { page: "", errorMessage: err, userName: req.body.userName });
  }
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory", { page: "" });
});

app.use((req, res) => {
  res.status(404).render("404", { message: "We can't find what you're looking for.", page: "" });
});

siteData.initialize()
  .then(() => authData.initialize())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize data:", err);
  });
