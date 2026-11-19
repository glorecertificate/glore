#!/usr/bin/env node

import { CreateBucketCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3'

const bucket = process.env.R2_BUCKET_NAME ?? ''

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

if (!process.env.R2_ENDPOINT || !bucket) {
  console.error('Set R2_ENDPOINT and R2_BUCKET_NAME to prepare the e2e bucket.')
  process.exit(1)
}

await client.send(new CreateBucketCommand({ Bucket: bucket }))
await client.send(
  new PutBucketPolicyCommand({
    Bucket: bucket,
    Policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        { Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${bucket}/*`] },
      ],
    }),
  })
)
console.info(`Bucket ${bucket} is ready at ${process.env.R2_ENDPOINT}.`)
