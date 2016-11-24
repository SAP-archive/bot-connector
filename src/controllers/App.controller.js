class AppController {

  static index (req, res) {
    res.status(200).send('Hi!')
  }

}

module.exports = AppController
