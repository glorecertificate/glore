export const selectUserQuery = `
  *,
  user_organizations (
    role,
    organizations (
      *
    )
  ),
  certificates!user_id (
    *,
    organizations (
      *
    ),
    reviewer:profiles!reviewer_id (
      id,
      first_name,
      last_name,
      email,
      phone,
      avatar_url
    )
  )
`
