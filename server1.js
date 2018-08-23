//当用户登录时，返回一个标识cookie
let express = require('express')
let app = express()
let path = require('path')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({ extended: true }))//a=1&b=2
app.use(cookieParser())//req.cookie['']
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname)))

app.listen(3001)