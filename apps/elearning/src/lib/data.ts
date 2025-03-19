import type { Module } from './types'

const modules: Module[] = [
  {
    id: '1',
    title: 'Introduction to Volunteering',
    description: 'Learn the basics of volunteering and its impact on communities.',
    image: '/placeholder.svg?height=200&width=400',
    steps: [
      {
        id: 'step-1',
        type: 'descriptive',
        title: 'What is Volunteering?',
        content: `
# What is Volunteering?

Volunteering is the act of giving your time and services to help others without expecting payment in return. It's a fundamental way to contribute to your community and make a positive impact on society.

## Key Aspects of Volunteering

Volunteering involves:

- **Freely giving your time**: Unlike paid work, volunteering is done by choice.
- **Helping others**: The primary goal is to benefit someone else, a group, or an organization.
- **Community impact**: Volunteers often address needs that might otherwise go unmet.

![Volunteers working together](/placeholder.svg?height=300&width=600)

Volunteering can take many forms, from helping at local food banks to participating in global humanitarian efforts. The common thread is the desire to make a positive difference.
        `,
        images: ['/placeholder.svg?height=300&width=600'],
      },
      {
        id: 'step-2',
        type: 'descriptive',
        title: 'Benefits of Volunteering',
        content: `
# Benefits of Volunteering

Volunteering not only helps those you serve but also provides numerous benefits to you as a volunteer.

## Personal Benefits

- **Skill development**: Gain new abilities and enhance existing ones
- **Network expansion**: Meet like-minded individuals and build connections
- **Improved well-being**: Studies show volunteering can reduce stress and increase happiness

## Professional Benefits

- **Resume enhancement**: Demonstrate commitment and initiative to potential employers
- **Career exploration**: Test different fields without long-term commitment
- **Reference opportunities**: Build relationships with leaders who can vouch for your work

![Personal growth through volunteering](/placeholder.svg?height=300&width=600)

Remember that while these benefits are real, the primary purpose of volunteering remains helping others.
        `,
        images: ['/placeholder.svg?height=300&width=600'],
      },
      {
        id: 'step-3',
        type: 'true-false',
        title: 'Understanding Volunteer Commitment',
        content: `
# Understanding Volunteer Commitment

When you volunteer, you're making a commitment to an organization and the people it serves. This commitment should be taken seriously.

## Reliability Matters

Organizations depend on volunteers showing up when scheduled. When volunteers don't follow through:

- Services may be disrupted
- Staff must scramble to fill gaps
- Those being served may not receive needed help

## Setting Realistic Expectations

It's better to commit to less time and be reliable than to overcommit and frequently cancel. Consider:

- Your current schedule and obligations
- Travel time to and from the volunteer site
- Potential seasonal changes in your availability

Be honest with yourself and the organization about what you can realistically offer.
        `,
        question: 'Volunteering requires no commitment and you can cancel anytime without consequences.',
        correctAnswer: false,
      },
      {
        id: 'step-4',
        type: 'evaluation',
        title: 'Assessing Your Volunteer Readiness',
        content: `
# Assessing Your Volunteer Readiness

Before beginning a volunteer position, it's helpful to reflect on your motivations, expectations, and capacity.

## Self-Reflection

Take some time to consider why you want to volunteer and what you hope to gain from the experience. This self-awareness will help you find opportunities that align with your values and goals.

## Time Management

Volunteering requires dedicating time in your schedule. Consider how much time you realistically have available and how consistently you can commit to volunteering.

## Skills and Interests

Think about what skills you bring to the table and what activities you enjoy. Matching these with volunteer opportunities increases both your satisfaction and your contribution.

Please rate yourself on the following questions to assess your volunteer readiness.
        `,
        questions: [
          {
            id: 'q1',
            question: 'How clear are you about your motivations for volunteering?',
          },
          {
            id: 'q2',
            question: 'How confident are you in your ability to commit regular time to volunteering?',
          },
          {
            id: 'q3',
            question: 'How comfortable are you working with diverse groups of people?',
          },
          {
            id: 'q4',
            question: 'How willing are you to learn new skills for your volunteer role?',
          },
          {
            id: 'q5',
            question: 'How prepared are you to handle challenging situations that may arise while volunteering?',
          },
        ],
      },
    ],
  },
]

export const getModuleById = (id: string): Module | undefined => modules.find(module => module.id === id)
