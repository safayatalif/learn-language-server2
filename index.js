const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


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

        // classes relative api 
        // get all classes 
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray()
            res.send(result)
        })

        // get data in language 
        app.get("/classes/:language", async (req, res) => {
            const result = await classesCollection.find({ language: req.params.language }).toArray();
            res.send(result);
        });


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
            // console.log(id)
            const query = { _id: new ObjectId(id) }

            const result = await studentCollection.deleteOne(query)
            res.send(result)
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