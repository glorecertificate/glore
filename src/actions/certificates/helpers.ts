export const certificateUserColumns = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const

export const certificateWith = {
  organization: {
    columns: { id: true, name: true },
    with: { profile: { columns: { avatarUrl: true } } },
  },
  skills: {
    with: {
      course: { columns: { id: true, slug: true, title: true } },
    },
  },
} as const

export const certificateWithUsers = {
  ...certificateWith,
  user: { columns: certificateUserColumns },
  reviewer: { columns: certificateUserColumns },
} as const
