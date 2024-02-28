const express = require('express')
const multer = require('multer')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const util = require('util');
const app = express()

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'Thisismyappsecret2010',
  resave: false,
  saveUninitialized: false,
}));
app.set("view engine", 'ejs')
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Set up multer storage
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('image');

const uploadPromise = util.promisify(upload);

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images only!');
  }
}

// Passport Config
require('./config/passport')(passport);

// Connecting To MongoDB Server
const password = 'Mada@3030';
const encodedPassword = encodeURIComponent(password);

const connectionString = `mongodb+srv://youssef:${encodedPassword}@mnhum.rguk68a.mongodb.net/?retryWrites=true&w=majority&appName=MnHum`;

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB', error);
});

// Defineing The Schemas
const characterSchema = new mongoose.Schema({
    image: String,
    firstName: String,
    lastName: String,
    nickName: String,
    nationality: String,
    birthday: String,
    dieday: String,
    job: String,
    type: String,
    desc: String,
    historicalPeriod: String,
    catg: String,
    visits: {
        type: Number,
        default: 0
    }
}, {strict: false})

const companySchema = new mongoose.Schema({
    image: String,
    arabicName: String,
    englishName: String,
    country: String,
    mainBranch: String,
    catg: String,
    phoneNumber: String,
    code: String,
    website: String,
    internetLocation: String,
    email: String,
    desc: String,
    visits: {
        type: Number,
        default: 0
    }
}, {strict: false})

const catgSchema = new mongoose.Schema({
    image: String,
    title: String
})

const tagsSchema = new mongoose.Schema({
    title: String,
    visits: {
        type: Number,
        default: 0
    }
})

const countrySchema = new mongoose.Schema({
    title: String,
})

const textSchema = new mongoose.Schema({
    name: String,
    value: String,
})

const colorSchema = new mongoose.Schema({
    name: String,
    value: String
})

const Character = mongoose.model('Character', characterSchema)
const Company = mongoose.model('Company', companySchema)
const Catg = mongoose.model('Catg', catgSchema)
const Tag = mongoose.model('Tag', tagsSchema)
const Country = mongoose.model('Country', countrySchema)
const Text = mongoose.model('Text', textSchema)
const Color = mongoose.model('Color', colorSchema)

app.get("/", async (req, res) => {
    const characters = await Character.find({}).sort({visits: -1}).limit(10)
    const companies = await Company.find({}).sort({visits: -1}).limit(10)
    const catgs = await Catg.find({})
    const Footer = await Color.findOne({name: 'Footer'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    if(req.isAuthenticated){
        res.render('index', {Footer, characters, companies, catgs, user: req.user, tags, texts, btnColor, headingColor1, headingColor2, headingColor3, DocumentsCount})
    }else{
        res.render('index', {Footer, characters, companies, catgs, tags, texts, DocumentsCount})
    }
});

app.post('/search', async (req, res) => {
    var query = req.body.query;
    console.log('User searched for: ' + query);

    var characterQuery = {
        $or: [
            { firstName: { $regex: query, $options: 'i' } },
        ]
    };

    var companyQuery = {
        $or: [
            { arabicName: { $regex: query, $options: 'i' } },
            { englishName: { $regex: query, $options: 'i' } }
        ]
    };

    var characters = await Character.find(characterQuery);
    var companies = await Company.find(companyQuery);
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount
    const Footer = await Color.findOne({name: 'Footer'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})

    res.render('search-result', {characters, companies, user: req.user, Footer, btnColor, headingColor1, headingColor2, headingColor3, texts, tags, query, DocumentsCount})
});

app.get('/addcharacter', ensureAuthenticated, async (req, res) => {
    const catgs = await Catg.find()
    const Footer = await Color.findOne({name: 'Footer'})
    const countries = await Country.find()
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find()
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount
    var fieldsCount = 0

    res.render('admin/addcharacter', {DocumentsCount, Footer, catgs, tags, user: req.user, countries: countries, texts, btnColor, headingColor1, headingColor2, headingColor3, fieldsCount})
})

app.get('/character/:id', async (req, res) => {
    const characterId = req.params.id;
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({ name: 'btn-color' });
    const headingColor1 = await Color.findOne({ name: 'Heading-Back-Color1' });
    const headingColor2 = await Color.findOne({ name: 'Heading-Back-Color2' });
    const headingColor3 = await Color.findOne({ name: 'Heading-Back-Color3' });
    const texts = await Text.find({});
    const tags = await Tag.find({});
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    await Character.findById(characterId)
        .then(async (character) => {
            if (!character) {
                return res.status(404).send('Character not found');
            }

            // Increment the visits count
            character.visits += 1;
            await character.save();

            // Find characters with the same category name excluding the current character
            const sameCharacters = await Character.find({ catg: character.catg, _id: { $ne: character._id }})
                .sort({ _id: -1 }) // Sort by descending _id to get the latest items first
                .limit(3); // Limit the results to 3 items

            // Render character details
            res.render('character-details', {
                DocumentsCount,
                character,
                Footer,
                btnColor,
                headingColor1,
                headingColor2,
                headingColor3,
                user: req.user,
                texts,
                tags,
                sameCharacters
            });
        })
        .catch((err) => {
            console.error("Error: " + err);
            res.status(500).send('Error occurred while retrieving character');
        });
});

app.post('/characterCustom', async (req, res) => {
  const catgs = await Catg.find()
  const Footer = await Color.findOne({name: 'Footer'})
  const countries = await Country.find()
  const texts = await Text.find({})
  const btnColor = await Color.findOne({name: 'btn-color'})
  const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
  const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
  const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
  const tags = await Tag.find()
  const characterCount = await Character.countDocuments()
  const companyCount = await Company.countDocuments()
  const DocumentsCount = characterCount + companyCount
  const fieldsCount = req.body.fieldsNumber

  res.render('admin/addcharacter', {fieldsCount, DocumentsCount, Footer, catgs, tags, user: req.user, countries: countries, texts, btnColor, headingColor1, headingColor2, headingColor3})
})

app.post('/addCharacter', async (req, res) => {
  try {
    await uploadPromise(req, res);

    const data = fs.readFileSync(req.file.path);
    const imageBuffer = Buffer.from(data);

    const characterData = {
      image: imageBuffer.toString('base64'),
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      nickName: req.body.nickname,
      nationality: req.body.nationality,
      birthday: req.body.birthday,
      dieday: req.body.dieday,
      job: req.body.job,
      type: req.body.type,
      desc: req.body.info,
      historicalPeriod: req.body.histperiod,
      catg: req.body.catg,
    };

    // Get the custom field names and values from the request body
    const customFields = Object.keys(req.body).filter(key => key.startsWith('customName'));
    customFields.forEach(field => {
      const index = field.slice(10); // Extract the index from the field name
      const fieldName = req.body[`customName${index}`];
      const fieldValue = req.body[`customValue${index}`];
      characterData[fieldName] = fieldValue;
    });

    const character = new Character(characterData);

    character.save()
      .then(() => {
        console.log('Character saved!');
        res.redirect('/');
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('An error occurred');
      });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.get('/addcompany', ensureAuthenticated, async (req, res) => {
    const catgs = await Catg.find()
    const Footer = await Color.findOne({name: 'Footer'})
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find()
    const countries = await Country.find({})
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount
    var fieldsCount = 0

    res.render('admin/addCompany', {fieldsCount, DocumentsCount, Footer, countries, catgs, tags, user: req.user, texts, headingColor1, headingColor2, headingColor3, btnColor})
})

app.post('/companyCustom', async (req, res) => {
  const catgs = await Catg.find()
  const Footer = await Color.findOne({name: 'Footer'})
  const texts = await Text.find({})
  const btnColor = await Color.findOne({name: 'btn-color'})
  const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
  const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
  const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
  const tags = await Tag.find()
  const countries = await Country.find({})
  const characterCount = await Character.countDocuments()
  const companyCount = await Company.countDocuments()
  const DocumentsCount = characterCount + companyCount
  var fieldsCount = req.body.fieldsNumber

  res.render('admin/addCompany', {fieldsCount, DocumentsCount, Footer, countries, catgs, tags, user: req.user, texts, headingColor1, headingColor2, headingColor3, btnColor})
})

app.get('/company/:id', async (req, res) => {
    const companyId = req.params.id;
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({ name: 'btn-color' });
    const headingColor1 = await Color.findOne({ name: 'Heading-Back-Color1' });
    const headingColor2 = await Color.findOne({ name: 'Heading-Back-Color2' });
    const headingColor3 = await Color.findOne({ name: 'Heading-Back-Color3' });
    const texts = await Text.find({});
    const tags = await Tag.find({});
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    await Company.findById(companyId)
        .then(async (company) => {
            if (!company) {
                return res.status(404).send('Company not found');
            }

            // Increment the visits count
            company.visits += 1;
            await company.save();

            // Find characters with the same category name excluding the current character
            const sameCompanies = await Company.find({ catg: company.catg, _id: { $ne: company._id }})
                .sort({ _id: -1 }) // Sort by descending _id to get the latest items first
                .limit(3); // Limit the results to 3 items

            // Render character details
            res.render('company-details', {
                DocumentsCount,
                company,
                Footer,
                btnColor,
                headingColor1,
                headingColor2,
                headingColor3,
                user: req.user,
                texts,
                tags,
                sameCompanies
            });
        })
        .catch((err) => {
            console.error("Error: " + err);
            res.status(500).send('Error occurred while retrieving company');
        });
})

app.post('/addCompany', async (req, res) => {
  try {
    await uploadPromise(req, res);

    const data = fs.readFileSync(req.file.path);
    const imageBuffer = Buffer.from(data);

    const companyData = {
      image: imageBuffer.toString('base64'),
      arabicName: req.body.arabname,
      englishName: req.body.englname,
      country: req.body.country,
      mainBranch: req.body.mainbranch,
      code: req.body.code,
      phoneNumber: req.body.phonenumber,
      catg: req.body.catg,
      website: req.body.website,
      internetLocation: req.body.internetlocation,
      email: req.body.email,
      desc: req.body.info,
    };

    // Get the custom field names and values from the request body
    const customFields = Object.keys(req.body).filter(key => key.startsWith('customName'));
    customFields.forEach(field => {
      const index = field.slice(10); // Extract the index from the field name
      const fieldName = req.body[`customName${index}`];
      const fieldValue = req.body[`customValue${index}`];
      companyData[fieldName] = fieldValue;
    });

    const company = new Company(companyData);

    company.save()
      .then(() => {
        console.log('Character saved!');
        res.redirect('/');
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('An error occurred');
      });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.get('/catgs', async (req, res) => {
    const catgs = await Catg.find()
    const Footer = await Color.findOne({name: 'Footer'})
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find()
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('catgs', {DocumentsCount, Footer, catgs, tags, user: req.user, texts, headingColor1, headingColor2, headingColor3, btnColor})
})

app.get('/catgs/:id', async (req, res) => {
  try {
    const catgId = req.params.id;
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount
    const Footer = await Color.findOne({name: 'Footer'})
    const catg = await Catg.findById(catgId);
    const characters = await Character.find({ catg: catg.title })
    const companies = await Company.find({ catg: catg.title });
    console.log(characters, companies)
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const texts = await Text.find({})
    const tags = await Tag.find({})

    res.render('catg-details', {DocumentsCount, Footer, catg, characters, companies, user: req.user, btnColor, headingColor1, headingColor2, headingColor3, texts, tags });
  } catch (err) {
    console.error("error: " + err);
  }
});

app.get('/addcatg', async (req, res) => {
    const texts = await Text.find({})
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find()
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const catgCount = await Catg.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('admin/addcatg', {DocumentsCount, Footer, user: req.user, texts, headingColor1, headingColor2, headingColor3, btnColor, tags, characterCount, companyCount, catgCount})
})

app.post('/addcatg', async (req, res) => {
  try {
    await uploadPromise(req, res);

    const data = fs.readFileSync(req.file.path);
    const imageBuffer = Buffer.from(data);

    const catg = new Catg({
      image: imageBuffer.toString('base64'),
      title: req.body.title,
    });

    catg.save()
      .then(() => {
        console.log('Catg Saved ^-^');
        res.redirect('/');
      })
      .catch((err) => {
        console.error('error: ' + err);
        res.redirect('/catgs');
      });
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.post('/deleteCharacter', async (req, res) => {
    Character.findOneAndDelete({firstName: req.body.character})
    .then(() => {
        console.log('character deleted |_^-^_|')
        res.redirect('/admin/tables/')
    })
    .catch((err) => {
        console.error('error: ' + err)
    })
})

app.post('/deleteCompany', (req, res) => {
    Company.findOneAndDelete({arabicName: req.body.company})
    .then(() => {
        console.log('company deleted |_^-^_|')
        res.redirect('/admin/tables/')
    })
    .catch((err) => {
        console.error('error: ' + err)
    })
})

app.post('/deleteCatgs', async (req, res) => {
    try {
        await Catg.findOneAndDelete({title: req.body.catg}).then(() => {console.log('Catg Deleted |_^-^_|')})
        await Character.deleteMany({catg: req.body.catg}).then(() => {console.log(' Characters Deleted |_^-^_| ')})
        await Company.deleteMany({catg: req.body.catg}).then(() => {console.log(' Company Deleted |_^-^_| ')})
        res.redirect('/admin/tables')
    } catch (error) {
        console.error(error)
    }
})

app.post('/updateCharacter', async (req, res) => {
    try {
      const catgs = await Catg.find({});
      const character = await Character.find({ firstName: req.body.character });
      const countries = await Country.find()
      const characterCount = await Character.countDocuments()
      const companyCount = await Company.countDocuments()
      const catgCount = await Catg.countDocuments()

      res.render('admin/updatecharacterform', { characterCount, companyCount, catgCount, character: character[0], catgs, countries });
    } catch (err) {
      console.error(err);
    }
});

app.post('/updateCompany', async (req, res) => {
    try {
      const catgs = await Catg.find({});
      const company = await Company.find({ englishName: req.body.company });
      console.log('company')
      const characterCount = await Character.countDocuments()
      const companyCount = await Company.countDocuments()
      const catgCount = await Catg.countDocuments()
      const countries = await Country.find({})
  
      res.render('admin/updatecompanyform', {countries, characterCount, companyCount, catgCount, company: company[0], catgs });
    } catch (err) {
      console.error(err);
    }
});

app.post('/updateCatgs', async (req, res) => {
    try {
      const catgs = await Catg.find({});
      const catg = await Catg.find({ title: req.body.catg });
      const characterCount = await Character.countDocuments()
      const companyCount = await Company.countDocuments()
      const catgCount = await Catg.countDocuments()
      res.render('admin/updatecatgform', { characterCount, companyCount, catgCount, catg: catg[0], catgs });
    } catch (err) {
      console.error(err);
    }
});

app.post('/characterUpdate', async (req, res) => {
  try {
    await uploadPromise(req, res);

    const characterName = req.body.name;

    const updateFields = {
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      nickName: req.body.nickname,
      nationality: req.body.nationality,
      birthday: req.body.birthday,
      dieday: req.body.dieday,
      job: req.body.job,
      type: req.body.type,
      desc: req.body.desc,
      historicalPeriod: req.body.historicalPeriod,
      catg: req.body.catg,
    };

    if (req.file) {
      const data = fs.readFileSync(req.file.path);
      const imageBuffer = Buffer.from(data);

      updateFields.image = imageBuffer.toString('base64');
    }

    const updatedCharacter = await Character.findOneAndUpdate(
      { englishName: characterName },
      updateFields,
      { new: true }
    );

    res.send('Character updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.post('/companyUpdate', async (req, res) => {
  try {
    await uploadPromise(req, res);

    const companyName = req.body.name;

    const updateFields = {
      arabicName: req.body.arabName,
      englishName: req.body.englName,
      country: req.body.country,
      mainBranch: req.body.mainbranch,
      code: req.body.code,
      catg: req.body.catg,
      phoneNumber: req.body.phonenumber,
      desc: req.body.desc,
      website: req.body.webiste,
      internetLocation: req.body.internetlocation,
      email: req.body.email,
    };

    if (req.file) {
      const data = fs.readFileSync(req.file.path);
      const imageBuffer = Buffer.from(data);

      updateFields.image = imageBuffer.toString('base64');
    }

    const updatedCompany = await Company.findOneAndUpdate(
      { englishName: companyName },
      updateFields,
      { new: true }
    );

    res.send('Company updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
});

app.post('/catgUpdate', async (req, res) => {
    try {
      await uploadPromise(req, res);
  
      const { name } = req.body;
      const updateFields = {
        title: req.body.title
      };
  
      if (req.file) {
        const data = fs.readFileSync(req.file.path);
        const imageBuffer = Buffer.from(data);
        updateFields.image = imageBuffer.toString('base64');
      }
  
      console.log(updateFields);
  
      const updatedCatg = await Catg.findOneAndUpdate(
        { title: name },
        updateFields,
        { new: true }
      );
  
      // Update company.catg and character.catg
      await Company.updateMany({ catg: name }, { catg: updatedCatg.title });
      await Character.updateMany({ catg: name }, { catg: updatedCatg.title });
  
      console.log(updatedCatg); // Check the updatedCatg object in the console
      res.send('Catg updated successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred');
    }
});

app.get('/addTag', async (req, res) => {
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const catgCount = await Catg.countDocuments()

    res.render('admin/addtag', {user: req.user, characterCount, companyCount, catgCount})
})

app.get('/tags/:id', async (req, res) => {
    try {
        const tagId = req.params.id
        const tag = await Tag.findOne({_id: tagId})
        const characters = await Character.find({catg: tag.title})
        const companies = await Company.find({catg: tag.title})
        const characterCount = await Character.countDocuments()
        const companyCount = await Company.countDocuments()
        const DocumentsCount = characterCount + companyCount
        const btnColor = await Color.findOne({name: 'btn-color'})
        const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
        const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
        const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
        const texts = await Text.find({})
        const Footer = await Color.findOne({name: 'Footer'})
        
        res.render('tag-details', {Footer, texts, headingColor1, headingColor2, headingColor3, btnColor, DocumentsCount, characters, companies, user: req.user, tag})
    } catch (error) {
        console.log(error)
    }
})

app.post('/addtag', (req, res) => {
    const tag = new Tag({
        title: req.body.tagName
    })

    tag.save()
    .then(() => {
        console.log("tag saved ! ^-^")
        res.redirect('/admin/tables')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.post('/deleteTag', (req, res) => {
    const tagName = req.body.tag

    Tag.findOneAndDelete({title: tagName})
    .then(() => {
        console.log('tag deleted ^-^')
        res.redirect('/admin/tables')
    })
    .catch((err) => {
        console.error(err)
    })
})

// Some Admin Panel Edits

app.get('/addCountry', async (req, res) => {
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const catgCount = await Catg.countDocuments()
    res.render('admin/addcountry', {characterCount, companyCount, catgCount})
})

app.post("/addCountry", (req, res) => {
    const countryName = req.body.title

    const newCountry = new Country({
        title: countryName
    })

    newCountry.save()
    .then(() => {
        console.log("Country Saved ! ^-^")
        res.redirect('/admin/tables')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.post('/characterVisits', async (req, res) => {
  const characterName = req.body.character;
  console.log(characterName)
  const foundCharacter = await Character.findOne({ firstName: characterName });
  const characterCount = await Character.countDocuments();
  const companyCount = await Company.countDocuments();
  const catgCount = await Catg.countDocuments();
  const characters = await Character.find({});
  const companies = await Company.find({});

  if (foundCharacter) {
    res.json({ character: foundCharacter.visits, characterCount, companyCount, catgCount, characters, companies });
  } else {
    res.json({ error: 'Character not found' });
  }
});

app.post('/companyVisits', async (req, res) => {
    const companyName = req.body.company
    const foundCompany = await Company.findOne({arabicName: companyName})
    const characterCount = await Character.countDocuments();
    const companyCount = await Company.countDocuments();
    const catgCount = await Catg.countDocuments();
    const characters = await Character.find({})
    const companies = await Company.find({})

    res.json({ company: foundCompany.visits, characterCount, companyCount, catgCount, characters, companies });
})

app.get('/admin', async (req, res) => {
    try {
        const characterCount = await Character.countDocuments();
        const companyCount = await Company.countDocuments();
        const catgCount = await Catg.countDocuments();
        const characters = await Character.find({});
        const companies = await Company.find({});
        const users = await User.find({}).sort({ _id: -1 }).limit(5);

        // Read and buffer the user images
        const userImages = await Promise.all(
            users.map(async (user) => {
                const imagePath = path.join('public', 'uploads', user.image);
                const imageBuffer = await fs.promises.readFile(imagePath);
                return imageBuffer.toString('base64');
            })
        );

        res.render('admin/Dashboard', {
            characterCount,
            companyCount,
            catgCount,
            characters,
            companies,
            users,
            userImages,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admin/tables', async (req, res) => {
    const charactercolumnNames = await Object.keys(characterSchema.paths).filter(key => key !== '_id' && key != 'image' && key != '__v');
    const characters = await Character.find()
    const companycolumnNames = await Object.keys(companySchema.paths).filter(key => key !== '_id' && key != 'image' && key != '__v');
    const companies = await Company.find()
    const catgcolumnNames = await Object.keys(catgSchema.paths).filter(key => key !== '_id' && key != 'image' && key != '__v');
    const catgs = await Catg.find()
    const users = await User.find({}).sort({ _id: -1 })
    const tags = await Tag.find({})
    const countries = await Country.find({})
    const characterCount = await Character.countDocuments();
    const companyCount = await Company.countDocuments();
    const catgCount = await Catg.countDocuments();

    const userImages = await Promise.all(
        users.map(async (user) => {
            const imagePath = path.join('public', 'uploads', user.image);
            const imageBuffer = await fs.promises.readFile(imagePath);
            return imageBuffer.toString('base64');
        })
    );

    res.render('admin/tables', {catgCount, characterCount, companyCount, characters, charactercolumnNames, companies, companycolumnNames, catgs, catgcolumnNames, users, userImages, tags, countries})
})

app.post('/deleteUser', (req, res) => {
  const userName = req.body.user

  User.findOneAndDelete({name: userName})
  .then(() => {
    console.log('user deleted! ^-^')
    res.redirect('/admin/tables')
  })
  .catch((err) => {
    console.error(err)
  })
})

app.post('/deleteCountry', (req, res) => {
    const countryName = req.body.country

    Country.findOneAndDelete({title: countryName})
    .then(() => {
        console.log('country deleted ^-^')
        res.redirect('/admin/tables')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.get('/admin/settings', async (req, res) => {
    const characterCount = await Character.countDocuments();
    const companyCount = await Company.countDocuments();
    const catgCount = await Catg.countDocuments();
    const texts = await Text.find()
    const colors = await Color.find()

    res.render('admin/settings', {characterCount, companyCount, catgCount, texts, colors})
})

app.post('/addText', (req, res) => {
    const textName = req.body.name
    const textValue = req.body.value

    const text = new Text({
        name: textName,
        value: textValue
    })

    text.save()
    .then(() => {
        console.log('text saved ^-^')
        res.redirect('/admin/settings')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.post('/addColor', (req, res) => {
    const colorName = req.body.name
    const colorValue = req.body.value

    const color = new Color({
        name: colorName,
        value: colorValue
    })

    color.save()
    .then(() => {
        console.log('color saved ^-^')
        res.redirect('/admin/settings')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.post('/updateText', (req, res) => {
    const textName = req.body.text
    const newText = req.body.name

    Text.findOneAndUpdate(
        {name: textName},
        {value: newText},
        {new: true}
    )
    .then(() => {
        console.log('text updated ^-^')
        res.redirect('/admin/settings')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.post('/updateColor', (req, res) => {
    const colorName = req.body.color
    const newColor = req.body.name

    Color.findOneAndUpdate(
        {name: colorName},
        {value: newColor},
        {new: true}
    )
    .then(() => {
        console.log('text updated ^-^')
        res.redirect('/admin/settings')
    })
    .catch((err) => {
        console.error(err)
    })
})

app.get('/about', async (req, res) => {
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const Footer = await Color.findOne({name: 'Footer'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('about', {Footer, DocumentsCount, user: req.user, headingColor1, headingColor2, headingColor3, btnColor, texts, tags})
})

app.get('/privacy', async (req, res) => {
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const Footer = await Color.findOne({name: 'Footer'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('privacy', {Footer, DocumentsCount, user: req.user, headingColor1, headingColor2, headingColor3, btnColor, texts, tags})
})

app.get('/characters', async (req, res) => {
    const texts = await Text.find({})
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const characters = await Character.find({})
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('characters', {DocumentsCount, Footer, characters, user: req.user, texts, btnColor, headingColor1, headingColor2, headingColor3, tags})
})

app.get('/companies', async (req, res) => {
    const texts = await Text.find({})
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const companies = await Company.find({})
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('companies', {DocumentsCount, Footer, user: req.user, texts, btnColor, headingColor1, headingColor2, headingColor3, tags, companies})
})

app.post('/downloadPDF', async (req, res) => {

    // Documents Count

    const charactersCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const catgCount = await Catg.countDocuments()
    const usersCount = await User.countDocuments()
    const countryCount = await Country.countDocuments()
    const tagCount = await Tag.countDocuments()
    const textCount = await Text.countDocuments()
    const colorCount = await Color.countDocuments()

    // All Documents In Tables

    const characters = await Character.find({})
    const companies = await Company.find({})
    const catgs = await Catg.find({})
    const countries = await Country.find({})
    const tags = await Tag.find({})
    const users = await User.find({})
    const texts = await Text.find({})
    const colors = await Color.find({})

    const filteredCharacters = characters.map((character) => {
        return ` \nFirst Name: ` + character.firstName +
        ` \nLast Name: ` + character.lastName +
        ` \nNick Name: ` + character.nickName +
        ` \nNationality: ` + character.nationality +
        ` \nBirthday` + character.birthday + 
        ` \nDieDay: ` + character.dieday +
        ` \nJob: ` + character.job + 
        ` \nType: ` + character.type +
        ` \nDesc: ` + character.desc +
        ` \nHistorical Period: ` + character.historicalPeriod +
        ` \nCatg: ` + character.catg +
        ` \nVisits: ` + character.visits;
    });
    const filteredCompanies = companies.map((company) => {
        return ` \nArabic Name: ` + company.arabicName +
        ` \nEnglish Name: ` + company.englishName +
        ` \nCountry: ` + company.country +
        ` \nMain Branch: ` + company.mainBranch +
        ` \nCatg: ` + company.catg +
        ` \nPhone Number: ` + company.phoneNumber +
        ` \nCode: ` + company.code +
        ` \nWebsite: ` + company.website +
        ` \nInternet Location: ` + company.internetLocation +
        ` \nEmail: ` + company.email +
        ` \nDesc: ` + company.desc +
        ` \nVisits: `+ company.visits;
    });
    const filteredCatgs = catgs.map((catg) => {
        return ` \nTitle: ` + catg.title
    });
    const filteredUsers = users.map((user) => {
        return ` \nName: ` + user.name + 
        ` \nEmail: ` + user.email
    });

    const data =`Count Of The Documents: \n\n` +
                `\nCharacters: ${charactersCount}` +
                `\nCompanies: ${companyCount}` +
                `\nCatgs: ${catgCount}` +
                `\nTags: ${tagCount}` +
                `\nCountries: ${countryCount}` +
                `\nUsers: ${usersCount}` +
                `\nTexts: ${textCount}` +
                `\nColors: ${colorCount}\n\n` +
                `All Database Data \n\n` +
                `\nCharacters: ${JSON.stringify(filteredCharacters)}\n` +
                `\nCompanies: ${JSON.stringify(filteredCompanies)}\n` +
                `\nCatgs: ${JSON.stringify(filteredCatgs)}\n` +
                `\nUsers: ${JSON.stringify(filteredUsers)}\n` +
                `\nTags: ${JSON.stringify(tags)}\n` +
                `\nCountries: ${JSON.stringify(countries)}\n` +
                `\nTexts: ${JSON.stringify(texts)}\n` +
                `\nColors: ${JSON.stringify(colors)}\n`;

    const timestamp = Date.now(); // Generate a unique timestamp
    const fileName = `data_${timestamp}.txt`; // Generate a unique filename

    const filePath = path.join(__dirname, 'public/adminFiles/', fileName);

    fs.writeFileSync(filePath, data);

    res.download(filePath, (err) => {
        if (err) {
        console.error('Error downloading file:', err);
        } else {
        // File downloaded successfully, delete the file
        fs.unlink(filePath, (err) => {
            if (err) {
            console.error('Error deleting file:', err);
            } else {
            console.log('File deleted successfully');
            }
        });
        }
    });
})

// Auth Routes

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view this page');
  res.redirect('/login');
}

// Register Page
app.get('/register', async (req, res) => {
  const errors = []; // Define an empty errors array
  const texts = await Text.find({})
  const Footer = await Color.findOne({name: 'Footer'})
  const btnColor = await Color.findOne({name: 'btn-color'})
  const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
  const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
  const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
  const tags = await Tag.find({}).sort({visits: -1}).limit(5)

  res.render('register', {
    errors: errors, // Pass the errors variable to the template
    name: "", // Set an empty value for the name variable
    email: "", // Set an empty value for the email variable
    user: req.user,
    btnColor,
    texts,
    Footer,
    headingColor1,
    headingColor2,
    headingColor3,
    tags
  });
});

// Register Handle
app.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !confirmPassword) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== confirmPassword) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      confirmPassword
    });
  } else {
    // Validation passed
    User.findOne({ email: email })
      .then(user => {
        if (user) {
          // User exists
          errors.push({ msg: 'Email is already registered' });
          res.render('register', {
            errors,
            name,
            email,
            password,
            confirmPassword
          });
        } else {
          // Create new user
          const newUser = new User({
            name,
            email,
            password
          });

          // Hash password
          bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              // Set password to hashed
              newUser.password = hash;
              // Save user
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'You are now registered and can log in');
                  res.redirect('/login');
                })
                .catch(err => console.log(err));
            })
          );
        }
      });
  }
});

// Login Page
app.get('/login', async (req, res) => {
    const texts = await Text.find({})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const Footer = await Color.findOne({name: 'Footer'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    
    res.render('login', { 
        error_msg: req.flash('error_msg'),
        user: req.user,
        texts,
        btnColor,
        headingColor1,
        headingColor2,
        headingColor3,
        tags,
        Footer
    });
});

// Login Handle
app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Profile Page
app.get('/profile', ensureAuthenticated, async (req, res) => {
    const texts = await Text.find({})
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('profile', {
        DocumentsCount,
        user: req.user,
        texts,
        Footer,
        btnColor,
        headingColor1,
        headingColor2, 
        headingColor3,
        tags
    });
});

// Edit Profile Page
app.get('/profile/edit', ensureAuthenticated, async (req, res) => {
    const texts = await Text.find({})
    const Footer = await Color.findOne({name: 'Footer'})
    const btnColor = await Color.findOne({name: 'btn-color'})
    const headingColor1 = await Color.findOne({name: 'Heading-Back-Color1'})
    const headingColor2 = await Color.findOne({name: 'Heading-Back-Color2'})
    const headingColor3 = await Color.findOne({name: 'Heading-Back-Color3'})
    const tags = await Tag.find({}).sort({visits: -1}).limit(5)
    const characterCount = await Character.countDocuments()
    const companyCount = await Company.countDocuments()
    const DocumentsCount = characterCount + companyCount

    res.render('edit-profile', {
        DocumentsCount,
        user: req.user,
        Footer,
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        texts,
        btnColor,
        headingColor1,
        headingColor2, 
        headingColor3,
        tags
    });
});

// Edit Profile Handle
app.post('/profile/edit', ensureAuthenticated, (req, res) => {
  uploadPromise(req, res)
    .then(() => {
      const { name } = req.body;
      const userId = req.user._id;

      return User.findByIdAndUpdate(userId, { name, image: req.file.filename }, { new: true });
    })
    .then(user => {
      req.flash('success_msg', 'Profile updated successfully');
      res.redirect('/profile');
    })
    .catch(err => {
      req.flash('error_msg', err);
      res.redirect('/profile/edit');
    });
});

// Logout Handle
app.get('/logout', (req, res) => {
  res.render('logout')
})
app.post('/logout', (req, res, next) => {
  req.logout(function (err) {
    if(err) {
      return next(err)
    }
    res.redirect('/')
  })
})

app.listen(3000, () => {
    console.log('App Is Running On Port 3000')
})