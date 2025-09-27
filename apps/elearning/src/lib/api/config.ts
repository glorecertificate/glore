import * as auth from './auth/requests'
import * as certificates from './certificates/requests'
import * as courses from './courses/requests'
import * as organizations from './organizations/requests'
import * as users from './users/requests'

export const API_MODULES = { auth, certificates, courses, organizations, users }

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/
