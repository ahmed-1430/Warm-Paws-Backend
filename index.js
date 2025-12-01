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



app.get('/', (req, res) => {
  res.send('Server is Running.....')
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});