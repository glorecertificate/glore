// import { BookCheckIcon, BookOpenIcon, LayoutDashboardIcon, ShieldCheckIcon, type LucideIcon } from 'lucide-react'
// import { getTranslations } from 'next-intl/server'

// import { type Profile } from '@/services/db'

// export enum Route {
//   Dashboard = '/',
//   Login = '/login',
//   Logout = '/logout',
//   Signup = '/signup',
//   ResetPassword = '/reset-password',
//   Modules = '/modules',
//   ModulesInProgress = '/modules/in-progress',
//   ModulesNotStarted = '/modules/new',
//   ModulesCompleted = '/modules/completed',
//   ModulesAll = '/modules/all',
//   Certificates = '/certificates',
//   CertificatesMy = '/certificates/my',
//   CertificatesUnderReview = '/certificates/under-review',
//   CertificatesNew = '/certificates/new',
//   CertificatesAll = '/certificates/all',
//   Documentation = '/docs',
//   DocumentationIntro = '/docs/intro',
//   DocumentationGetStarted = '/docs/get-started',
//   DocumentationTutorials = '/docs/tutorials',
//   DocumentationChangelog = '/docs/changelog',
//   Settings = '/settings',
//   Profile = '/profile',
//   Help = '/help',
// }

// export interface Section {
//   name: string
//   pages: Page[]
// }

// export interface Page {
//   icon?: LucideIcon
//   isActive?: boolean
//   path: Route
//   subpages?: {
//     title: string
//     path: Route
//     isActive?: boolean
//   }[]
//   title: string
// }

// export const getSections = async (profile: Profile) => {
//   const t = await getTranslations('Navigation')

//   const learn: Section = {
//     name: t('learn'),
//     pages: [
//       {
//         title: t('dashboard'),
//         path: Route.Dashboard,
//         icon: LayoutDashboardIcon,
//       },
//       {
//         title: t('modules'),
//         path: Route.Modules,
//         icon: BookCheckIcon,
//         subpages: [
//           {
//             title: t('modulesInProgress'),
//             path: Route.ModulesInProgress,
//           },
//           {
//             title: t('modulesNotStarted'),
//             path: Route.ModulesNotStarted,
//           },
//           {
//             title: t('modulesCompleted'),
//             path: Route.ModulesCompleted,
//           },
//           {
//             title: t('modulesAll'),
//             path: Route.ModulesAll,
//           },
//         ],
//       },
//       {
//         title: t('certificates'),
//         path: Route.Certificates,
//         icon: ShieldCheckIcon,
//         subpages: [
//           {
//             title: t('certificatesMy'),
//             path: Route.CertificatesMy,
//           },
//           {
//             title: t('certificatesUnderReview'),
//             path: Route.CertificatesUnderReview,
//           },
//           {
//             title: t('certificatesNew'),
//             path: Route.CertificatesNew,
//           },
//         ],
//       },
//       {
//         title: 'Documentation',
//         path: Route.Documentation,
//         icon: BookOpenIcon,
//         subpages: [
//           {
//             title: t('documentationIntro'),
//             path: Route.DocumentationIntro,
//           },
//           {
//             title: t('documentationGetStarted'),
//             path: Route.DocumentationGetStarted,
//           },
//           {
//             title: t('documentationTutorials'),
//             path: Route.DocumentationTutorials,
//           },
//           {
//             title: t('documentationChangelog'),
//             path: Route.DocumentationChangelog,
//           },
//         ],
//       },
//     ],
//   }

//   const tutor: Section = {
//     name: t('tutor'),

//   // .map(item => ({
//   //       ...item,
//   //       isActive: pathname === item.path || item.items?.some(subItem => pathname === subItem.path),
//   //       items: item.items?.map(subItem => ({
//   //         ...subItem,
//   //         isActive: pathname === subItem.path,
//   //       })),
//   //     }))

//   const page = pages.find(item => item.isActive)
//   const subPage = page?.items?.find(subItem => subItem.isActive)

//   return { pages, pathname, page, subPage }
// }
