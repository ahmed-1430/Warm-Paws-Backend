require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);

let db, Services, Bookings, Reviews, Users;

async function connectDB() {
  try {
    // await client.connect();
    db = client.db("WarmPaws");

    Services = db.collection("services");
    Bookings = db.collection("bookings");
    Reviews = db.collection("reviews");
    Users = db.collection("users");

    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}
connectDB();

/* ----------------------------
    ROOT
----------------------------- */
app.get("/", (req, res) => {
  res.send("WarmPaws Server is Running...");
});


//    SERVICES API


// Get all services
app.get("/api/services", async (req, res) => {
  const result = await Services.find().toArray();
  res.send(result);
});

// Get single service
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


//     BOOKINGS API


// Create a booking
app.post("/api/bookings", async (req, res) => {
  const data = { ...req.body, createdAt: new Date(), status: "pending" };
  const result = await Bookings.insertOne(data);
  res.send(result);
});

// Get bookings of a user
app.get("/api/bookings/user/:userId", async (req, res) => {
  const userId = req.params.userId;

  const bookings = await Bookings.find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  if (bookings.length === 0) return res.send([]);

  const serviceIds = bookings.map(b => new ObjectId(b.serviceId));
  const services = await Services.find({ _id: { $in: serviceIds } }).toArray();

  const map = Object.fromEntries(services.map(s => [s._id.toString(), s]));

  const enriched = bookings.map(b => ({
    ...b,
    service: map[b.serviceId] || null,
  }));

  res.send(enriched);
});

// ADMIN — Get all bookings (Manage Bookings)

//      ADMIN BOOKINGS API


const isValidObjectId = (id) => {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
};

app.get("/api/admin/bookings", async (req, res) => {
  try {
    const bookings = await Bookings.find().sort({ createdAt: -1 }).toArray();

    if (!bookings.length) return res.send([]);

    // Filter valid object ids only
    const validServiceIds = bookings
      .filter(b => isValidObjectId(b.serviceId))
      .map(b => new ObjectId(b.serviceId));

    const validUserIds = bookings
      .filter(b => isValidObjectId(b.userId))
      .map(b => new ObjectId(b.userId));

    // Fetch related data
    const services = await Services.find({ _id: { $in: validServiceIds } }).toArray();
    const users = await Users.find({ _id: { $in: validUserIds } }).toArray();

    // Create lookup maps
    const serviceMap = Object.fromEntries(
      services.map(s => [s._id.toString(), s])
    );

    const userMap = Object.fromEntries(
      users.map(u => [u._id.toString(), u])
    );

    // Merge data safely
    const enriched = bookings.map(b => ({
      ...b,

      service: isValidObjectId(b.serviceId)
        ? serviceMap[b.serviceId] || null
        : null,

      user: isValidObjectId(b.userId)
        ? userMap[b.userId] || null
        : null,
    }));

    res.send(enriched);
  } catch (err) {
    console.error("ADMIN BOOKINGS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});





//   UPDATE BOOKING STATUS


app.patch("/api/bookings/:id", async (req, res) => {
  try {
    const result = await Bookings.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete booking
app.delete("/api/admin/bookings/:id", async (req, res) => {
  const result = await Bookings.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});



//    REVIEWS API


// Add review
app.post("/api/reviews", async (req, res) => {
  const data = { ...req.body, createdAt: new Date() };
  const result = await Reviews.insertOne(data);
  res.send(result);
});

// Get all reviews for a service
app.get("/api/reviews/service/:serviceId", async (req, res) => {
  const result = await Reviews.find({ serviceId: req.params.serviceId }).toArray();
  res.send(result);
});

// Get reviews of a user
app.get("/api/reviews/user/:userId", async (req, res) => {
  const result = await Reviews.find({ userId: req.params.userId }).toArray();
  res.send(result);
});

// ADMIN — get all reviews
app.get("/api/admin/reviews", async (req, res) => {
  const reviews = await Reviews.find().sort({ createdAt: -1 }).toArray();
  res.send(reviews);
});


// ADMIN DASHBOARD ANALYTICS


// Total numbers
app.get("/api/admin/counts", async (req, res) => {
  const [users, bookings, reviews, services] = await Promise.all([
    Users.countDocuments(),
    Bookings.countDocuments(),
    Reviews.countDocuments(),
    Services.countDocuments(),
  ]);

  res.send({ users, bookings, reviews, services });
});

// Recent bookings
app.get("/api/admin/bookings/recent", async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const bookings = await Bookings.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const serviceIds = bookings.map(b => new ObjectId(b.serviceId));
  const services = await Services.find({ _id: { $in: serviceIds } }).toArray();
  const map = Object.fromEntries(services.map(s => [s._id.toString(), s]));

  const enriched = bookings.map(b => ({
    ...b,
    service: map[b.serviceId] || null,
  }));

  res.send(enriched);
});

/* ----------------------------
    START SERVER
----------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
