require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let db, Services, Bookings, Reviews;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("WarmPaws"); 
    Services = db.collection("services");
    Bookings = db.collection("bookings");
    Reviews = db.collection("reviews");

    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}

connectDB();



//  ALL ROUTES


// ROOT
app.get("/", (req, res) => {
  res.send("WarmPaws Server is Running...");
});


// SERVICES API STARTED


// Get all services Api
app.get("/api/services", async (req, res) => {
  const result = await Services.find().toArray();
  res.send(result);
});

// Get single service Api
app.get("/api/services/:id", async (req, res) => {
  const result = await Services.findOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});



// start server from here
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});