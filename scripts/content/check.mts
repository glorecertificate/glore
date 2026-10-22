#!/usr/bin/env node

import { checkContent, formatProblems } from './validate.mts'

const run = () => {
  const { content, docs, problems } = checkContent()
  if (problems.length > 0) {
    console.error(formatProblems(problems))
    console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} found.`)
    process.exit(1)
  }
  const lessons = content.courses.reduce((sum, course) => sum + course.lessons.length, 0)
  console.info(
    `Content is valid: ${content.groups.length} skill groups, ${content.courses.length} courses, ${lessons} lessons, ${docs.categories.length} doc categories, ${docs.docs.length} docs.`
  )
}

if (import.meta.main) run()
