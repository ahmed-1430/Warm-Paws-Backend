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

// Add service
app.post("/api/services", async (req, res) => {
  const result = await Services.insertOne(req.body);
  res.send(result);
});


// Update service
app.put("/api/services/:id", async (req, res) => {
  const result = await Services.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.send(result);
});

// Delete service
app.delete("/api/services/:id", async (req, res) => {
  const result = await Services.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});



// BOOKINGS API STARTED


// Create booking
app.post("/api/bookings", async (req, res) => {
  const result = await Bookings.insertOne(req.body);
  res.send(result);
})


// Get bookings by user
app.get("/api/bookings/:userId", async (req, res) => {
  const result = await Bookings.find({ userId: req.params.userId }).toArray();
  res.send(result);
});

// Update booking status
app.put("/api/bookings/:id", async (req, res) => {
  const result = await Bookings.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  res.send(result);
});


// Delete booking
app.delete("/api/bookings/:id", async (req, res) => {
  const result = await Bookings.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});



// REVIEWS API STARTED


// Add review
app.post("/api/reviews", async (req, res) => {
  const result = await Reviews.insertOne(req.body);
  res.send(result);
});

// Get all reviews for a service
app.get("/api/reviews/service/:serviceId", async (req, res) => {
  const result = await Reviews.find({
    serviceId: req.params.serviceId,
  }).toArray();
  res.send(result);
});

// Get all reviews by a user
app.get("/api/reviews/user/:userId", async (req, res) => {
  const result = await Reviews.find({
    userId: req.params.userId,
  }).toArray();
  res.send(result);
});



// start server from here
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});