export default class AppController {

  static async index (req, res) {
    return res.status(200).send('Hi!')
  }

}
