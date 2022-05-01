import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'

// config
const app = express();
app.use(cors());
app.use(json());
dotenv.config();

// database
let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);

// joi
const userSchema = joi.object({
    name: joi.string().required(),
    lastStatus: joi.number().required()
});
const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().email().required(),
    type: joi.string().email().required(),
    time: joi.string().email().required()
});


app.listen(5000, () => console.log(chalk.bold.green("Server initiated at port 5000")));

