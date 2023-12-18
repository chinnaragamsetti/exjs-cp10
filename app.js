const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");
const app = express();
app.use(express.json());

let db = null;

const initializwDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Runnig at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(-1);
  }
};

initializwDbAndServer();

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const LoginQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbLogin = await db.get(LoginQuery);
  if (dbLogin === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbLogin.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "Secrettoken");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

const authentication = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.statsu(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "Secrettoken", async (error, payload) => {
      if (error) {
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.get("/states/", async (request, response) => {
  const AllstatesQuery = `SELECT * FROM user`;
  const dbAllstatesQuery = await db.all(AllstatesQuery);
  response.send(dbAllstatesQuery);
});

app.get("/states/:statesId/", async (request, response) => {
  const { stateId } = request.params;
  const AllstatesQuery = `SELECT * FROM state WHERE state_id='${stateId}'`;
  const dbAllstatesQuery = await db.get(AllstatesQuery);
  response.send(dbAllstatesQuery);
});

app.post("/district/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addQuery = `INSERT INTO district{district_name,state_id,cases,cured,active,deaths}
    VALUES(
        '${districtName},
        '${stateId},
        '${cases},
        '${cured},
        '${active},
        '${deaths}
    );`;
  await db.run(addQuery);
  response.send("District Successfully Added");
});

app.get("/district/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const AllstatesQuery = `SELECT * FROM district WHERE district_id='${districtId}'`;
  const dbAllstatesQuery = await db.get(AllstatesQuery);
  response.send(dbAllstatesQuery);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM 
    district
    WHERE district_id='${districtId}';`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = ` UPDATE
  district
  SET 
  district_name='${districtName}',
  state_id='${stateId}',
  cases='${cases}',
  cured='${cured}',
  active='${active}',
  deaths='{deaths}'
  WHERE district_id='${districtId}';
  `;
  await db.run(updateQuery);
  response.send("Districts Details Updated");
});

app.get("/states/:statesId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const AllstatesQuery = `SELECT * FROM state WHERE state_id='${stateId}'`;
  const dbAllstatesQuery = await db.get(AllstatesQuery);
  response.send(dbAllstatesQuery);
});

module.exports = app;
