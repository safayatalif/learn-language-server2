const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    // bearer token
    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {

            return res
                .status(401)
                .send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9tzptnp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        const classesCollection = client.db('learnDB').collection('classes');
        const studentCollection = client.db('learnDB').collection('selected');
        const usersCollection = client.db('learnDB').collection('users');

        // jwt create api 
        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h',
            })

            res.send({ token })
        })

        // Save user email and set role in DB
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })

        // Get user
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        // get all user 

        app.get("/users", verifyJWT, async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        // classes relative api 
        // get all classes 
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray()
            res.send(result)
        })


        // get data in status 
        app.get("/classes/status/:status", verifyJWT, async (req, res) => {
            const result = await classesCollection.find({ status: req.params.status }).toArray();
            res.send(result);
        });


        app.get("/classes/language/:language", async (req, res) => {
            const result = await classesCollection.find({ language: req.params.language }).toArray();
            res.send(result);
        });

        // get data in email
        app.get('/classes/instructor/:email', async (req, res) => {
            const email = req.params.email
            const query = { instructor_email: email }
            const result = await classesCollection.find(query).toArray()
            res.send(result)
        })

        // post class relative api 
        app.post('/classes', verifyJWT, async (req, res) => {
            const item = req.body
            const result = classesCollection.insertOne(item)
            res.send(result)
        })
        // post class relative api 
        app.patch('/classes/:id', async (req, res) => {
            const status = req.body
            console.log(status, req.params.id)
            const filter = { _id: new ObjectId(req.params.id) }
            const updateDoc = {
                $set: status,
            }
            const result = await classesCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        // student relative api 
        // selected data put 
        app.put('/selected/:id', async (req, res) => {
            const select = req.body
            const filter = { _id: new ObjectId(req.params.id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: select,
            }
            const result = await studentCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        // get selected data by email
        app.get("/selected/:email", async (req, res) => {
            const result = await studentCollection.find({ student_email: req.params.email }).toArray();
            res.send(result);
        });

        // delete selected data by id
        app.delete('/selected/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await studentCollection.deleteOne(query)
            res.send(result)
        })


        // create payment intent
        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body
            const amount = parseFloat(price) * 100
            if (!price) return
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card'],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            })
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Learn language Start')
})

app.listen(port, () => {
    console.log(`Learn language Start on port ${port}`)
})