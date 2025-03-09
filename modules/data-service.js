const siteData = require("../data/NHSiteData"); 
const provinceAndTerritoryData = require("../data/provinceAndTerritoryData");

let sites = [];

function initialize() {
  return new Promise((resolve, reject) => {
    try {
      if (!Array.isArray(siteData) || siteData.length === 0) {
        reject("NHSiteData is empty or not an array");
        return;
      }
      if (!Array.isArray(provinceAndTerritoryData) || provinceAndTerritoryData.length === 0) {
        reject("provinceAndTerritoryData is empty or not an array");
        return;
      }

      siteData.forEach(site => {
        let match = provinceAndTerritoryData.find(
          p => p.code === site.provinceOrTerritoryCode
        );
        if (match) {
          site.provinceOrTerritoryObj = match;
        }
      });

      sites = siteData;

      if (sites.length > 0) {
        resolve();
      } else {
        reject("No site data available after merging.");
      }
    } catch (err) {
      reject("Unable to initialize site data: " + err);
    }
  });
}

function getAllSites() {
  return new Promise((resolve, reject) => {
    if (sites.length > 0) {
      resolve(sites);
    } else {
      reject("No site data available.");
    }
  });
}

function getSiteById(id) {
  return new Promise((resolve, reject) => {
    const foundSite = sites.find(site => site.siteId === id);
    if (foundSite) {
      resolve(foundSite);
    } else {
      reject(`Unable to find requested site with id: ${id}`);
    }
  });
}

function getSitesByProvinceOrTerritoryName(name) {
  return new Promise((resolve, reject) => {
    if (!name) {
      reject("No province or territory name provided.");
      return;
    }
    const lowerName = name.toLowerCase();
    const matchedSites = sites.filter(site =>
      site.provinceOrTerritoryObj?.name.toLowerCase().includes(lowerName)
    );

    if (matchedSites.length > 0) {
      resolve(matchedSites);
    } else {
      reject(`Unable to find requested sites matching province/territory: "${name}"`);
    }
  });
}

function getSitesByRegion(region) {
  return new Promise((resolve, reject) => {
    if (!region) {
      reject("No region provided.");
      return;
    }
    const lowerRegion = region.toLowerCase();
    const matchedSites = sites.filter(site =>
      site.provinceOrTerritoryObj?.region.toLowerCase().includes(lowerRegion)
    );

    if (matchedSites.length > 0) {
      resolve(matchedSites);
    } else {
      reject(`Unable to find requested sites in region: "${region}"`);
    }
  });
}

module.exports = {
  initialize,
  getAllSites,
  getSiteById,
  getSitesByProvinceOrTerritoryName,
  getSitesByRegion
};
