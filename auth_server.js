const express = require('express');
const app = express()
const http = require('http');
var server=http.createServer(app);
var mysql = require('mysql');
const bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "6IctGip2023",
    database:"gip",
    multipleStatements:true
  });
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
})
//app.use(express.static('/votez/'));
setInterval(() => {
  con.query("SELECT 1;", function (err, result) {
    if (err) console.log(err);
    else console.log("SELECT 1")
  });
}, 3600000);
app.post("/authenticate", function(req,res){
    let datum = new Date().getTime()
    con.query("SELECT * FROM beurten WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>0 AND activeDate<="+datum+";", function(err,result){
        if(err){
            console.log(err)
            res.sendStatus(400)
        }
        else if(result.length) res.send({result:1, message:"OK"})
        else res.send({result:0, message:"Verkeerde gebruikersnaam of wachtwoord."})
    })
})
app.post("/authorize", function(req,res){
    let datum = new Date().getTime()
    console.log(datum)
    con.query("SELECT * FROM beurten WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>0 AND activeDate<="+datum+";", function(err,result){
        if(err){
            console.log(err)
            res.sendStatus(400)
        }
        else if(result.length) {
            var duratief = result[0].time
            con.query("UPDATE beurten SET devices=devices-1, loginDate="+datum+" WHERE username="+JSON.stringify(req.body.username)+" AND (password=SHA2("+JSON.stringify(req.body.password)+",512) OR password="+JSON.stringify(req.body.password)+") AND devices>0 AND activeDate<="+datum+";", function(err,result){
                if(err){
                    console.log(err)
                    res.send(400)
                }
                else res.send({"access_duration":duratief+"H","access_level":"ALL","sponsor":0,"unregdate":"2030-01-01","category":"default"})
            })
        }
        else res.send(400)
    })
})
server.listen(8000, ()=>{
  console.log("luisteren ")
})