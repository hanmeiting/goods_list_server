const Koa = require('koa')
const KoaRouter = require('koa-router')
const KoaStaticCache = require('koa-static-cache')
// const nunjucks = require('nunjucks')
const mysql2 = require('mysql2');
var bodyParser = require('koa-bodyparser');
var jwt = require('koa-jwt');
var jsonwebtoken = require('jsonwebtoken');
const app = new Koa()
app.use(bodyParser());

const secret = 'hanting'
app.use(jwt({
  secret
}).unless({
  path: [/^\/login/, /^\/register/]
}));
const router = new KoaRouter()

const connection = mysql2.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'goodsList'
});
const success = {
  code: 0,
  message: 'success'
}

// 添加用户
router.post('/register', async ctx => {
  const {
    username,
    password,
    avatar = ''
  } = ctx.request.body

  const queryRes = await query('SELECT * FROM `users` where name=' + `"${username}"`)
  if (queryRes && queryRes.length) {
    ctx.body = {
      code: 200,
      message: '用户名已存在'
    }
    return
  }

  const res = await query('INSERT INTO `users` (`name`,`password`,`avatar`) VALUES (?,?,?)', [username, password, avatar])
  ctx.body = {
    ...success
  }
})
// 登录
router.post('/login', async ctx => {
  const {
    username,
    password
  } = ctx.request.body



  const user = await query('SELECT * FROM `users` where name=' + `"${username}"` + 'and password=' + `"${password}"`)
  if (user && user.length === 0) {
    ctx.body = {
      code: 200,
      message: '用户名或者密码错误'
    }
    return
  }
  const payload = {
    ...user
  }
  ctx.set('Authorization', jsonwebtoken.sign(payload, secret));
  ctx.cookies.set('token', jsonwebtoken.sign(payload, secret), {
    httpOnly: false
  })
  ctx.body = {
    ...success
  }
})

// 获取类型接口
router.get('/categroies', async ctx => {
  let list = {
    ...success,
    data: []
  }

  // 数据查询是异步的
  const res = await query('SELECT * FROM `categroies`')
  list.data = res
  ctx.body = list
})
// 列表数据接口
router.get('/items', async ctx => {
  const items = {
    ...success,
    data: {}
  }
  const res = await query('SELECT * FROM `items`')
  items.data.elements = res
  ctx.body = items
})









app.use(router.routes())
app.listen(8999, () => {
  console.log('启动了8999端口');
})

function query(sql, prePared) {
  return new Promise((resolve, reject) => {
    connection.query(
      sql, prePared,
      function (err, results, fields) {
        if (err) {
          reject(err)
        } else {
          resolve(results)
        }
      }
    );
  })
}