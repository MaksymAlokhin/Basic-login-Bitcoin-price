const express = require('express');
const http = require('http');
const bcrypt = require('bcrypt');
const path = require("path");
const bodyParser = require('body-parser');
users = require('./data').userDB;
const fs = require('fs');
const https = require('https');
const cookie_parser = require('cookie-parser');


const app = express(); const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './public')));
app.use(cookie_parser('L_ic(3Fk#'));


const btcOptions = {
    host: 'blockchain.info',
    path: '/ticker',
    port: 443,
    method: 'GET'
};
const testOptions = {
    host: 'developer.mozilla.org',
    path: '/en-US/docs/Web/HTML',
    port: 443,
    method: 'GET'
};
const rateOptions = {
    host: 'myfin.us',
    path: '/currency-converter/usd-uah',
    port: 443,
    method: 'GET'
};

async function readData() {
    var get1 = await httprequest(btcOptions);
    var get2 = await httprequest(rateOptions);
    var result = [];

    var btcData = JSON.parse(get1)
    for (let x in btcData) {
        if (x == 'USD') {
            bitcoinUSD = btcData[x].sell;
            console.log("USD:", bitcoinUSD.toFixed(2))
        }
    }

    var myRe = /<span>1 USD =<\/span><span> (\d+\.\d+) UAH<\/span>/g;
    var rateUSDUAH = parseFloat(myRe.exec(get2)[1]);
    console.log("Rate: ", rateUSDUAH.toFixed(2));
    var uah = bitcoinUSD * rateUSDUAH;
    usd = parseFloat(bitcoinUSD.toFixed(2)).toLocaleString('en');
    rate = parseFloat(rateUSDUAH.toFixed(2)).toLocaleString('en');
    uah = parseFloat(uah.toFixed(2)).toLocaleString('en');
    console.log("UAH:", uah);

    result.push(usd, rate, uah);
    return result;
}



function httprequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            var body = [];
            res.on('data', function (chunk) {
                body.push(chunk);
            });
            res.on('end', function () {
                try {
                    body = Buffer.concat(body).toString()
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        req.on('error', (e) => {
            reject(e.message);
        });
        req.end();
    });
}


app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, './public/user/login.html'));
    res.redirect('/user/login.html');
});

app.get('/user/logout', (req, res) => {
    res.clearCookie('btcUserToken');
    res.redirect('/user/login.html');
});

app.get('/btcRate', (req, res) => {
    loadUsers();
    let foundUser = users.find((data) => req.signedCookies.btcUserToken === data.email);
    if (foundUser) {
        readData().then(function (result) {
            res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">
    <title>Index</title>
    <style>
        a {
            font-size: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-md-center">
            <div class="card" style="width: 25rem;">
                <img src="https://bitcoin.org/img/icons/logotop.svg?1621851118" class="img-responsive mx-2 my-2 " alt="...">
                <div class="card-body">
                    <h5 class="card-title">Bitcoin information</h5>
                    <p class="card-text">Current prices:</p>
                </div>
                <div class="card-body">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <td>Price in USD:</td>
                                <td>$ ${result[0]}</td>
                            </tr>
                            <tr>
                                <td>UAH/USD Exchange rate:</td>
                                <td>${result[1]}</td>
                            </tr>
                            <tr>
                                <td>Price in UAH:</td>
                                <td>${result[2]} &#x20b4;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="card-body">
                    <a href="/user/logout" class="btn btn-primary">Logout</a>
                </div>
            </div>
        </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-Piv4xVNRyMGpqkS2by6br4gNJ7DXjqk09RmUpJ8jgGtD7zP9yug3goQfGII0yAns" crossorigin="anonymous"></script>
</body>
</html>`);
            //res.send(`<div align ='center'><h2>BITCOIN INFORMATION</h2></div><br><br><br><div align ='center'><h3>Price in USD: ${result[0]} $</h3><h3>UAH/USD Exchange rate: ${result[1]}</h3><h3>Price in UAH: ${result[2]} \u20B4</h3></div><br><div align='center'><a href='/user/logout'>Logout</a></div>`);
        })
    }
    else {
        //Wrong info, user asked to authenticate again
        res.setHeader("WWW-Authenticate", "Basic");
        //res.sendStatus(401);
        res.redirect('/user/login.html')
    }
});

const storeData = (data, path) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data))
    } catch (err) {
        console.error(err)
    }
}

const loadData = (path) => {
    try {
        data = JSON.parse(fs.readFileSync(path, 'utf8'));
        console.log('loaded data', data);
        return data;
    } catch (err) {
        console.log('Could not read file', path);
    }
}

app.post('/user/create', async (req, res) => {
    loadUsers();

    try {
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {

            let hashPassword = await bcrypt.hash(req.body.password, 10);

            let newUser = {
                email: req.body.email,
                password: hashPassword,
            };
            users.push(newUser);
            console.log('User list', users);

            storeData(users, './userDB.json');
            res.send(successReg);
            //res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./create.html'>Register another user</a></div>");
        } else {
            res.send(emailUsed);
            //res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./create.html'>Register again</a></div>");
        }
    } catch {
        res.send("Internal server error");
    }
});

app.post('/user/login', async (req, res) => {
    loadUsers();
    try {
        let cookie_Stuff = req.signedCookies.btcUserToken
        if (!cookie_Stuff) { //no cookie
            let foundUser = users.find((data) => req.body.email === data.email);
            if (foundUser) {

                let submittedPass = req.body.password;
                let storedPass = foundUser.password;

                const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
                if (passwordMatch) {
                    let usrname = foundUser.email;
                    res.cookie('btcUserToken', usrname, { signed: true })
                    res.redirect('/btcRate');
                    //res.send(`<div align ='center'><h2>Login successful</h2></div><br><br><br><div align ='center'><h3>Hello, ${usrname} </h3></div><br><div align='center'><a href='/btcRate'>Bitcoin Price Info</a></div><br><div align='center'><a href='/user/logout'>Logout</a></div>`);

                } else {
                    res.send(wrongPass);
                    //res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
                }
            }
            else {

                let fakePass = `fake`;
                await bcrypt.compare(req.body.password, fakePass);
                res.setHeader("WWW-Authenticate", "Basic");
                res.send(wrongPass);
                //res.sendStatus(401);
                //res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
            }        }
        else {//Signed cookie already stored
            let foundUser = users.find((data) => req.signedCookies.btcUserToken === data.email);
            if (foundUser) {
                res.redirect('/btcRate');
                //let usrname = foundUser.email;
                //res.send(`<div align ='center'><h2>Login successful</h2></div><br><br><br><div align ='center'><h3>Hello, ${usrname} </h3></div><br><div align='center'><a href='/btcRate'>Bitcoin Price Info</a></div><br><div align='center'><a href='/user/logout'>Logout</a></div>`);
            }
            else {
                //Wrong info, user asked to authenticate again
                res.setHeader("WWW-Authenticate", "Basic");
                res.send(wrongPass);
                //res.sendStatus(401);
                //res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
            }
        }
    } catch {
        res.send("Internal server error");
    }
});

function loadUsers() {
    try {
        if (fs.existsSync('./userDB.json')) {
            users = loadData('./userDB.json')
        }
    } catch (err) {
        console.error(err);
        users = [];
    }
}

var wrongPass = `<!DOCTYPE html>
<html lang = "en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">
    <title>Index</title>
    <style>
        a {
            font-size: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-md-center">
            <div class="card text-white bg-danger mb-3" style="max-width: 18rem;">
                <div class="card-header">Error!</div>
                <div class="card-body">
                    <h5 class="card-title">Invalid login or password</h5>
                    <p class="card-text">Please, try again...</p>
                </div>
                <div class="card-footer">
                    <a href="/user/login.html" class="btn btn-light">Login</a>
                    <a href="/user/create.html" class="btn btn-light">Register</a>
                </div>
            </div>
        </div>
    </div>
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-Piv4xVNRyMGpqkS2by6br4gNJ7DXjqk09RmUpJ8jgGtD7zP9yug3goQfGII0yAns" crossorigin="anonymous"></script>
</body>
</html>`;

var emailUsed = `<!DOCTYPE html>
<html lang = "en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">
    <title>Index</title>
    <style>
        a {
            font-size: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-md-center">
            <div class="card text-white bg-danger mb-3" style="max-width: 18rem;">
                <div class="card-header">Error!</div>
                <div class="card-body">
                    <h5 class="card-title">Email already used</h5>
                    <p class="card-text">Please, try again...</p>
                </div>
                <div class="card-footer">
                    <a href="/user/create.html" class="btn btn-light">Register</a>
                </div>
            </div>
        </div>
    </div>
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-Piv4xVNRyMGpqkS2by6br4gNJ7DXjqk09RmUpJ8jgGtD7zP9yug3goQfGII0yAns" crossorigin="anonymous"></script>
</body>
</html>`;

var successReg = `<!DOCTYPE html>
<html lang = "en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">
    <title>Index</title>
    <style>
        a {
            font-size: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-md-center">
            <div class="card text-white bg-success mb-3" style="max-width: 18rem;">
                <div class="card-header">Success!</div>
                <div class="card-body">
                    <h5 class="card-title">Registration successful</h5>
                    <p class="card-text">Please, login...</p>
                </div>
                <div class="card-footer">
                    <a href="/user/login.html" class="btn btn-light">Login</a>
                </div>
            </div>
        </div>
    </div>
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-Piv4xVNRyMGpqkS2by6br4gNJ7DXjqk09RmUpJ8jgGtD7zP9yug3goQfGII0yAns" crossorigin="anonymous"></script>
</body>
</html>`;

server.listen(3000, function () {
    console.log("server is listening on port: 3000");
});
