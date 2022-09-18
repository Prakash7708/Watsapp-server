const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongodb = require("mongodb");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;

const URL = process.env.DB;
const SECRET = process.env.SECRET;

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

let authenticate = function (req, res, next) {
    //console.log(req.headers.authorization)
    
   if(req.headers.authorization) {
     try {
      let verify = jwt.verify(req.headers.authorization, SECRET);
      if(verify) {
        req.userid = verify._id;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized1" });
      }
     } catch (error) {
      res.json({ message: "🔒Please Login to Continue" });
     }
    } else {
      res.status(401).json({ message: "Unauthorized3" });
    }
  };

  app.post("/register",async function (req, res) {

    try {
      const connection = await mongoClient.connect(URL);
  
      const db = connection.db("watsapp");

      const user = await db
        .collection("users")
        .findOne({ username: req.body.username });
      if(user){
         res.json({
          message:"Usename already used"
         })
      }else{
        const salt = await bcryptjs.genSalt(10);
      const hash = await bcryptjs.hash(req.body.password, salt);
      req.body.password = hash;
      await db.collection("users").insertOne(req.body);
      await connection.close();
      res.json({
        message: "Successfully Registered",
      });}
    } catch (error) {
      res.status(500).json({
        message: "Error",
      });
    }
  });

app.post("/login",async function (req, res) {
    try {
      const connection = await mongoClient.connect(URL);
      const db = connection.db("watsapp");
      const user = await db
        .collection("users")
        .findOne({ username: req.body.username });
  
      if (user) {
        const match = await bcryptjs.compare(req.body.password, user.password);
        if (match) {
          // Token
          // const token = jwt.sign({ _id: user._id }, SECRET, { expiresIn: "1m" });
          const token = jwt.sign({ _id: user._id }, SECRET);
          res.status(200).json({
            message: "Successfully Logged In",
            token,
          });
        } else {
          res.json({
            message: "Password is incorrect",
          });
        }
      } else {
        res.json({
          message: "User not found Please sign in",
        });
      }
    } catch (error) {
      console.log(error);
    }
  });


  app.get("/allusers/:id",authenticate,async function (req, res) {
    //console.log(req.params.id)
   try {
     const connection = await mongoClient.connect(URL);
     const db = connection.db("watsapp");
    let buy= await db.collection("users").find({}).toArray();
     await connection.close();
     //console.log(buy)
     res.json(buy);
   } catch (error) {
     console.log(error);
   }
 });

 app.post("/msg",authenticate,async function (req, res) {
  //console.log(req.body)
  //console.log(req.body.token)
 try {
   const connection = await mongoClient.connect(URL);
   const db = connection.db("watsapp");
   //req.body.userid = mongodb.ObjectId(req.userid);
   //delete req.body._id 
   let buy= await db.collection("msg").insertOne(req.body); 
   await connection.close();
   res.json({
    message: "Order Placed Successfully",
  });
 } catch (error) {
   console.log(error);
 }
});


app.get("/getmsgs",authenticate,async function (req,res){
  //console.log(req.params.id)
  //console.log(req.headers.receiver)
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db("watsapp");
   let msg= await db.collection("msg").find().toArray();
    await connection.close();
    //console.log(msg)
    res.json(msg)
  
  } catch (error) {
    console.log(error);
  }
})


  app.listen(process.env.PORT || 3001);