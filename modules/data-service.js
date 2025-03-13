require('dotenv').config();
require('pg'); 
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    },
    logging: false,
    define: {
      createdAt: false,
      updatedAt: false
    }
  }
);


const ProvinceOrTerritory = sequelize.define('ProvinceOrTerritory', {
  code: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  name: Sequelize.STRING,
  type: Sequelize.STRING,
  region: Sequelize.STRING,
  capital: Sequelize.STRING
});


const Site = sequelize.define('Site', {
  siteId: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  site: Sequelize.STRING,
  description: Sequelize.TEXT,
  date: Sequelize.INTEGER,
  dateType: Sequelize.STRING,
  image: Sequelize.STRING,
  location: Sequelize.STRING,
  latitude: Sequelize.FLOAT,
  longitude: Sequelize.FLOAT,
  designated: Sequelize.INTEGER,
  provinceOrTerritoryCode: Sequelize.STRING
});


Site.belongsTo(ProvinceOrTerritory, { foreignKey: 'provinceOrTerritoryCode' });


function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync()
      .then(() => resolve())
      .catch(err => reject("Unable to sync the database: " + err));
  });
}


function getAllSites() {
  return new Promise((resolve, reject) => {
    Site.findAll({ include: [ProvinceOrTerritory] })
      .then(sites => {
        if (sites.length > 0) resolve(sites);
        else reject("No site data available.");
      })
      .catch(err => reject(err));
  });
}


function getSiteById(id) {
  return new Promise((resolve, reject) => {
    Site.findOne({
      where: { siteId: id },
      include: [ProvinceOrTerritory]
    })
      .then(site => {
        if (site) resolve(site);
        else reject(`Unable to find requested site with id: ${id}`);
      })
      .catch(err => reject(err));
  });
}


function getSitesByProvinceOrTerritoryName(provinceOrTerritory) {
  return new Promise((resolve, reject) => {
    if (!provinceOrTerritory) {
      reject("No province or territory name provided.");
      return;
    }
    Site.findAll({
      include: [ProvinceOrTerritory],
      where: {
        '$ProvinceOrTerritory.name$': {
          [Sequelize.Op.iLike]: `%${provinceOrTerritory}%`
        }
      }
    })
      .then(sites => {
        if (sites.length > 0) resolve(sites);
        else reject(`Unable to find requested sites matching province/territory: "${provinceOrTerritory}"`);
      })
      .catch(err => reject(err));
  });
}


function getSitesByRegion(region) {
  return new Promise((resolve, reject) => {
    if (!region) {
      reject("No region provided.");
      return;
    }
    Site.findAll({
      include: [ProvinceOrTerritory],
      where: {
        '$ProvinceOrTerritory.region$': {
          [Sequelize.Op.iLike]: `%${region}%`
        }
      }
    })
      .then(sites => {
        if (sites.length > 0) resolve(sites);
        else reject(`Unable to find requested sites in region: "${region}"`);
      })
      .catch(err => reject(err));
  });
}


function getAllProvincesAndTerritories() {
  return new Promise((resolve, reject) => {
    ProvinceOrTerritory.findAll()
      .then(data => resolve(data))
      .catch(err => reject(err));
  });
}


function addSite(siteData) {
  return new Promise((resolve, reject) => {
    Site.create(siteData)
      .then(() => resolve())
      .catch(err => {
        if (err && err.errors && err.errors[0]) {
          reject(err.errors[0].message);
        } else {
          reject(err.message);
        }
      });
  });
}


function editSite(id, siteData) {
  return new Promise((resolve, reject) => {
    Site.update(siteData, { where: { siteId: id } })
      .then(([rowsUpdated]) => {
        if (rowsUpdated > 0) {
          resolve();
        } else {
          reject(`No site found with siteId: ${id}`);
        }
      })
      .catch(err => {
        if (err && err.errors && err.errors[0]) {
          reject(err.errors[0].message);
        } else {
          reject(err.message);
        }
      });
  });
}


function deleteSite(id) {
  return new Promise((resolve, reject) => {
    Site.destroy({
      where: { siteId: id }
    })
      .then(rowsDeleted => {
        if (rowsDeleted > 0) {
          resolve();
        } else {
          reject(`No site found with siteId: ${id}`);
        }
      })
      .catch(err => {
        if (err && err.errors && err.errors[0]) {
          reject(err.errors[0].message);
        } else {
          reject(err.message);
        }
      });
  });
}

module.exports = {
  initialize,
  getAllSites,
  getSiteById,
  getSitesByProvinceOrTerritoryName,
  getSitesByRegion,
  getAllProvincesAndTerritories,
  addSite,
  editSite,
  deleteSite 
};

if (require.main === module) {
  initialize()
    .then(() => {
      console.log("Database sync complete. Exiting now.");
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
