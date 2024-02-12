const express = require('express')
const multer = require('multer')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))

// Defining Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/'); // Specify the directory to store the uploaded files
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({ storage: storage })

// Connecting To MongoDB Server
mongoose.connect('mongodb://127.0.0.1:27017/MnHum', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB', error);
});

// Defineing The Schemas
const characterSchema = new mongoose.Schema({
    image: String,
    arabicName: String,
    englishName: String,
    birthday: Date,
    nationality: String,
    residence: String,
    catg: String,
    job: String,
    desc: String,
    visits: {
        type: Number,
        default: 0
    }
})

const companySchema = new mongoose.Schema({
    image: String,
    arabicName: String,
    englishName: String,
    country: String,
    mainBranch: String,
    catg: String,
    phoneNumber: String,
    code: String,
    webiste: String,
    internetLocation: String,
    email: String,
    desc: String,
    visits: {
        type: Number,
        default: 0
    }
})

const catgSchema = new mongoose.Schema({
    image: String,
    title: String
})

const Character = mongoose.model('Character', characterSchema)
const Company = mongoose.model('Company', companySchema)
const Catg = mongoose.model('Catg', catgSchema)

app.get("/", (req, res) => {
    Character.find()
    .sort({ visits: -1 }) // Sort characters by visits count in descending order
    .then((characters) => {
        res.render('index', { characters });
    })
    .catch((err) => {
        console.error("Error: " + err);
        res.status(500).send('Error occurred while retrieving characters');
    });
});

app.get('/companies', (req, res) => {
    Company.find()
    .sort({ visits: -1 }) // Sort characters by visits count in descending order
    .then((characters) => {
        res.render('index', { characters });
    })
    .catch((err) => {
        console.error("Error: " + err);
        res.status(500).send('Error occurred while retrieving characters');
    });
})

app.get('/addcharacter', (req, res) => {
    Catg.find()
    .then((catgs) => {
        res.render('addcharacter', {catgs})
    })
    .catch((err) => {
        console.error("error: " + err)
    })
})

app.get('/character/:id', (req, res) => {
    const characterId = req.params.id;

    Character.findById(characterId)
    .then((character) => {
        if (!character) {
            return res.status(404).send('Character not found');
        }

        // Increment the visits count
        character.visits += 1;
        character.save()
        .then(() => {
            // Render character details
            res.render('character-details', { character });
        })
        .catch((err) => {
            console.error("Error: " + err);
            res.status(500).send('Error occurred while updating character visits');
        });
    })
    .catch((err) => {
        console.error("Error: " + err);
        res.status(500).send('Error occurred while retrieving character');
    });
});

app.post('/addCharacter', upload.single('image'), async (req, res) => {
    const data = fs.readFileSync(req.file.path)
    const imageBuffer = Buffer.from(data)

    var character = new Character({
        image: imageBuffer.toString('base64'),
        arabicName: req.body.arabName,
        englishName: req.body.englName,
        birthday: req.body.date,
        nationality: req.body.nationality,
        residence: req.body.residence,
        catg: req.body.catg,
        job: req.body.job,
        desc: req.body.desc
    })

    character.save()
    .then(() => {
        console.log('character saved!')
        res.redirect('/')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.get('/addcompany', (req, res) => {
    Catg.find()
    .then((catgs) => {
        res.render('addCompany', {catgs})
    })
    .catch((err) => {
        console.error("error: " + err)
})})

app.get('/company/:id', (req, res) => {
    const companyId = req.params.id;

    Company.findById(companyId)
    .then((company) => {
        if (!company) {
            return res.status(404).send('Company not found');
        }

        // Increment the visits count
        company.visits += 1;
        company.save()
        .then(() => {
            // Render character details
            res.render('company-details', { company });
        })
        .catch((err) => {
            console.error("Error: " + err);
            res.status(500).send('Error occurred while updating company visits');
        });
    })
    .catch((err) => {
        console.error("Error: " + err);
        res.status(500).send('Error occurred while retrieving company');
    });
})

app.post('/addCompany', upload.single('image'), async (req, res) => {
    const data = fs.readFileSync(req.file.path)
    const imageBuffer = Buffer.from(data)

    var company = new Company({
        image: imageBuffer.toString('base64'),
        arabicName: req.body.arabName,
        englishName: req.body.englName,
        country: req.body.country,
        mainBranch: req.body.mainbranch,
        code: req.body.code,
        phoneNumber: req.body.phonenumber,
        catg: req.body.catg,
        webiste: req.body.webiste,
        internetlocation: req.body.internetlocation,
        email: req.body.email,
        desc: req.body.desc
    })

    company.save()
    .then(() => {
        console.log('company saved!')
        res.redirect('/')
    })
    .catch((err) => {
        console.error(err)
    })
})

// Catgs Routes
app.get('/catgs', (req, res) => {
    Catg.find()
    .then((catgs) => {
        res.render('catgs', {catgs})
    })
    .catch((err) => {
        console.error("error: " + err)
    })
})

app.get('/catgs/:id', (req, res) => {
    const catgId = req.params.id

    Catg.findById(catgId)
    .then((catg) => {
        res.render('catg-details', {catg})
    })
    .catch((err) => {
        console.error("error: " + err)
    })
})

app.get('/addcatg', (req, res) => {
    res.render('addcatg')
})

app.post('/addcatg', upload.single('image'), (req, res) => {
    const data = fs.readFileSync(req.file.path)
    const imageBuffer = Buffer.from(data)

    const catg = new Catg({
        image: imageBuffer.toString('base64'),
        title: req.body.title
    })

    catg.save()
    .then(() => {
        console.log('Catg Saved ^-^')
    })
    .catch((err) => {
        console.error("error: " + err)
        res.redirect('/catgs')
    })
})

app.listen(3000, () => {
    console.log('App Is Running On Port 3000')
})