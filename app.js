import express, { json } from "express";
import chalk from "chalk";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
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


app.post("/participants", async (req, res) => {
    const newUser = req.body;
    const userSchema = joi.object({
        name: joi.string().required(),
    });
    const validation = userSchema.validate(newUser);

    if (validation.error) {
        res.status(422).send(validation.error.message);
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

app.get("/participants", async (req, res) => {
    try {
        await mongoClient.connect();
        db = mongoClient.db("project-12");

        const usersArray = await db.collection("users").find().toArray();
        res.status(201).send(usersArray);

        mongoClient.close();
    } catch (e) {
        res.status(500).send("An error occured while getting the users array!", e);
        mongoClient.close();
    }
});

app.post("/messages", async (req, res) => {
    const newMessage = req.body;
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private_message")
    });
    const messageValidation = messageSchema.validate(newMessage);
    if (messageValidation.error) {
        res.status(422).send(messageValidation.error.message);
        return;
    }

    try {
        await mongoClient.connect();
        db = mongoClient.db("project-12");

        const from = req.headers.from;
        const usersArray = await db.collection("users").find().toArray();
        const fromSchema = joi.array().has({
            _id: joi.any(),
            name: joi.string().valid(from),
            lastStatus: joi.number()
        });
        const fromValidation = fromSchema.validate(usersArray);
        if (fromValidation.error) {
            res.status(422).send(fromValidation.error.message);
            return;
        }

        let hour = dayjs().hour();
        hour < 10 ? hour = "0" + hour : hour = hour.toString();
        let minute = dayjs().minute();
        minute < 10 ? minute = "0" + minute : minute = minute.toString();
        let second = dayjs().second();
        second < 10 ? second = "0" + second : second = second.toString();
        await db.collection("messages").insertOne({from: from, ... newMessage, time: hour + ':' + minute + ':' + second});

        res.sendStatus(201);

        mongoClient.close();
    } catch (e) {
        res.status(500).send("An error occured while sending the message!", e);
        mongoClient.close();
    }
});

app.get("/messages", async (req, res) => {
    let limit = req.query.limit;
    if(typeof limit === "string") {
        limit = parseInt(limit);
        const limitSchema = joi.number().required();
        const limitValidation = limitSchema.validate(limit);
        if (limitValidation.error) {
            res.status(422).send(limitValidation.error.message);
            return;
        }
    }

    const user = req.headers.user;
    const userSchema = joi.string().required();
    const userValidation = userSchema.validate(user);
    if (userValidation.error) {
        res.status(422).send(userValidation.error.message);
        return;
    }

    try {
        await mongoClient.connect();
        db = mongoClient.db("project-12");

        const messagesArray = await db.collection("messages").find().toArray();
        let messagesList = [];
        
        messagesArray.forEach(element => {
            if(element.user === user || element.to === user || element.to === "Todos") {
                messagesList.push(element);
            }
        });

        if(typeof limit === "undefined" || limit > messagesList.length) {
            res.status(201).send(messagesList);
        }
        else {
            const aux = messagesList.length - limit;
            messagesList = messagesList.splice(aux);
            res.status(201).send(messagesList);
        }

        mongoClient.close();
    } catch (e) {
        res.status(500).send("An error occured while getting the messages array!", e);
        mongoClient.close();
    }
});


app.listen(5000, () => console.log(chalk.bold.green("Server initiated at port 5000")));

