//Importing needed files and modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const CsvFile = require('./models/csvFile');
const fs = require('fs');
const methodOverride = require('method-override');
const { findById, findByIdAndUpdate } = require('./models/csvFile');

//setting up app and setting permission to true
const permission = true; // used for dummy authentication
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

//connecting mongoose to local MongoDB server
mongoose.connect('mongodb://localhost:27017/csv-upload');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Data Base Connected to App JS Csv-uplosd  !!!');
});

//filling the database with the contents of the CSV file
const fillDB = async (csvFileName) => {
    fs.createReadStream(`./csvUpload/${csvFileName}`)
        .pipe(csv())
        .on('data', async (row) => {
            const userName = row.Name;
            const userProfession = row.Profession;
            const userCity = row.City;
            await CsvFile.deleteMany({});
            const csvRow = new CsvFile({
                name: userName,
                profession: userProfession,
                city: userCity 
            });
            await csvRow.save();
        })
        .on('end', () => {
            console.log('Csv File Contents stored in MongoDB');
        })
}

//Deleting the csv file once the contents have been stored in Database
const deleteCsv = (csvFileName) => {
    fs.unlinkSync(`./csvUpload/${csvFileName}`, (err) => {
        if(err) {
            console.log('Error in deletion');
        }
    });
} 

//Defining Storage for the CSV file
const csvStorage = multer.diskStorage({
    destination : 'csvUpload',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

//passing storage and filefilter
const csvUpload = multer({
    storage: csvStorage,
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(csv)$/)) {
            return new Error('Please Upload CSV file');
        }
        cb(undefined, true);
    }
})

//middleware for /upload
app.use('/upload', (req, res, next) => {
    if(permission === true) {
        next();
    } else {
        res.redirect('/');
        next();
    }
})

//upload csv file
app.post('/upload', csvUpload.single('myCsvFile'), (req, res, next) => {
    console.log(req.file.originalname + ' Uploaded Successfully');
    fillDB(req.file.originalname).then(() => {
        deleteCsv(req.file.originalname);
    })
    res.redirect('/successUpload');
});

//success page after uploading
app.get('/successUpload', (req, res, next) => {
    res.render('pages/successUpload');
});

//middleware for /csvContent
app.use('/csvContent', (req, res, next) => {
    if(permission === true) {
        next();
    } else {
        res.redirect('/');
        next();
    }
})

app.get('/csvContent', async (req, res, next) => {
    const content = await CsvFile.find({});
    res.render('pages/allContent', {content});
});

//middleware for /newRow
app.use('/newRow', (req, res, next) => {
    if(permission === true) {
        next();
    } else {
        res.redirect('/');
        next();
    }
});

app.get('/newRow', (req, res, next) => {
    res.render('pages/newRow');
});

app.post('/newRow', async (req, res, next) => {
    const row = new CsvFile(req.body.row);
    await row.save();
    res.redirect('/csvContent');
})

//middleware for /csvRow/:id
app.use('/csvRow/:id', (req, res, next) => {
    if(permission === true) {
        next();
    } else {
        res.redirect('/');
    }
})

app.get('/csvRow/:id', async (req, res, next) => {
    const id = req.params.id;
    const row = await CsvFile.findById(id);
    res.render('pages/rowContent', {row});
});

//middleware for 'deleteRow/:id
app.use('/deleteRow/:id', (req, res, next) => {
    if(permission === true) {
        next();
    } else {
        res.redirect('/');
        next();
    }
});

app.delete('/deleteRow/:id', async (req, res, next) => {
    await CsvFile.findByIdAndDelete(req.params.id);
    res.redirect('/csvContent');
});

//middleware for /update/:id
app.use('/update/:id', (req, res, next) => {
    if(permission === true) {
        next();
    } else {
        res.redirect('/');
        next();
    }
})

app.get('/update/:id', async (req, res, next) => {
    const row = await CsvFile.findById(req.params.id);
    res.render('pages/updateRow', {row});
})

app.patch('/update/:id', async (req, res, next) => {
    const newName = req.body.name;
    const newCity = req.body.city;
    const newProfession = req.body.profession;
    await CsvFile.findByIdAndUpdate(req.params.id, {
        name: newName,
        city: newCity,
        profession: newProfession
    });
    res.redirect(`/csvRow/${req.params.id}`);
})

//get the homepage
app.get('/', (req, res, next) => {
    res.render('pages/upload');
});

//starting the server.
const startServer = app.listen(process.env.PORT || 3000, () => {
    console.log('Listening to ', process.env.PORT || 3000);
});