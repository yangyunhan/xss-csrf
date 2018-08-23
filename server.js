//当用户登录时，返回一个标识cookie
let express = require('express')
let app = express()
let path = require('path')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let svgCaptcha = require('svg-captcha')
app.use(bodyParser.urlencoded({ extended: true }))//a=1&b=2
app.use(cookieParser())//req.cookie['']
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname)))
let userList = [{ username: 'zfpx', password: 'zfpx', money: 10000 }, { username: 'jw', password: 'jw', money: 20 }]
let SESSION_ID = 'connect.sid'
let session = {}
app.post('/api/login', function (req, res) {
    let { username, password } = req.body;
    let user = userList.find(user => (user.username === username) && (user.password === password)
    )
    if (user) {
        //服务器需要在登录后给一个信息 卡号：110
        let cardId = Math.random() + Date.now()
        session[cardId] = { user }
        res.cookie(SESSION_ID, cardId, { httpOnly: true })//{110:{user: {username: 'zfpx', password:'zfpx'}}}
        res.json({ code: 0 })
    } else {
        res.json({ code: 1, error: '用户不存在' })
    }
})
//反射型 http://localhost:3000/welcome?type=<script>document.cookie</script>
//chrome发现路径存在异常，会有xss屏蔽功能
//一般情况下，httpOnly会让前端不可以获取，但是并不是解决方案，只是降低受损的范围
//诱导用户自己点开（一次性）
//查询参数可以加上encodeURIComponent方式解决
app.get('/welcome', function (req, res) {
    res.send(`${encodeURIComponent(req.query.type)}`)
})
//用户评论信息
let comments = [{ username: 'zfpx', content: 'afjodigjo' }, { username: 'zs', content: 'dafiuhg' }]
app.get('/api/list', function (req, res) {
    res.json({ code: 0, comments })
})
app.post('/api/addComment', function (req, res) {
    //当你访问添加留言时，执行到这里
    let r = session[req.cookies[SESSION_ID]] || {}//{user:{username: ,password:}}
    let user = r.user
    if (user) {
        comments.push({ username: user.username, content: req.body.content })
        res.json({ code: 0 })
    } else {
        res.json({ code: 1, error: '用户未登录' })
    }
})
app.get('/api/userinfo', function (req, res) {
    let r = session[req.cookies[SESSION_ID]] || {}
    //data表示的是svg内容，text表示的是对应的结果
    let { data, text } = svgCaptcha.create()
    r.text = text;// 下次请求时应该拿到返回的结果和上次存好的结果做对比
    let user = r.user
    if (user) {
        res.json({ 
            code: 0, 
            user: { 
                username: user.username, 
                money: user.money, 
                svg: data 
            } })
    } else {
        res.json({ code: 1, error: '用户未登录' })
    }
})
app.post('/api/transfer', function (req, res) {
    let r = session[req.cookies[SESSION_ID]] || {}
    let user = r.user

    //不靠谱，可以通过node自己发请求来伪造
    let referer = req.headers['referer'] || ''
    if (referer.includes('http://localhost:3000')) {
        if (user) {
            let { target, money, code, token } = req.body
            if (('my_' + req.cookies[SESSION_ID]) === token) {
                if (code && code === r.text) {
                    money = Number(money)
                    userList.forEach(u => {
                        if (u.username === user.username) {
                            u.money -= money
                        }
                        if (u.username === target) {
                            u.money += money
                        }
                    })
                    res.json({ code: 0 })
                } else {
                    res.json({ code: 1, error: '验证码不正确' })
                }
            } else {
                res.json({code:1, error:'没有token'})
            }
        } else {
            res.json({ code: 1, error: '用户未登录' })
        }
    } else {
        res.json({ code: 1, error: '被人攻击了' })
    }
})
//xss存储型，恶意的代码存储到服务器上，所有人访问时都会造成攻击，比反射型和DOM-based 范围更大
app.listen(3000)
//跨站请求伪造 钓鱼网站
//给他吸引它的网站

