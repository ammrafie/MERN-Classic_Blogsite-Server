const express = require('express');
const {MongoClient} = require('mongodb');
const bodyParser = require('body-parser');
const cors = require("cors");
require('dotenv').config()

const app = express();
const port= process.env.PORT || 5000;
const uri = process.env.MONGO_URI;
const dbName = 'my-blog';
const dbcollectionName = 'articles';

app.use(cors());
app.use(bodyParser.json());


const withDB = async (operations, res) => {
    try {
        const client = new MongoClient(uri, {useUnifiedTopology: true, useNewUrlParser: true});
        const db = client.db(dbName);
        await client.connect();
        await operations(db);
        await client.close();
    } catch (error) {
        res.status(500).json({message:'>>> Error connecting to db <<<', error});
    }    
}


app.get('/', (req, res) => {
    res.send('Hellowww !')
});


app.get('/api/articles/:name', (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection(dbcollectionName).findOne({name:articleName});
        res.status(200).json(articleInfo);
    }, res);
});


app.post('/api/articles/:name/upvote', async (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection(dbcollectionName).findOne({name:articleName});
        await db.collection('articles').updateOne({name:articleName}, {
            '$set': {
                upvotes : articleInfo.upvotes + 1,
            },
        });
        const updatedArticleInfo = await db.collection(dbcollectionName).findOne({name:articleName});
        res.status(200).json(updatedArticleInfo);
    }, res);
});


app.post('/api/articles/:name/add-comment', (req,res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    
    withDB(async (db) => {
        const articleInfo = await db.collection(dbcollectionName).findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                comments: articleInfo.comments.concat({username, text}),
            }
        });
        const updatedArticleInfo = await db.collection(dbcollectionName).findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res);
});


app.listen(port, () => console.log(`Listening on port: ${port} `));




