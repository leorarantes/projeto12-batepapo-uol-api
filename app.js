import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'
import dayjs from "dayjs";

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
});
const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().email().required(),
    type: joi.string().email().required(),
    time: joi.string().email().required()
});


app.post("/participants", async (req, res) => {
    const newUser = req.body;
    const validation = userSchema.validate(newUser);

    if (validation.error) {
        res.status(422).send("'name' deve ser string não vazio!");
        return;
    }

    try {
        await mongoClient.connect();
        db = mongoClient.db("project-12");

        const usersArray = await db.collection("users").find().toArray();
        for(let i=0; i < usersArray.length; i++) {
            if(usersArray[i].name === newUser.name) {
                res.status(409).send("User already registered");
                return;
            }
        }

        await db.collection("users").insertOne({ ...newUser, lastStatus: Date.now() });

        let hour = dayjs().hour();
        hour < 10 ? hour = "0" + hour : hour = hour.toString();
        let minute = dayjs().minute();
        minute < 10 ? minute = "0" + minute : minute = minute.toString();
        let second = dayjs().second();
        second < 10 ? second = "0" + second : second = second.toString();
        await db.collection("messages").insertOne({from: newUser.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: hour + ':' + minute + ':' + second});

        res.sendStatus(201);

        mongoClient.close();
    } catch (e) {
        res.status(500).send("An error occured while registering the user!", e);
        mongoClient.close();
    }
});


app.listen(5000, () => console.log(chalk.bold.green("Server initiated at port 5000")));

