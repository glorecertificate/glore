import development from '@config/development'
import i18n from '@config/i18n'

export const { countries, course, organization, user } = development.seeder
export const languages = [...new Set(countries.flatMap(country => country.languages))]
export const locales = Object.keys(i18n.locales)
