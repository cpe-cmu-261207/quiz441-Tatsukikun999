import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"



interface JWTPayload {
  username: string;
  password: string;
}

app.post<any, any, LoginArgs>('/login',
  (req, res) => {

  const body = req.body
  const db = readDbFile()
  const user = db.users.find(user => user.username === body.username)
  if (!user) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  if (!bcrypt.compareSync(body.password, user.password)) {
    res.status(400)
    res.json({ message: 'Invalid username or password' })
    return
  }
  const token = jwt.sign(
    { id: user.id, username: user.username } as JWTPayload, 
    SECRET_KEY
  )
  res.json({ token })
})


app.post('/register',
  (req, res) => {

    const { username, password, firstname, lastname, balance } = req.body
    try{
      req.create({username,password,firstname,lastname,balance})
      res.json({message: "Register successfully"})
    }catch(error){
      res.status(400).json({message: "Username is already in used"});
    }
  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      res.status(200).json({"name": username},{"balance": token})
    }
    catch (e) {
      //response in case of invalid token
      res.status(401).json({message: "Invalid Token"})
    }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {
    
    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      res.status(400).json({message: "Invalid data" })
    else if(!validationResult(req).isString()){
      res.status(401).json({message: "Invalid token"})
    }
    else{
      req.balance += req.amount
      res.status(200).json({message: "Deposit successfully"},
      {deposit: req.balance})
    }

  })

app.post('/withdraw',
  (req, res) => {
    if (!validationResult(req).isEmpty())
      res.status(400).json({message: "Invalid data" })
    else if(!validationResult(req).isString()){
      res.status(401).json({message: "Invalid token"})
    }
    else{
      req.balance -= req.amount
      res.status(200).json({message: "Withdraw successfully"},
      {balance: req.balance})
    }

  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  
  const id = Number(req.params.id)
  const token = req.query.token as string

  console.log(id)

  try {
    const data = jwt.verify(token, SECRET_KEY) as JWTPayload
    const db = readDbFile()
    const todos = db.todos[data.username] || []

    if (!todos.find(todo => todo.id === id)) {
      res.status(404)
      res.json({
        message: 'This todo not found'
      })
      return
    }

    const newTodos = todos.filter(todo => todo.id !== id)
    db.todos[data.username] = newTodos
    fs.writeFileSync('db.json', JSON.stringify(db))

    res.json({
      message: 'Deleted todo'
    })

  } catch(e) {
    res.status(401)
    res.json({ message: e.message })
  }
})
})

app.get('/me', (req, res) => {
  const {firstname,lastname,code,gpa} = req.body
  req.create({firstname,lastname,code,gpa})
  res.status(200).json({firstname: Traiphob},{lastname: Srimanee},{code: 620610788},{gpa:2.91})
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))
