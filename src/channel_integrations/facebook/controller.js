import { validateFacebookToken } from './middlewares'
import { renderOk, BadRequestError, ServiceError } from '../../utils'
import {
  facebookGetAppToken,
  facebookGetClientToken,
  facebookGetExtendedClientToken,
  facebookGetProfile,
  facebookGetUserPages,
  facebookGetPagesTokens,
  facebookGetPagesPictures,
} from './sdk'

const USER_PERM_ADMINISTER = 'ADMINISTER'
const USER_PERM_EDIT_PROFILE = 'EDIT_PROFILE'

const checkClientToken = (clientToken, clientTokenType) => {
  if (!clientToken || clientTokenType !== 'bearer') {
    throw new ServiceError('Error while requesting facebook client token')
  }
}

export default class FacebookController {
  static async getTokenFromCode (req, res) {
    const { facebook_code: code, facebook_redirect: redirectUri } = req.query

    if (!code || !redirectUri) {
      throw new BadRequestError('Missing facebook_code or facebook_redirect parameter')
    }

    const appToken = await facebookGetAppToken()

    const { access_token: clientToken, token_type: clientTokenType, expires_in: clientTokenExpiry }
      = await facebookGetClientToken(code, redirectUri, appToken)

    checkClientToken(clientToken, clientTokenType)

    const clientId = await validateFacebookToken(null, clientToken, appToken)

    return renderOk(res, {
      results: {
        facebook_token: clientToken,
        facebook_user: clientId,
        facebook_expiry: clientTokenExpiry,
      },
      message: 'Facebook token successfully received',
    })
  }

  static async refreshToken (req, res) {
    const { clientId, clientToken, appToken } = req

    const {
      access_token: newClientToken,
      token_type: newClientTokenType,
      expires_in: newClientTokenExpiry,
    }
      = await facebookGetExtendedClientToken(clientToken)

    checkClientToken(newClientToken, newClientTokenType)

    await validateFacebookToken(clientId, newClientToken, appToken)

    return renderOk(res, {
      results: {
        facebook_token: newClientToken,
        facebook_user: clientId,
        facebook_expiry: newClientTokenExpiry,
      },
      message: 'Facebook token successfully refreshed',
    })
  }

  static async getProfile (req, res) {
    const { clientToken } = req

    const fields = 'name,picture'
    const { name, picture: { data: { url: picture } } }
      = await facebookGetProfile(clientToken, fields)

    return renderOk(res, {
      results: {
        name,
        picture,
      },
      message: 'Facebook profile successfully received',
    })
  }

  static async getPages (req, res) {
    const { clientToken, appToken } = req

    const pages = await facebookGetUserPages(clientToken)
    const userAdministeredPages = pages
      .filter(
        page =>
          page.perms.includes(USER_PERM_ADMINISTER)
          || page.perms.includes(USER_PERM_EDIT_PROFILE))
      .reduce((acc, page) => {
        const { name, id } = page
        return {
          ...acc,
          [id]: { name },
        }
      }, {})

    const pageIds = Object.keys(userAdministeredPages)
    const [pagesPictures, pagesTokens] = await Promise.all([
      facebookGetPagesPictures(pageIds, appToken),
      facebookGetPagesTokens(pageIds, clientToken),
    ])

    pagesTokens.forEach((tokenArray) => {
      const pageId = tokenArray[0]
      const pageToken = tokenArray[1]
      userAdministeredPages[pageId].token = pageToken
    })

    pagesPictures.forEach((picture, index) => {
      const picturePageId = pageIds[index]
      userAdministeredPages[picturePageId].picture = picture.url
    })

    return renderOk(res, {
      results: userAdministeredPages,
      message: 'List of facebook pages successfully found',
    })
  }
}
