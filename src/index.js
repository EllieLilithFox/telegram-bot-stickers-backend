require('dotenv').config()
const fs = require('fs')
const fsPromise = require('fs/promises')

const FormData = require('form-data')
const express = require('express')
const cors = require('cors')
const multer = require('multer')

const axios = require('axios')
const resize = require('./image-resize.js')

const upload = multer()

const app = express()

app.use(cors())
const port = 3000

axios.defaults.baseURL = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`

app.get('/', async (req, res) => {
  try {
    const response = await axios.get('/getUpdates')
    res.status(200).send(response.data)
  } catch (err) {
    console.error(err)
    res.status(500).send('Oops, something went wrong')
  }
});

app.post('/stickers', upload.single('photo'), async (req, res) => {
  let tmpDir

  try {
    tmpDir = await fsPromise.mkdtemp('./tmp/')
    await resize.resize(tmpDir, req.file.buffer)

    const user_id = process.env.USER_ID
    const name = res.body.name
    const emojis = res.body.emojis

    let formData = new FormData()

    formData.append('user_id', user_id)
    formData.append('name', name)
    formData.append('png_sticker', fs.createReadStream(`${tmpDir}/temp.png`))
    formData.append('emojis', emojis)

    const response = await axios.post(`/addStickerToSet`, formData, {
      headers: formData.getHeaders()
    })

    res.status(202).send(response.data)
  } catch (err) {
    console.error(err)
    res.status(500).send('Oops, something went wrong.')
  }

  fs.rm(tmpDir, { recursive: true, force: true }, (err) => {
    if (err) throw err
  })
})

app.listen(port, () => {
  console.log(`Telegram bot app listening at http://localhost:${port}`)
});
